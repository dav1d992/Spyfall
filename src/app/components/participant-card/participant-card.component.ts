import { Component, input, Input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import type { Participant } from '../../models/participant.model';

@Component({
  selector: 'app-participant-card',
  standalone: true,
  imports: [],
  templateUrl: './participant-card.component.html',
  styleUrl: './participant-card.component.scss',
  animations: [
    trigger('voteReveal', [
      transition(':enter', [
        style({ opacity: 0, transform: 'rotate(0deg)' }),
        animate(
          '1s linear',
          style({ opacity: 1, transform: 'rotate(3600deg)' })
        ),
      ]),
    ]),
  ],
})
export class ParticipantCardComponent {
  readonly participant = input.required<Participant>();
  readonly isRevealed = input<boolean>(false);
  readonly isHighlighted = input<boolean>(false);
}
