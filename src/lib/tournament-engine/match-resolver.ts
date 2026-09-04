/**
 * Match Resolution and Bracket Advancement
 *
 * Handles score reporting and propagating winners through brackets
 */

import type { Match, MatchResult, Bracket, TournamentMode } from './types';

export interface MatchResolutionResult {
  match: Match;
  winnerId: string;
  loserId: string | null;
  advancementUpdates: Match[];
}

/**
 * Report a match score and determine the winner
 */
export function reportScore(
  match: Match,
  result: MatchResult
): Match {
  if (match.status === 'COMPLETED') {
    throw new Error('Match has already been completed');
  }

  if (match.status === 'CANCELLED') {
    throw new Error('Cannot report score for cancelled match');
  }

  if (!match.homeTeamId || !match.awayTeamId) {
    throw new Error('Match is missing participants');
  }

  const winnerId =
    result.homeScore > result.awayScore
      ? match.homeTeamId
      : result.awayScore > result.homeScore
        ? match.awayTeamId
        : null;

  return {
    ...match,
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    winnerId,
    status: 'COMPLETED'
  };
}

/**
 * Resolve a match and update bracket advancement for single elimination
 */
export function resolveMatchSingleElimination(
  match: Match,
  result: MatchResult,
  allMatches: Match[]
): MatchResolutionResult {
  const updatedMatch = reportScore(match, result);

  if (!updatedMatch.winnerId) {
    throw new Error('Draw not allowed in single elimination');
  }

  const winnerId = updatedMatch.winnerId;
  const loserId =
    winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;

  const advancementUpdates: Match[] = [];

  // Find and update the next match
  if (match.nextMatchId) {
    const nextMatch = allMatches.find(
      (m) =>
        `${m.round}-${m.matchNumber}` === match.nextMatchId ||
        `W${m.round}-${m.matchNumber}` === match.nextMatchId
    );

    if (nextMatch) {
      const updatedNextMatch = { ...nextMatch };
      if (match.nextMatchSlot === 'home') {
        updatedNextMatch.homeTeamId = winnerId;
      } else {
        updatedNextMatch.awayTeamId = winnerId;
      }
      advancementUpdates.push(updatedNextMatch);
    }
  }

  return {
    match: updatedMatch,
    winnerId,
    loserId,
    advancementUpdates
  };
}

/**
 * Resolve a match in double elimination and handle loser advancement
 */
export function resolveMatchDoubleElimination(
  match: Match,
  result: MatchResult,
  allWinnersMatches: Match[],
  allLosersMatches: Match[]
): MatchResolutionResult {
  const updatedMatch = reportScore(match, result);

  if (!updatedMatch.winnerId) {
    throw new Error('Draw not allowed in elimination formats');
  }

  const winnerId = updatedMatch.winnerId;
  const loserId =
    winnerId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;

  const advancementUpdates: Match[] = [];

  // Advance winner in their bracket
  if (match.nextMatchId) {
    const allMatches =
      match.bracketType === 'LOSERS' ? allLosersMatches : allWinnersMatches;
    const nextMatch = allMatches.find(
      (m) =>
        `${match.bracketType === 'LOSERS' ? 'L' : 'W'}${m.round}-${m.matchNumber}` ===
        match.nextMatchId
    );

    if (nextMatch) {
      const updatedNextMatch = { ...nextMatch };
      if (match.nextMatchSlot === 'home') {
        updatedNextMatch.homeTeamId = winnerId;
      } else {
        updatedNextMatch.awayTeamId = winnerId;
      }
      advancementUpdates.push(updatedNextMatch);
    }
  }

  // Send loser to losers bracket (only from winners bracket)
  if (match.bracketType === 'WINNERS' && match.loserNextMatchId && loserId) {
    const losersMatch = allLosersMatches.find(
      (m) => `L${m.round}-${m.matchNumber}` === match.loserNextMatchId
    );

    if (losersMatch) {
      const updatedLosersMatch = { ...losersMatch };
      if (match.loserNextMatchSlot === 'home') {
        updatedLosersMatch.homeTeamId = loserId;
      } else {
        updatedLosersMatch.awayTeamId = loserId;
      }
      advancementUpdates.push(updatedLosersMatch);
    }
  }

  return {
    match: updatedMatch,
    winnerId,
    loserId,
    advancementUpdates
  };
}

/**
 * Resolve a match for any tournament mode
 */
export function resolveMatch(
  match: Match,
  result: MatchResult,
  mode: TournamentMode,
  bracket?: Bracket
): MatchResolutionResult {
  switch (mode) {
    case 'SINGLE_ELIMINATION':
      return resolveMatchSingleElimination(
        match,
        result,
        bracket?.matches ?? []
      );

    case 'DOUBLE_ELIMINATION':
      return resolveMatchDoubleElimination(
        match,
        result,
        bracket?.matches ?? [],
        bracket?.losersMatches ?? []
      );

    case 'ROUND_ROBIN':
    case 'SWISS': {
      // Round robin and Swiss allow draws
      const updatedMatch = reportScore(match, result);
      return {
        match: updatedMatch,
        winnerId: updatedMatch.winnerId ?? '',
        loserId:
          updatedMatch.winnerId === match.homeTeamId
            ? match.awayTeamId
            : match.homeTeamId,
        advancementUpdates: []
      };
    }

    default:
      throw new Error(`Unknown tournament mode: ${mode}`);
  }
}

