import type { Language } from '../models/participant.model';

/** A location the game can take place at, with a localized name. */
export interface GameLocation {
  id: string;
  emoji: string;
  names: Record<Language, string>;
}

/** Localized label for a non-spy player. */
export const CIVILIAN_LABEL: Record<Language, string> = {
  en: 'Civilian',
  da: 'Civil',
};

/**
 * The pool of possible locations. Everyone who isn't the spy simply knows the
 * location (they are a "Civilian"); only the spy is left in the dark.
 */
export const LOCATIONS: GameLocation[] = [
  { id: 'airplane', emoji: '✈️', names: { en: 'Airplane', da: 'Flyvemaskine' } },
  { id: 'beach', emoji: '🏖️', names: { en: 'Beach', da: 'Strand' } },
  { id: 'casino', emoji: '🎰', names: { en: 'Casino', da: 'Casino' } },
  { id: 'cathedral', emoji: '⛪', names: { en: 'Cathedral', da: 'Katedral' } },
  { id: 'circus', emoji: '🎪', names: { en: 'Circus', da: 'Cirkus' } },
  { id: 'corporate-party', emoji: '🎉', names: { en: 'Corporate Party', da: 'Firmafest' } },
  { id: 'day-spa', emoji: '💆', names: { en: 'Day Spa', da: 'Wellnesscenter' } },
  { id: 'embassy', emoji: '🏛️', names: { en: 'Embassy', da: 'Ambassade' } },
  { id: 'hospital', emoji: '🏥', names: { en: 'Hospital', da: 'Hospital' } },
  { id: 'hotel', emoji: '🏨', names: { en: 'Hotel', da: 'Hotel' } },
  { id: 'military-base', emoji: '🪖', names: { en: 'Military Base', da: 'Militærbase' } },
  { id: 'movie-studio', emoji: '🎬', names: { en: 'Movie Studio', da: 'Filmstudie' } },
  { id: 'ocean-liner', emoji: '🚢', names: { en: 'Ocean Liner', da: 'Krydstogtskib' } },
  { id: 'passenger-train', emoji: '🚆', names: { en: 'Passenger Train', da: 'Passagertog' } },
  { id: 'pirate-ship', emoji: '🏴‍☠️', names: { en: 'Pirate Ship', da: 'Piratskib' } },
  { id: 'polar-station', emoji: '❄️', names: { en: 'Polar Station', da: 'Polarstation' } },
  { id: 'police-station', emoji: '👮', names: { en: 'Police Station', da: 'Politistation' } },
  { id: 'restaurant', emoji: '🍽️', names: { en: 'Restaurant', da: 'Restaurant' } },
  { id: 'school', emoji: '🏫', names: { en: 'School', da: 'Skole' } },
  { id: 'space-station', emoji: '🛰️', names: { en: 'Space Station', da: 'Rumstation' } },
  { id: 'submarine', emoji: '🛥️', names: { en: 'Submarine', da: 'Ubåd' } },
  { id: 'supermarket', emoji: '🛒', names: { en: 'Supermarket', da: 'Supermarked' } },
  { id: 'theater', emoji: '🎭', names: { en: 'Theater', da: 'Teater' } },
  { id: 'university', emoji: '🎓', names: { en: 'University', da: 'Universitet' } },
];

/** Quick lookup by id. */
export const LOCATION_BY_ID: Record<string, GameLocation> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
);
