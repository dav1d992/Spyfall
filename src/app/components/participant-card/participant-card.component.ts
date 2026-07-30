import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Participant } from '../../models/participant.model';

@Component({
  selector: 'app-participant-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './participant-card.component.html',
  styleUrl: './participant-card.component.scss',
})
export class ParticipantCardComponent {
  readonly participant = input.required<Participant>();
  readonly isMe = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly hasVoted = input<boolean>(false);
  /** Number of votes this player received (voting / reveal phase). */
  readonly voteCount = input<number | null>(null);
  /** When true, expose whether this player was the spy + their role. */
  readonly revealRoles = input<boolean>(false);
  /** The resolved role text to show when revealing. */
  readonly roleText = input<string>('');

  get initials(): string {
    return this.participant()
      .name.trim()
      .slice(0, 2)
      .toUpperCase();
  }
}
