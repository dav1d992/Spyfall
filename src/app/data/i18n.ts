import type { Language } from '../models/participant.model';

/** All user-facing strings shown once you are inside a room. */
export interface RoomI18n {
  // Top bar
  room: string;
  copied: string;
  tapToCopy: string;
  leaveRoom: string;
  copyInviteLink: string;

  // Lobby
  lobby: string;
  shareBefore: string;
  players3: string;
  shareAfter: string;
  linkCopied: string;
  copyLink: string;
  locationsLabel: string;
  playersHeading: string;
  startGame: string;
  waitingForPlayers: string;
  waitingHostStart: string;

  // Playing
  tapReveal: string;
  keepHidden: string;
  youAreSpy: string;
  spyInstructions: string;
  guessLocation: string;
  possibleLocations: string;
  crossOffHint: string;
  readySuffix: string;
  readyToVote: string;
  readyCancel: string;
  waitingEveryone: string;

  // Voting
  whoIsSpy: string;
  voteHint: string;
  votedSuffix: string;
  guessInstead: string;
  autoRevealHint: string;

  // Revealed
  theSpyWas: string;
  theLocationWas: string;
  spyGuessed: string;
  everyonesRole: string;
  newRound: string;
  backToLobby: string;
  waitingHostRound: string;

  // Spy guess overlay
  guessTheLocation: string;
  guessCareful: string;

  // Phase transition
  timeToVote: string;
  whoIsSpySub: string;
  backToField: string;
  keepInvestigating: string;

  // Round outcomes
  outcomes: Record<
    'spy-caught' | 'spy-escaped' | 'spy-guessed' | 'spy-wrong' | 'default',
    { title: string; text: string }
  >;
}

export const ROOM_I18N: Record<Language, RoomI18n> = {
  en: {
    room: 'ROOM',
    copied: 'Copied!',
    tapToCopy: 'tap to copy link',
    leaveRoom: 'Leave room',
    copyInviteLink: 'Copy invite link',

    lobby: 'Lobby',
    shareBefore: 'Share the room so friends can join. You need at least ',
    players3: '3 players',
    shareAfter: '.',
    linkCopied: 'Link copied!',
    copyLink: 'Copy invite link',
    locationsLabel: 'Locations:',
    playersHeading: 'Players',
    startGame: '▶ Start game',
    waitingForPlayers: 'Waiting for players…',
    waitingHostStart: 'Waiting for the host to start the game…',

    tapReveal: 'Tap to reveal your secret',
    keepHidden: 'Keep it hidden from others!',
    youAreSpy: 'YOU ARE THE SPY',
    spyInstructions: "Don't get caught. Figure out the location and blend in.",
    guessLocation: '🎯 Guess the location',
    possibleLocations: 'Possible locations',
    crossOffHint: "Tap to cross off places you've ruled out.",
    readySuffix: 'ready',
    readyToVote: '🗳 Ready to vote',
    readyCancel: '✓ Ready — tap to cancel',
    waitingEveryone: 'Waiting for everyone…',

    whoIsSpy: 'Who is the spy?',
    voteHint:
      'Tap a player to cast your vote. You can change it until everyone has voted.',
    votedSuffix: 'voted',
    guessInstead: '🎯 Guess the location instead',
    autoRevealHint: 'The spy is revealed automatically once everyone has voted…',

    theSpyWas: 'The spy was',
    theLocationWas: 'The location was',
    spyGuessed: 'Spy guessed',
    everyonesRole: "Everyone's role",
    newRound: '🔁 New round',
    backToLobby: '⬅ Back to lobby',
    waitingHostRound: 'Waiting for the host to start a new round…',

    guessTheLocation: 'Guess the location',
    guessCareful: 'Choose carefully — a correct guess wins the game.',

    timeToVote: 'Time to vote!',
    whoIsSpySub: 'Who is the spy?',
    backToField: 'Back to the field',
    keepInvestigating: 'Keep investigating…',

    outcomes: {
      'spy-caught': {
        title: 'Spy caught!',
        text: 'The team unmasked the spy. Agents win!',
      },
      'spy-escaped': {
        title: 'The spy escaped',
        text: 'An innocent was accused. The spy wins!',
      },
      'spy-guessed': {
        title: 'Spy guessed the location!',
        text: 'The spy figured out where you were. Spy wins!',
      },
      'spy-wrong': {
        title: 'Wrong guess!',
        text: 'The spy guessed the wrong place. Agents win!',
      },
      default: { title: 'Round over', text: '' },
    },
  },

  da: {
    room: 'RUM',
    copied: 'Kopieret!',
    tapToCopy: 'tryk for at kopiere link',
    leaveRoom: 'Forlad rum',
    copyInviteLink: 'Kopiér invitationslink',

    lobby: 'Lobby',
    shareBefore: 'Del rummet, så dine venner kan være med. I skal være mindst ',
    players3: '3 spillere',
    shareAfter: '.',
    linkCopied: 'Link kopieret!',
    copyLink: 'Kopiér invitationslink',
    locationsLabel: 'Lokationer:',
    playersHeading: 'Spillere',
    startGame: '▶ Start spil',
    waitingForPlayers: 'Venter på spillere…',
    waitingHostStart: 'Venter på at værten starter spillet…',

    tapReveal: 'Tryk for at afsløre din hemmelighed',
    keepHidden: 'Hold den skjult for de andre!',
    youAreSpy: 'DU ER SPIONEN',
    spyInstructions: 'Bliv ikke afsløret. Regn lokationen ud og pas ind.',
    guessLocation: '🎯 Gæt lokationen',
    possibleLocations: 'Mulige lokationer',
    crossOffHint: 'Tryk for at strege steder ud, du har udelukket.',
    readySuffix: 'klar',
    readyToVote: '🗳 Klar til afstemning',
    readyCancel: '✓ Klar — tryk for at fortryde',
    waitingEveryone: 'Venter på alle…',

    whoIsSpy: 'Hvem er spionen?',
    voteHint:
      'Tryk på en spiller for at stemme. Du kan ændre din stemme, indtil alle har stemt.',
    votedSuffix: 'har stemt',
    guessInstead: '🎯 Gæt lokationen i stedet',
    autoRevealHint: 'Spionen afsløres automatisk, når alle har stemt…',

    theSpyWas: 'Spionen var',
    theLocationWas: 'Lokationen var',
    spyGuessed: 'Spionen gættede',
    everyonesRole: 'Alles roller',
    newRound: '🔁 Ny runde',
    backToLobby: '⬅ Tilbage til lobby',
    waitingHostRound: 'Venter på at værten starter en ny runde…',

    guessTheLocation: 'Gæt lokationen',
    guessCareful: 'Vælg med omhu — et korrekt gæt vinder spillet.',

    timeToVote: 'Tid til afstemning!',
    whoIsSpySub: 'Hvem er spionen?',
    backToField: 'Tilbage til spillet',
    keepInvestigating: 'Fortsæt efterforskningen…',

    outcomes: {
      'spy-caught': {
        title: 'Spionen er fanget!',
        text: 'Holdet afslørede spionen. Agenterne vinder!',
      },
      'spy-escaped': {
        title: 'Spionen slap væk',
        text: 'En uskyldig blev anklaget. Spionen vinder!',
      },
      'spy-guessed': {
        title: 'Spionen gættede lokationen!',
        text: 'Spionen regnede ud, hvor I var. Spionen vinder!',
      },
      'spy-wrong': {
        title: 'Forkert gæt!',
        text: 'Spionen gættede det forkerte sted. Agenterne vinder!',
      },
      default: { title: 'Runden er slut', text: '' },
    },
  },
};
