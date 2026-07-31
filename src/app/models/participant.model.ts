/** Supported UI / content languages. */
export type Language = 'en' | 'da';

/** Phases a game session moves through. */
export type GameStatus = 'lobby' | 'playing' | 'voting' | 'revealed';

/** How a finished round was decided. */
export type Outcome =
  | 'spy-caught' // players voted out the spy
  | 'spy-escaped' // players voted out an innocent
  | 'spy-guessed' // spy correctly guessed the location
  | 'spy-wrong'; // spy guessed the wrong location

/** A single player in a session. */
export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isSpy: boolean;
  joinedAt: number;
  /** Timestamp of the player's last check-in (presence heartbeat). */
  lastSeen?: number;
}

/** The current round's secret information + progress. */
export interface Round {
  locationId: string;
  spyId: string;
  startedAt: number;
  durationSec: number;
  outcome?: Outcome;
  /** Location id the spy guessed, if any. */
  spyGuess?: string;
}

/** Top-level session document stored in Realtime Database. */
export interface Session {
  hostId: string;
  status: GameStatus;
  language: Language;
  createdAt: number;
  round?: Round;
  participants?: Record<string, Participant>;
  /** Map of voterId -> targetId during the voting phase. */
  votes?: Record<string, string>;
  /** Map of participantId -> true when a player is ready to vote. */
  ready?: Record<string, boolean>;
}
