import {
  Component,
  computed,
  inject,
  input,
  signal,
  effect,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessionService } from '../../services/session.service';
import { ParticipantCardComponent } from '../participant-card/participant-card.component';
import { LOCATIONS, LOCATION_BY_ID, CIVILIAN_LABEL } from '../../data/locations';
import { ROOM_I18N } from '../../data/i18n';
import type {
  Language,
  Participant,
  Session,
} from '../../models/participant.model';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, ParticipantCardComponent],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss',
})
export class GameBoardComponent implements OnInit, OnDestroy {
  /** Bound from the `/session/:sessionId` route parameter. */
  readonly sessionId = input.required<string>();

  private router = inject(Router);
  private service = inject(SessionService);

  private sub?: Subscription;
  private ticker?: ReturnType<typeof setInterval>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private lastRoundKey = '';
  private lastStatusSeen = '';
  private phaseTimer?: ReturnType<typeof setTimeout>;
  private autoVoteFired = false;
  private autoRevealFired = false;

  readonly session = signal<Session | null>(null);
  readonly now = signal(Date.now());
  readonly myId = signal<string>('');

  readonly roleRevealed = signal(false);
  readonly crossed = signal<Set<string>>(new Set());
  readonly showGuess = signal(false);
  readonly copied = signal(false);
  readonly actionError = signal('');

  /** Drives the full-screen phase-change animation. */
  readonly phaseFx = signal<'to-vote' | 'to-board' | null>(null);

  constructor() {
    // Reset per-round local UI when a fresh round starts.
    effect(() => {
      const round = this.session()?.round;
      const key = round ? `${round.locationId}:${round.startedAt}` : '';
      if (key !== this.lastRoundKey) {
        this.lastRoundKey = key;
        this.roleRevealed.set(false);
        this.crossed.set(new Set());
        this.showGuess.set(false);
      }
    });

    // Play a cool transition whenever the phase changes.
    effect(() => {
      const status = this.status();
      if (this.lastStatusSeen && status !== this.lastStatusSeen) {
        if (status === 'voting') {
          this.triggerPhase('to-vote');
        } else if (
          status === 'playing' &&
          (this.lastStatusSeen === 'voting' || this.lastStatusSeen === 'revealed')
        ) {
          this.triggerPhase('to-board');
        }
      }
      this.lastStatusSeen = status;
    });

    // Host acts as silent authority: auto-start the vote once everyone is
    // ready — nobody manually "calls" the vote.
    effect(() => {
      const status = this.status();
      if (status !== 'playing') {
        this.autoVoteFired = false;
        return;
      }
      if (!this.isHost()) return;
      const players = this.participants();
      if (players.length < 3) return;
      const ready = this.readyMap();
      if (players.every((p) => ready[p.id]) && !this.autoVoteFired) {
        this.autoVoteFired = true;
        this.service.callVote(this.sessionId()).catch(() => {});
      }
    });

    // Auto-reveal results once everyone has cast a vote.
    effect(() => {
      const status = this.status();
      if (status !== 'voting') {
        this.autoRevealFired = false;
        return;
      }
      if (!this.isHost()) return;
      const players = this.participants();
      const votes = this.session()?.votes ?? {};
      if (
        players.length > 0 &&
        players.every((p) => votes[p.id]) &&
        !this.autoRevealFired
      ) {
        this.autoRevealFired = true;
        this.service.revealVoteResults(this.sessionId()).catch(() => {});
      }
    });
  }

  private triggerPhase(kind: 'to-vote' | 'to-board'): void {
    this.phaseFx.set(kind);
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
    this.phaseTimer = setTimeout(() => this.phaseFx.set(null), 2400);
  }

  ngOnInit(): void {
    const id = this.sessionId();
    const myId = this.service.getMyId(id);
    if (!myId) {
      this.router.navigate(['/join', id]);
      return;
    }
    this.myId.set(myId);

    // Presence: check in now and periodically so we can tell who is still
    // around. We no longer drop players the instant their connection blips
    // (e.g. switching to Messenger to share the invite link). Instead, any
    // client prunes players who have been silent past the grace window.
    this.service.touch(id, myId);
    this.heartbeat = setInterval(() => {
      this.service.touch(id, myId);
      this.service.pruneInactive(id, myId).catch(() => {});
    }, 30000);

    this.sub = this.service.watchSession(id).subscribe((session) => {
      if (!session) {
        // Room closed / never existed.
        this.service.clearMyId(id);
        this.router.navigate(['/']);
        return;
      }
      if (!session.participants || !session.participants[this.myId()]) {
        // We were removed or never really joined. If the room is now empty,
        // clean up the leftover shell so it doesn't linger in the database.
        this.service.deleteIfEmpty(id);
        this.router.navigate(['/join', id]);
        return;
      }
      this.session.set(session);
    });

    this.ticker = setInterval(() => this.now.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.ticker) clearInterval(this.ticker);
    if (this.heartbeat) clearInterval(this.heartbeat);
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
  }

  // --------------------------------------------------------------------------
  // Derived state
  // --------------------------------------------------------------------------

  readonly participants = computed<Participant[]>(() => {
    const map = this.session()?.participants ?? {};
    return Object.values(map).sort((a, b) => a.joinedAt - b.joinedAt);
  });

  readonly me = computed<Participant | undefined>(() =>
    this.participants().find((p) => p.id === this.myId()),
  );

  readonly isHost = computed(() => !!this.me()?.isHost);
  readonly status = computed(() => this.session()?.status ?? 'lobby');
  readonly language = computed<Language>(() => this.session()?.language ?? 'en');

