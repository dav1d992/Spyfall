import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Database, ref, onValue } from '@angular/fire/database';
import { SessionService } from '../../services/session.service';
import { ParticipantCardComponent } from '../participant-card/participant-card.component';
import type { Participant } from '../../models/participant.model';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-planning-board',
  standalone: true,
  imports: [CommonModule, ParticipantCardComponent],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
  animations: [
    trigger('voteReveal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'rotate(0deg)' }),
        animate(
          '2s linear',
          style({ opacity: 1, transform: 'rotate(7200deg)' })
        ),
      ]),
    ]),
  ],
})
export class GameBoardComponent {
  private route = inject(ActivatedRoute);
  private db = inject(Database);
  private service = inject(SessionService);

  sessionId = this.route.snapshot.paramMap.get('sessionId');
  participants: Participant[] = [];
  isRevealed = false;
  isOwner = false;
  isDropdownOpen = false;
  ownerName = '';

  locationOptions: string[] = [];
  currentParticipantId = '';
  currentParticipant?: Participant;
  selectedParticipantId?: string;

  private readonly locationPresets: Record<string, string[]> = {
    da: [
      'Flyvemaskine',
      'Strand',
      'Casino',
      'Katedral',
      'Cirkus',
      'Firmafest',
      'Korstogshær',
      'Wellnesscenter',
      'Ambassade',
      'Hospital',
      'Hotel',
      'Militærbase',
      'Filmstudie',
      'Krydstogtskib',
      'Passagertog',
      'Pirat Skib',
      'Polarstation',
      'Politistation',
      'Restaurant',
      'Skole',
      'Tankstation',
      'Rumstation',
      'Ubåd',
      'Supermarked',
      'Teater',
      'Universitet',
      'Forlystelsespark',
      'Plejehjem',
      'Kunstmuseum',
    ],
    en: [
      'Airplane',
      'Beach',
      'Casino',
      'Cathedral',
      'Circus',
      'Corporate Party',
      'Crusader Army',
      'Day Spa',
      'Embassy',
      'Hospital',
      'Hotel',
      'Military Base',
      'Movie Studio',
      'Ocean Liner',
      'Passenger Train',
      'Pirate Ship',
      'Polar Station',
      'Police Station',
      'Restaurant',
      'School',
      'Service Station',
      'Space Station',
      'Submarine',
      'Supermarket',
      'Theater',
      'University',
      'Amusement Park',
      'Retirement Home',
      'Art Museum',
    ],
  };

  constructor() {
    this.setLocationType('en');
    const sessionRef = ref(this.db, `sessions/${this.sessionId}`);
    const participantsRef = ref(
      this.db,
      `sessions/${this.sessionId}/participants`
    );

    onValue(participantsRef, (snapshot) => {
      const data: Record<string, Omit<Participant, 'id'>> = snapshot.val() ||
      {};

      this.participants = Object.entries(data).map(
        ([id, value]): Participant => {
          const participant: Participant = { id, ...value };

          if (id === this.currentParticipantId) {
            this.currentParticipant = participant;
          }
          return participant;
        }
      );
    });

    onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      this.isRevealed = data?.isRevealed;
      this.isOwner = data?.isOwner;
      this.ownerName = data?.ownerName || '';
    });

    this.currentParticipantId = localStorage.getItem('participantId') || '';
  }

  setLocationType(type: 'da' | 'en') {
    if (!this.sessionId) return;
    this.locationOptions = this.locationPresets[type];
  }

  reveal() {
    // if (!this.sessionId) return;
    // this.service.reveal(this.sessionId);

    const maxVotes = Math.max(
      ...this.participants.map((p) => p.votedBy?.length ?? 0)
    );

    const topParticipants = this.participants.filter(
      (p) => (p.votedBy?.length ?? 0) === maxVotes
    );

    if (topParticipants.length > 1) {
      console.log('TIE, no one dies', topParticipants);
      this.service
        .resetVotes(this.sessionId!)
        .then(() => console.log('All votes reset!'))
        .catch((error) => console.error(error));
    } else {
      this.service
        .updateParticipant(this.sessionId!, topParticipants[0].id, {
          isDead: false,
        })
        .then(() => {
          console.log('This one died:', topParticipants[0]);
        });

      if (topParticipants[0].isSpy) {
        console.log('The innocent won:', topParticipants[0]);
      } else {
        if (
          this.participants.filter((participant) => !participant.isDead)
            .length === 1
        ) {
          console.log(
            'The Spy has won. Congrats',
            this.participants.find((participant) => participant.isSpy)
          );
        } else {
          console.log('The Spy is still amongst you. The game continues.');
          this.service
            .resetVotes(this.sessionId!)
            .then(() => console.log('All votes reset!'))
            .catch((error) => console.error(error));
        }
      }
    }
  }

  start() {
    if (!this.sessionId) return;

    this.service
      .startNewGame(this.sessionId)
      .then(() => console.log('New game started!'))
      .catch((err) => console.error(err));
  }

  selectParticipant(id: string) {
    if (
      !this.currentParticipantId ||
      this.currentParticipantId === id ||
      !this.sessionId
    )
      return;
    this.selectedParticipantId =
      this.selectedParticipantId === id ? undefined : id;

    this.service.vote(this.sessionId, this.currentParticipantId, id);
  }

  getJoinLink() {
    const currentUrl = window.location.href;
    const joinUrl = currentUrl.replace('/session/', '/join/');

    navigator.clipboard.writeText(joinUrl);
  }

  get numericVotes(): number[] {
    return this.participants
      .map((p) => Number(p.vote))
      .filter((v) => !Number.isNaN(v));
  }

  get highestVote(): number | null {
    const votes = this.numericVotes;
    return votes.length ? Math.max(...votes) : null;
  }

  get lowestVote(): number | null {
    const votes = this.numericVotes;
    return votes.length ? Math.min(...votes) : null;
  }

  crossedLocations = new Set<string>();

  toggleCross(location: string) {
    if (this.crossedLocations.has(location)) {
      this.crossedLocations.delete(location);
    } else {
      this.crossedLocations.add(location);
    }
  }
}
