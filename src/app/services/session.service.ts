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
      voteType: 'dk',
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

  vote(sessionId: string, participantId: string, vote: string): Promise<void> {
    return update(
      ref(this.db, `sessions/${sessionId}/participants/${participantId}`),
      {
        vote,
        hasVoted: true,
      }
    );
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

  updateVoteType(
    sessionId: string,
    voteType: 'fibonacci' | 'onetoten' | 'double' | 'onetofortynine'
  ): Promise<void> {
    const sessionRef = ref(this.db, `sessions/${sessionId}`);
    return update(sessionRef, { voteType });
  }
}