  /** Localized strings for the current room language. */
  readonly t = computed(() => ROOM_I18N[this.language()]);

  readonly location = computed(() => {
    const locId = this.session()?.round?.locationId;
    return locId ? LOCATION_BY_ID[locId] : undefined;
  });

  readonly amSpy = computed(() => !!this.me()?.isSpy);

  /** Localized label shown for everyone who isn't the spy. */
  readonly civilianLabel = computed(() => CIVILIAN_LABEL[this.language()]);

  /** Ready-to-vote state. */
  readonly readyMap = computed<Record<string, boolean>>(
    () => this.session()?.ready ?? {},
  );
  readonly myReady = computed(() => !!this.readyMap()[this.myId()]);
  readonly readyCount = computed(
    () => this.participants().filter((p) => this.readyMap()[p.id]).length,
  );
  isReady(id: string): boolean {
    return !!this.readyMap()[id];
  }

  /** All locations, localized, for the reference grid + spy guess. */
  readonly locationList = computed(() =>
    LOCATIONS.map((l) => ({
      id: l.id,
      emoji: l.emoji,
      name: l.names[this.language()],
    })).sort((a, b) => a.name.localeCompare(b.name)),
  );

  readonly voteTally = computed<Record<string, number>>(() => {
    const votes = this.session()?.votes ?? {};
    const tally: Record<string, number> = {};
    for (const target of Object.values(votes)) {
      tally[target] = (tally[target] ?? 0) + 1;
    }
    return tally;
  });

  readonly myVote = computed<string | undefined>(
    () => this.session()?.votes?.[this.myId()],
  );

  readonly votesCast = computed(
    () => Object.keys(this.session()?.votes ?? {}).length,
  );

  readonly timeLeftMs = computed(() => {
    const round = this.session()?.round;
    if (!round) return 0;
    const end = round.startedAt + round.durationSec * 1000;
    return Math.max(0, end - this.now());
  });

  readonly timeUp = computed(() => this.timeLeftMs() === 0);

  readonly timeLabel = computed(() => {
    const total = Math.floor(this.timeLeftMs() / 1000);
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  readonly canStart = computed(
    () => this.isHost() && this.participants().length >= 3,
  );

  readonly outcome = computed(() => this.session()?.round?.outcome);

  readonly spy = computed(() =>
    this.participants().find((p) => p.isSpy),
  );

  readonly outcomeInfo = computed(() => {
    const o = this.t().outcomes;
    switch (this.outcome()) {
      case 'spy-caught':
        return { emoji: '🎯', ...o['spy-caught'], win: true };
      case 'spy-escaped':
        return { emoji: '🫥', ...o['spy-escaped'], win: false };
      case 'spy-guessed':
        return { emoji: '🧠', ...o['spy-guessed'], win: false };
      case 'spy-wrong':
        return { emoji: '💥', ...o['spy-wrong'], win: true };
      default:
        return { emoji: '🕵️', ...o.default, win: true };
    }
  });

  roleTextFor(p: Participant): string {
    return p.isSpy ? '' : this.civilianLabel();
  }

  voteCountFor(id: string): number {
    return this.voteTally()[id] ?? 0;
  }

  hasVoted(id: string): boolean {
    return !!this.session()?.votes?.[id];
  }

  guessName(): string {
    const guess = this.session()?.round?.spyGuess;
    if (!guess) return '';
    const loc = LOCATION_BY_ID[guess];
    return loc ? `${loc.emoji} ${loc.names[this.language()]}` : '';
  }

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  async start(): Promise<void> {
    if (!this.canStart()) return;
    await this.run(() => this.service.startRound(this.sessionId()));
  }

  /** Flip the secret role card face up/down. */
  toggleRole(): void {
    this.roleRevealed.set(!this.roleRevealed());
  }

  /** Toggle my "ready to vote" state. */
  async toggleReady(): Promise<void> {
    const next = !this.myReady();
    await this.run(() =>
      this.service.setReady(this.sessionId(), this.myId(), next),
    );
  }

  async vote(targetId: string): Promise<void> {
    if (this.status() !== 'voting') return;
    if (targetId === this.myId()) return;
    await this.run(() =>
      this.service.castVote(this.sessionId(), this.myId(), targetId),
    );
  }

  async guess(locationId: string): Promise<void> {
    this.showGuess.set(false);
    await this.run(() =>
      this.service.submitSpyGuess(this.sessionId(), locationId),
    );
  }

  async newRound(): Promise<void> {
    await this.run(() => this.service.startRound(this.sessionId()));
  }

  async toLobby(): Promise<void> {
    await this.run(() => this.service.returnToLobby(this.sessionId()));
  }

  async setLanguage(lang: Language): Promise<void> {
    if (!this.isHost()) return;
    await this.run(() => this.service.setLanguage(this.sessionId(), lang));
  }

  async leave(): Promise<void> {
    const id = this.sessionId();
    await this.service.leaveSession(id, this.myId());
    this.router.navigate(['/']);
  }

  toggleCross(id: string): void {
    const next = new Set(this.crossed());
    next.has(id) ? next.delete(id) : next.add(id);
    this.crossed.set(next);
  }

  isCrossed(id: string): boolean {
    return this.crossed().has(id);
  }

  async copyLink(): Promise<void> {
    const url = `${window.location.origin}/join/${this.sessionId()}`;
    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    this.actionError.set('');
    try {
      await fn();
    } catch (err) {
      console.error(err);
      this.actionError.set(
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    }
  }
}
