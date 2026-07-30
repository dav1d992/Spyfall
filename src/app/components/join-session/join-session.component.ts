import { Component, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-join-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-session.component.html',
  styleUrl: './join-session.component.scss',
})
export class JoinSessionComponent implements OnInit {
  /** Bound from the `/join/:sessionId` route parameter. */
  readonly sessionId = input.required<string>();

  private router = inject(Router);
  private service = inject(SessionService);

  name = '';
  readonly busy = signal(false);
  readonly error = signal('');
  readonly checking = signal(true);
  readonly notFound = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const exists = await this.service.sessionExists(this.sessionId());
      this.notFound.set(!exists);
    } catch {
      this.notFound.set(true);
    } finally {
      this.checking.set(false);
    }

    // If this browser already joined this room, jump straight in.
    if (this.service.getMyId(this.sessionId())) {
      this.router.navigate(['/session', this.sessionId()]);
    }
  }

  async join(): Promise<void> {
    const name = this.name.trim();
    if (!name || this.busy() || this.notFound()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.service.joinSession(this.sessionId(), name);
      await this.router.navigate(['/session', this.sessionId()]);
    } catch (err) {
      console.error(err);
      this.error.set('Could not join the room. Try again.');
      this.busy.set(false);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
