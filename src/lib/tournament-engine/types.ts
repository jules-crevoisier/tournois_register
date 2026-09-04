/**
 * Core types for the tournament engine
 */

export type TournamentMode =
  | 'SINGLE_ELIMINATION'
  | 'DOUBLE_ELIMINATION'
  | 'ROUND_ROBIN'
  | 'SWISS';

export type MatchStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type BracketType =
  | 'WINNERS'
  | 'LOSERS'
  | 'GRAND_FINAL';

export interface Team {
  id: string;
  teamName: string;
  seed?: number;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
}

export interface Match {
  id?: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerId: string | null;
  status: MatchStatus;
  bracketType?: BracketType;
  nextMatchId?: string | null;
  nextMatchSlot?: 'home' | 'away';
  loserNextMatchId?: string | null;
  loserNextMatchSlot?: 'home' | 'away';
}

export interface Bracket {
  tournamentId: string;
  mode: TournamentMode;
  matches: Match[];
  totalRounds: number;
  losersMatches?: Match[]; // For double elimination
}

export interface RoundRobinStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  headToHead: Map<string, { won: number; drawn: number; lost: number }>;
}

export interface SwissRound {
  roundNumber: number;
  matches: Match[];
}

export interface SwissStanding {
  teamId: string;
  teamName: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  buchholz: number; // Tiebreaker: sum of opponents' scores
  opponents: string[]; // Track who they've played
}

export interface BracketGenerationOptions {
  tournamentId: string;
  teams: Team[];
  mode: TournamentMode;
  seedTeams?: boolean;
  bracketResetInFinal?: boolean; // For double elimination grand final
}

export interface RoundRobinOptions {
  tournamentId: string;
  teams: Team[];
  pointsForWin?: number;
  pointsForDraw?: number;
  pointsForLoss?: number;
}

export interface SwissOptions {
  tournamentId: string;
  teams: Team[];
  totalRounds: number;
}