/**
 * Check if a match is ready to be played
 * (both teams assigned)
 */
export function isMatchReady(match: Match): boolean {
  return (
    match.homeTeamId !== null &&
    match.awayTeamId !== null &&
    match.status === 'PENDING'
  );
}

/**
 * Get all ready matches in a bracket
 */
export function getReadyMatches(matches: Match[]): Match[] {
  return matches.filter(isMatchReady);
}

/**
 * Get the current round of play
 * (earliest incomplete round with ready matches)
 */
export function getCurrentRound(matches: Match[]): number {
  const readyMatches = getReadyMatches(matches);
  if (readyMatches.length === 0) {
    // Find first round with pending matches
    const pendingMatches = matches.filter((m) => m.status === 'PENDING');
    if (pendingMatches.length === 0) return -1; // Tournament complete
    return Math.min(...pendingMatches.map((m) => m.round));
  }
  return Math.min(...readyMatches.map((m) => m.round));
}

/**
 * Check if a round is complete
 */
export function isRoundComplete(matches: Match[], round: number): boolean {
  const roundMatches = matches.filter((m) => m.round === round);
  return roundMatches.every(
    (m) => m.status === 'COMPLETED' || m.status === 'CANCELLED'
  );
}

/**
 * Check if the tournament is complete
 */
export function isTournamentComplete(bracket: Bracket): boolean {
  const allMatches = [
    ...bracket.matches,
    ...(bracket.losersMatches ?? [])
  ];

  return allMatches.every(
    (m) => m.status === 'COMPLETED' || m.status === 'CANCELLED'
  );
}

/**
 * Get the tournament winner
 */
export function getTournamentWinner(bracket: Bracket): string | null {
  if (!isTournamentComplete(bracket)) {
    return null;
  }

  // Find the final match
  const finalMatch = bracket.matches.find(
    (m) =>
      m.bracketType === 'GRAND_FINAL' ||
      (m.bracketType === 'WINNERS' &&
        m.round === bracket.totalRounds)
  );

  return finalMatch?.winnerId ?? null;
}

/**
 * Forfeit a match (award win to opponent)
 */
export function forfeitMatch(
  match: Match,
  forfeitingTeamId: string
): Match {
  if (match.homeTeamId !== forfeitingTeamId && match.awayTeamId !== forfeitingTeamId) {
    throw new Error('Team is not a participant in this match');
  }

  const winnerId =
    match.homeTeamId === forfeitingTeamId
      ? match.awayTeamId
      : match.homeTeamId;

  return {
    ...match,
    homeScore: match.homeTeamId === forfeitingTeamId ? 0 : 3,
    awayScore: match.awayTeamId === forfeitingTeamId ? 0 : 3,
    winnerId,
    status: 'COMPLETED'
  };
}

/**
 * Cancel a match
 */
export function cancelMatch(match: Match): Match {
  return {
    ...match,
    status: 'CANCELLED'
  };
}

/**
 * Update match status (e.g., mark as in progress)
 */
export function updateMatchStatus(
  match: Match,
  status: Match['status']
): Match {
  return {
    ...match,
    status
  };
}

/**
 * Get match by round and number
 */
export function getMatch(
  matches: Match[],
  round: number,
  matchNumber: number
): Match | undefined {
  return matches.find(
    (m) => m.round === round && m.matchNumber === matchNumber
  );
}

/**
 * Get all matches for a specific team
 */
export function getTeamMatches(
  matches: Match[],
  teamId: string
): Match[] {
  return matches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
  );
}

/**
 * Calculate match statistics for a team
 */
export function getTeamStats(
  matches: Match[],
  teamId: string
): {
  played: number;
  won: number;
  lost: number;
  drawn: number;
  goalsFor: number;
  goalsAgainst: number;
} {
  const teamMatches = getTeamMatches(matches, teamId).filter(
    (m) => m.status === 'COMPLETED'
  );

  return teamMatches.reduce(
    (stats, match) => {
      const isHome = match.homeTeamId === teamId;
      const teamScore = isHome ? match.homeScore! : match.awayScore!;
      const opponentScore = isHome ? match.awayScore! : match.homeScore!;

      stats.played++;
      stats.goalsFor += teamScore;
      stats.goalsAgainst += opponentScore;

      if (match.winnerId === teamId) {
        stats.won++;
      } else if (match.winnerId === null) {
        stats.drawn++;
      } else {
        stats.lost++;
      }

      return stats;
    },
    { played: 0, won: 0, lost: 0, drawn: 0, goalsFor: 0, goalsAgainst: 0 }
  );
}
