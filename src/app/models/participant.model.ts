export interface Participant {
  id: string;
  name: string;
  isOwner: boolean;
  isSpy: boolean;
  hasVoted: boolean;
  isDead: boolean;
  votedBy?: string[]; // list of participant IDs who voted for this participant
  vote?: string | null;
}
