import { inject, Injectable } from '@angular/core';
import {
  Database,
  ref,
  set,
  push,
  onValue,
  update,
} from '@angular/fire/database';
import type { Participant } from '../models/participant.model';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private db = inject(Database);

  createSession(): Promise<string> {
    const sessionId = push(ref(this.db, 'sessions')).key;
    const sessionRef = ref(this.db, `sessions/${sessionId}`);

    return set(sessionRef, {
      ownerId: sessionId,
      isRevealed: false,
      voteType: 'da',
    }).then(() => sessionId);
  }

  joinSession(
    sessionId: string,
    name: string,
    isOwner = false
  ): Promise<Participant> {
    const participantId = push(
      ref(this.db, `sessions/${sessionId}/participants`)
    ).key;

    const participant = {
      id: participantId,
      name,
      vote: null,
      hasVoted: false,
      isOwner,
      isSpy: false,
      isDead: false,
      votedBy: [],
    } satisfies Participant;

    const participantRef = ref(
      this.db,
      `sessions/${sessionId}/participants/${participantId}`
    );

    return set(participantRef, participant).then(() => {
      localStorage.setItem('participantId', participant.id);
      localStorage.setItem('participantName', participant.name);
      localStorage.setItem('isOwner', String(participant.isOwner));
      return participant;
    });
  }

  vote(
    sessionId: string,
    participantId: string,
    voteForId: string
  ): Promise<void> {
    const participantRef = ref(
      this.db,
      `sessions/${sessionId}/participants/${voteForId}`
    );

    return new Promise((resolve, reject) => {
      onValue(
        participantRef,
        (snapshot) => {
          const participantData = snapshot.val();

          // Safely get votedBy or default to empty array
          const votedBy: string[] = participantData?.votedBy ?? [];

          // Append current voter if not already present
          if (!votedBy.includes(participantId)) {
            votedBy.push(participantId);
          }

          // Update vote and hasVoted for the voter
          const voterRef = ref(
            this.db,
            `sessions/${sessionId}/participants/${participantId}`
          );

          // We update both voter and the voted participant in a batch update
          const updates: Record<string, any> = {};
          updates[`sessions/${sessionId}/participants/${participantId}/vote`] =
            voteForId;
          updates[
            `sessions/${sessionId}/participants/${participantId}/hasVoted`
          ] = true;
          updates[`sessions/${sessionId}/participants/${voteForId}/votedBy`] =
            votedBy;

          update(ref(this.db), updates)
            .then(() => resolve())
            .catch((err) => reject(err));
        },
        { onlyOnce: true }
      );
    });
  }

  reveal(sessionId: string): Promise<void> {
    return update(ref(this.db, `sessions/${sessionId}`), {
      isRevealed: true,
    });
  }

  newRound(sessionId: string): Promise<void> {
    const participantsRef = ref(this.db, `sessions/${sessionId}/participants`);

    return new Promise((resolve, reject) => {
      onValue(
        participantsRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            resolve();
            return;
          }

          const updates: Record<string, any> = {};

          for (const [participantId] of Object.entries(data)) {
            updates[
              `sessions/${sessionId}/participants/${participantId}/vote`
            ] = null;
            updates[
              `sessions/${sessionId}/participants/${participantId}/hasVoted`
            ] = false;
          }

          updates[`sessions/${sessionId}/isRevealed`] = false;

          update(ref(this.db), updates).then(resolve).catch(reject);
        },
        { onlyOnce: true }
      );
    });
  }

  startNewGame(sessionId: string): Promise<void> {
    const participantsRef = ref(this.db, `sessions/${sessionId}/participants`);

    return new Promise((resolve, reject) => {
      onValue(
        participantsRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            resolve();
            return;
          }

          const participantIds = Object.keys(data);
          if (participantIds.length === 0) {
            resolve();
            return;
          }

          // Pick a random participant to be the Spy
          const spyIndex = Math.floor(Math.random() * participantIds.length);
          const spyId = participantIds[spyIndex];

          const updates: Record<string, any> = {};
          for (const id of participantIds) {
            updates[`sessions/${sessionId}/participants/${id}/isDead`] = false;
            updates[`sessions/${sessionId}/participants/${id}/vote`] = null;
            updates[`sessions/${sessionId}/participants/${id}/votedBy`] = [];
            updates[`sessions/${sessionId}/participants/${id}/isSpy`] =
              id === spyId;
          }

          // Reset the revealed status for the session
          updates[`sessions/${sessionId}/isRevealed`] = false;

          update(ref(this.db), updates).then(resolve).catch(reject);
        },
        { onlyOnce: true }
      );
    });
  }

  resetVotes(sessionId: string): Promise<void> {
    const participantsRef = ref(this.db, `sessions/${sessionId}/participants`);

    return new Promise((resolve, reject) => {
      onValue(
        participantsRef,
        (snapshot) => {
          const data = snapshot.val();
          if (!data) {
            resolve();
            return;
          }

          const updates: Record<string, any> = {};
          for (const participantId of Object.keys(data)) {
            updates[
              `sessions/${sessionId}/participants/${participantId}/vote`
            ] = null;
            updates[
              `sessions/${sessionId}/participants/${participantId}/votedBy`
            ] = [];
          }

          update(ref(this.db), updates).then(resolve).catch(reject);
        },
        { onlyOnce: true }
      );
    });
  }

  updateParticipant(
    sessionId: string,
    participantId: string,
    changes: Partial<Participant>
  ): Promise<void> {
    return update(
      ref(this.db, `sessions/${sessionId}/participants/${participantId}`),
      changes
    );
  }
}
