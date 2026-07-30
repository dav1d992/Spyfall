import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { Component, inject, signal } from '@angular/core';
import type { Language } from '../../models/participant.model';

type Mode = 'create' | 'join';

@Component({
  selector: 'app-create-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-session.component.html',
  styleUrl: './create-session.component.scss',
})
export class CreateSessionComponent {
  private router = inject(Router);
  private service = inject(SessionService);

  readonly mode = signal<Mode>('create');
  readonly busy = signal(false);
  readonly error = signal('');

  name = '';
  roomCode = '';
  language: Language = 'en';

  /** Custom language dropdown state. */
  readonly langOpen = signal(false);
  readonly languages: ReadonlyArray<{ value: Language; label: string }> = [
    { value: 'en', label: 'English' },
    { value: 'da', label: 'Dansk' },
  ];

  get languageLabel(): string {
    return this.languages.find((l) => l.value === this.language)?.label ?? '';
  }

  toggleLang(): void {
    this.langOpen.set(!this.langOpen());
  }

  selectLang(value: Language): void {
    this.language = value;
    this.langOpen.set(false);
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.error.set('');
  }

  async create(): Promise<void> {
    const name = this.name.trim();
    if (!name || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const { sessionId } = await this.service.createSession(
        name,
        this.language,
      );
      await this.router.navigate(['/session', sessionId]);
    } catch (err) {
      console.error(err);
      this.error.set('Could not create a room. Check your Firebase config.');
      this.busy.set(false);
    }
  }

  async join(): Promise<void> {
    const name = this.name.trim();
    const code = this.roomCode.trim();
    if (!name || !code || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const exists = await this.service.sessionExists(code);
      if (!exists) {
        this.error.set('No room found with that code.');
        this.busy.set(false);
        return;
      }
      await this.service.joinSession(code, name);
      await this.router.navigate(['/session', code]);
    } catch (err) {
      console.error(err);
      this.error.set('Could not join the room. Try again.');
      this.busy.set(false);
    }
  }
}
