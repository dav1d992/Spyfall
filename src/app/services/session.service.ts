import { inject, Injectable } from '@angular/core';
import {
  ref,
  set,
  update,
  push,
  get,
  remove,
  onValue,
  onDisconnect,
} from 'firebase/database';
import { Observable } from 'rxjs';
import { FIREBASE_DB } from '../core/firebase';
import { LOCATIONS } from '../data/locations';
import type {
  Language,
  Outcome,
  Participant,
  Session,
} from '../models/participant.model';

/** Result of creating or joining a session. */
export interface JoinResult {
  sessionId: string;
  participantId: string;
}

const STORAGE_PREFIX = 'spyfall:';

/** Reject if a Firebase call doesn't settle in time (e.g. DB unreachable). */
function withTimeout<T>(promise: Promise<T>, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Couldn't reach the database. Check your connection or that the Realtime Database is active.",
            ),
          ),
        ms,
      ),
    ),
  ]);
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private db = inject(FIREBASE_DB);

  // ---------------------------------------------------------------------------
  // Local identity helpers
  // ---------------------------------------------------------------------------

  /** The participant id this browser owns for the given session, if any. */
  getMyId(sessionId: string): string | null {
    return localStorage.getItem(STORAGE_PREFIX + sessionId);
  }

  private setMyId(sessionId: string, participantId: string): void {
    localStorage.setItem(STORAGE_PREFIX + sessionId, participantId);
  }

  clearMyId(sessionId: string): void {
    localStorage.removeItem(STORAGE_PREFIX + sessionId);
  }

  // ---------------------------------------------------------------------------
  // Reactive reads
  // ---------------------------------------------------------------------------

  /** Live stream of the whole session document. */
  watchSession(sessionId: string): Observable<Session | null> {
    return new Observable<Session | null>((subscriber) => {
      const sessionRef = ref(this.db, `sessions/${sessionId}`);
      const unsubscribe = onValue(
        sessionRef,
        (snapshot) => subscriber.next(snapshot.val() as Session | null),
        (error) => subscriber.error(error),
      );
      return () => unsubscribe();
    });
  }

  async sessionExists(sessionId: string): Promise<boolean> {
    const snapshot = await withTimeout(
      get(ref(this.db, `sessions/${sessionId}`)),
    );
    return snapshot.exists();
  }

  // ---------------------------------------------------------------------------
  // Create / join / leave
  // ---------------------------------------------------------------------------

  async createSession(
    hostName: string,
    language: Language = 'en',
  ): Promise<JoinResult> {
    const sessionRef = push(ref(this.db, 'sessions'));
    const sessionId = sessionRef.key!;

    const participantRef = push(
      ref(this.db, `sessions/${sessionId}/participants`),
    );
    const participantId = participantRef.key!;

    const host: Participant = {
      id: participantId,
      name: hostName.trim(),
      isHost: true,
      isSpy: false,
      joinedAt: Date.now(),
    };

    const session: Session = {
      hostId: participantId,
      status: 'lobby',
      language,
      createdAt: Date.now(),
      participants: { [participantId]: host },
    };

    await withTimeout(set(sessionRef, session));
    this.setMyId(sessionId, participantId);
    return { sessionId, participantId };
  }

  async joinSession(sessionId: string, name: string): Promise<JoinResult> {
    const participantRef = push(
      ref(this.db, `sessions/${sessionId}/participants`),
    );
    const participantId = participantRef.key!;

    const participant: Participant = {
      id: participantId,
      name: name.trim(),
      isHost: false,
      isSpy: false,
      joinedAt: Date.now(),
    };

    await withTimeout(set(participantRef, participant));
    this.setMyId(sessionId, participantId);
    return { sessionId, participantId };
  }

  /** Remove a participant. If the host leaves, hand off to the next player. */
  async leaveSession(sessionId: string, participantId: string): Promise<void> {
    const snapshot = await get(ref(this.db, `sessions/${sessionId}`));
    const session = snapshot.val() as Session | null;
    this.clearMyId(sessionId);
    if (!session) return;

    const participants = session.participants ?? {};
    delete participants[participantId];
    const remaining = Object.keys(participants);

    if (remaining.length === 0) {
      // Last one out closes the room.
      await remove(ref(this.db, `sessions/${sessionId}`));
      return;
    }

    const updates: Record<string, unknown> = {};
    updates[`sessions/${sessionId}/participants/${participantId}`] = null;
    updates[`sessions/${sessionId}/votes/${participantId}`] = null;
    updates[`sessions/${sessionId}/ready/${participantId}`] = null;

    if (session.hostId === participantId) {
      const newHostId = remaining.sort(
        (a, b) => participants[a].joinedAt - participants[b].joinedAt,
      )[0];
      updates[`sessions/${sessionId}/hostId`] = newHostId;
      updates[`sessions/${sessionId}/participants/${newHostId}/isHost`] = true;
    }

    await update(ref(this.db), updates);
  }

  /**
   * Auto-remove this participant if their tab closes or the connection drops.
   * This keeps abandoned rooms from lingering and eating storage/quota.
   */
  setupPresence(sessionId: string, participantId: string): void {
    const pRef = ref(
      this.db,
      `sessions/${sessionId}/participants/${participantId}`,
    );
    onDisconnect(pRef).remove().catch(() => {});
  }

  /** Cancel a queued auto-removal (used for a clean, intentional leave). */
  cancelPresence(sessionId: string, participantId: string): void {
    const pRef = ref(
      this.db,
      `sessions/${sessionId}/participants/${participantId}`,
    );
    onDisconnect(pRef).cancel().catch(() => {});
  }

  /** Delete the whole room if no participants remain (cleans up shells). */
  async deleteIfEmpty(sessionId: string): Promise<void> {
    const snapshot = await get(
      ref(this.db, `sessions/${sessionId}/participants`),
    );
    if (!snapshot.exists()) {
      await remove(ref(this.db, `sessions/${sessionId}`)).catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------
  // Round lifecycle (host actions)
  // ---------------------------------------------------------------------------

  /** Assign a random location, a random spy and unique roles, then start. */
  async startRound(sessionId: string, durationSec = 480): Promise<void> {
    const snapshot = await get(
      ref(this.db, `sessions/${sessionId}/participants`),
    );
    const participants = (snapshot.val() ?? {}) as Record<string, Participant>;
    const ids = Object.keys(participants);
    if (ids.length < 3) {
      throw new Error('Need at least 3 players to start.');
    }

    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const spyId = ids[Math.floor(Math.random() * ids.length)];

    const updates: Record<string, unknown> = {};
    for (const id of ids) {
      updates[`sessions/${sessionId}/participants/${id}/isSpy`] = id === spyId;
    }

    updates[`sessions/${sessionId}/status`] = 'playing';
    updates[`sessions/${sessionId}/votes`] = null;
    updates[`sessions/${sessionId}/ready`] = null;
    updates[`sessions/${sessionId}/round`] = {
      locationId: location.id,
      spyId,
      startedAt: Date.now(),
      durationSec,
    };

    await update(ref(this.db), updates);
  }

  /** Move from playing into the voting phase. */
  async callVote(sessionId: string): Promise<void> {
    await update(ref(this.db, `sessions/${sessionId}`), {
      status: 'voting',
      votes: null,
      ready: null,
    });
  }

  /** Flag (or unflag) a player as ready to vote. */
  async setReady(
    sessionId: string,
    participantId: string,
    ready: boolean,
  ): Promise<void> {
    await set(
      ref(this.db, `sessions/${sessionId}/ready/${participantId}`),
      ready ? true : null,
    );
  }

  /** A player casts (or changes) their vote for the suspected spy. */
  async castVote(
    sessionId: string,
    voterId: string,
    targetId: string,
  ): Promise<void> {
    await set(
      ref(this.db, `sessions/${sessionId}/votes/${voterId}`),
      targetId,
    );
  }

  /** Host tallies the votes and reveals the outcome. */
  async revealVoteResults(sessionId: string): Promise<void> {
    const snapshot = await get(ref(this.db, `sessions/${sessionId}`));
    const session = snapshot.val() as Session | null;
    if (!session?.round) return;

    const votes = session.votes ?? {};
    const tally: Record<string, number> = {};
    for (const target of Object.values(votes)) {
      tally[target] = (tally[target] ?? 0) + 1;
    }

    let accusedId: string | null = null;
    let topCount = 0;
    let tie = false;
    for (const [id, count] of Object.entries(tally)) {
      if (count > topCount) {
        topCount = count;
        accusedId = id;
        tie = false;
      } else if (count === topCount) {
        tie = true;
      }
    }

    const outcome: Outcome =
      !tie && accusedId === session.round.spyId ? 'spy-caught' : 'spy-escaped';

    await update(ref(this.db, `sessions/${sessionId}`), {
      status: 'revealed',
      'round/outcome': outcome,
    });
  }

  /** The spy submits a location guess, ending the round immediately. */
  async submitSpyGuess(
    sessionId: string,
    locationId: string,
  ): Promise<void> {
    const snapshot = await get(ref(this.db, `sessions/${sessionId}/round`));
    const round = snapshot.val() as Session['round'];
    if (!round) return;

    const outcome: Outcome =
      locationId === round.locationId ? 'spy-guessed' : 'spy-wrong';

    await update(ref(this.db, `sessions/${sessionId}`), {
      status: 'revealed',
      'round/spyGuess': locationId,
      'round/outcome': outcome,
    });
  }

  /** Return everyone to the lobby, clearing the round. */
  async returnToLobby(sessionId: string): Promise<void> {
    const snapshot = await get(
      ref(this.db, `sessions/${sessionId}/participants`),
    );
    const participants = (snapshot.val() ?? {}) as Record<string, Participant>;

    const updates: Record<string, unknown> = {};
    for (const id of Object.keys(participants)) {
      updates[`sessions/${sessionId}/participants/${id}/isSpy`] = false;
    }
    updates[`sessions/${sessionId}/status`] = 'lobby';
    updates[`sessions/${sessionId}/round`] = null;
    updates[`sessions/${sessionId}/votes`] = null;
    updates[`sessions/${sessionId}/ready`] = null;

    await update(ref(this.db), updates);
  }

  async setLanguage(sessionId: string, language: Language): Promise<void> {
    await update(ref(this.db, `sessions/${sessionId}`), { language });
  }
}
