export interface Participant {
  id: string;
  name: string;
  isOwner: boolean;
  isSpy: boolean;
  hasVoted: boolean;
  vote?: string | null;
  votedBy?: string[]; // list of participant IDs who voted for this participant
}
