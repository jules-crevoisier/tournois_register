/**
 * Swiss System Tournament Format
 *
 * Teams are paired based on their current score.
 * Teams with the same score play each other.
 * No team plays the same opponent twice.
 * Number of rounds is configurable (typically log2(teams) + 1).
 */

import type {
  Team,
  Match,
  SwissStanding,
  SwissRound,
  SwissOptions
} from './types';

const POINTS_WIN = 3;
const POINTS_DRAW = 1;
const POINTS_LOSS = 0;

/**
 * Generate the first round of Swiss pairings
 * Teams are paired based on initial seeding
 */
export function generateFirstRound(options: SwissOptions): SwissRound {
  const { tournamentId, teams } = options;

  if (teams.length < 2) {
    throw new Error('Need at least 2 teams for Swiss system');
  }

  const matches: Match[] = [];
  let matchNumber = 1;

  // Sort by seed if available
  const sortedTeams = [...teams].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));

  // Pair top half vs bottom half (standard Swiss pairing)
  const halfCount = Math.floor(sortedTeams.length / 2);

  for (let i = 0; i < halfCount; i++) {
    matches.push({
      tournamentId,
      round: 1,
      matchNumber: matchNumber++,
      homeTeamId: sortedTeams[i].id,
      awayTeamId: sortedTeams[halfCount + i].id,
      homeScore: null,
      awayScore: null,
      winnerId: null,
      status: 'PENDING'
    });
  }

  // Handle bye for odd number of teams
  if (sortedTeams.length % 2 === 1) {
    const byeTeam = sortedTeams[sortedTeams.length - 1];
    matches.push({
      tournamentId,
      round: 1,
      matchNumber: matchNumber++,
      homeTeamId: byeTeam.id,
      awayTeamId: null, // Bye
      homeScore: 1,
      awayScore: 0,
      winnerId: byeTeam.id,
      status: 'COMPLETED'
    });
  }

  return { roundNumber: 1, matches };
}

/**
 * Calculate current Swiss standings from completed matches
 */
export function calculateSwissStandings(
  teams: Team[],
  matches: Match[]
): SwissStanding[] {
  const standingsMap = new Map<string, SwissStanding>();

  // Initialize standings
  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.teamName,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      buchholz: 0,
      opponents: []
    });
  }

  // Process completed matches
  for (const match of matches) {
    if (match.status !== 'COMPLETED') continue;
    if (match.homeScore === null || match.awayScore === null) continue;
    if (!match.homeTeamId) continue;

    const homeStanding = standingsMap.get(match.homeTeamId);
    if (!homeStanding) continue;

    // Track opponent (skip byes)
    if (match.awayTeamId) {
      homeStanding.opponents.push(match.awayTeamId);

      const awayStanding = standingsMap.get(match.awayTeamId);
      if (awayStanding) {
        awayStanding.opponents.push(match.homeTeamId);
      }
    }

    // Update results
    if (match.homeScore > match.awayScore) {
      homeStanding.wins++;
      homeStanding.points += POINTS_WIN;
      if (match.awayTeamId) {
        const awayStanding = standingsMap.get(match.awayTeamId);
        if (awayStanding) {
          awayStanding.losses++;
          awayStanding.points += POINTS_LOSS;
        }
      }
    } else if (match.homeScore < match.awayScore) {
      homeStanding.losses++;
      homeStanding.points += POINTS_LOSS;
      if (match.awayTeamId) {
        const awayStanding = standingsMap.get(match.awayTeamId);
        if (awayStanding) {
          awayStanding.wins++;
          awayStanding.points += POINTS_WIN;
        }
      }
    } else {
      homeStanding.draws++;
      homeStanding.points += POINTS_DRAW;
      if (match.awayTeamId) {
        const awayStanding = standingsMap.get(match.awayTeamId);
        if (awayStanding) {
          awayStanding.draws++;
          awayStanding.points += POINTS_DRAW;
        }
      }
    }
  }

  // Calculate Buchholz (sum of opponents' scores)
  for (const standing of standingsMap.values()) {
    standing.buchholz = standing.opponents.reduce((sum, oppId) => {
      const oppStanding = standingsMap.get(oppId);
      return sum + (oppStanding?.points ?? 0);
    }, 0);
  }

  return sortSwissStandings(Array.from(standingsMap.values()));
}

/**
 * Sort Swiss standings by:
 * 1. Points (descending)
 * 2. Buchholz tiebreaker (descending)
 * 3. Wins (descending)
 */
export function sortSwissStandings(
  standings: SwissStanding[]
): SwissStanding[] {
  return [...standings].sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // 2. Buchholz
    if (b.buchholz !== a.buchholz) {
      return b.buchholz - a.buchholz;
    }

    // 3. Wins
    return b.wins - a.wins;
  });
}

/**
 * Generate next round pairings using Swiss system
 *
 * Algorithm:
 * 1. Group teams by score
 * 2. Within each score group, pair teams avoiding rematches
 * 3. Handle floaters (unpaired teams drop to next group)
 */
export function generateNextRound(
  options: SwissOptions,
  completedMatches: Match[],
  currentRound: number
): SwissRound {
  const { tournamentId, teams } = options;

  if (currentRound >= options.totalRounds) {
    throw new Error('All rounds completed');
  }

  const standings = calculateSwissStandings(teams, completedMatches);
  const nextRound = currentRound + 1;

  // Group by points
  const scoreGroups = groupByPoints(standings);

  // Track pairings to avoid rematches
  const previousOpponents = buildOpponentMap(completedMatches);

  const matches: Match[] = [];
  let matchNumber = 1;
  let floaters: SwissStanding[] = [];

  // Process each score group
  for (const [points, group] of scoreGroups.entries()) {
    // Add floaters from previous group
    const teamsToMatch = [...floaters, ...group];
    floaters = [];

    // Pair teams within the group
    const paired = pairTeamsInGroup(
      teamsToMatch,
      previousOpponents,
      tournamentId,
      nextRound,
      matchNumber
    );

    matches.push(...paired.matches);
    matchNumber += paired.matches.length;
    floaters = paired.unpaired;
  }

  // Handle remaining floaters (should be at most 1 for odd team count)
  if (floaters.length === 1) {
    // Bye
    matches.push({
      tournamentId,
      round: nextRound,
      matchNumber: matchNumber++,
      homeTeamId: floaters[0].teamId,
      awayTeamId: null,
      homeScore: 1,
      awayScore: 0,
      winnerId: floaters[0].teamId,
      status: 'COMPLETED'
    });
  }

  return { roundNumber: nextRound, matches };
}

/**
 * Group standings by points
 */
function groupByPoints(
  standings: SwissStanding[]
): Map<number, SwissStanding[]> {
  const groups = new Map<number, SwissStanding[]>();

  for (const standing of standings) {
    if (!groups.has(standing.points)) {
      groups.set(standing.points, []);
    }
    groups.get(standing.points)!.push(standing);
  }

  // Sort by points descending
  return new Map(
    Array.from(groups.entries()).sort(([a], [b]) => b - a)
  );
}

/**
 * Build a map of previous opponents for each team
 */
function buildOpponentMap(matches: Match[]): Map<string, Set<string>> {
  const opponents = new Map<string, Set<string>>();

  for (const match of matches) {
    if (!match.homeTeamId) continue;

    if (!opponents.has(match.homeTeamId)) {
      opponents.set(match.homeTeamId, new Set());
    }

    if (match.awayTeamId) {
      opponents.get(match.homeTeamId)!.add(match.awayTeamId);

      if (!opponents.has(match.awayTeamId)) {
        opponents.set(match.awayTeamId, new Set());
      }
      opponents.get(match.awayTeamId)!.add(match.homeTeamId);
    }
  }

  return opponents;
}

/**
 * Pair teams within a score group, avoiding rematches
 */
function pairTeamsInGroup(
  teams: SwissStanding[],
  previousOpponents: Map<string, Set<string>>,
  tournamentId: string,
  round: number,
  startMatchNumber: number
): { matches: Match[]; unpaired: SwissStanding[] } {
  const matches: Match[] = [];
  let matchNumber = startMatchNumber;
  const paired = new Set<string>();

  // Sort by Buchholz for better pairing within group
  const sortedTeams = [...teams].sort((a, b) => b.buchholz - a.buchholz);

  for (let i = 0; i < sortedTeams.length; i++) {
    const team1 = sortedTeams[i];
    if (paired.has(team1.teamId)) continue;

    // Find best opponent (not played before, not already paired)
    for (let j = i + 1; j < sortedTeams.length; j++) {
      const team2 = sortedTeams[j];
      if (paired.has(team2.teamId)) continue;

      // Check if they've already played
      const team1Opponents = previousOpponents.get(team1.teamId);
      if (team1Opponents?.has(team2.teamId)) continue;

      // Valid pairing found
      matches.push({
        tournamentId,
        round,
        matchNumber: matchNumber++,
        homeTeamId: team1.teamId,
        awayTeamId: team2.teamId,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        status: 'PENDING'
      });

      paired.add(team1.teamId);
      paired.add(team2.teamId);
      break;
    }
  }

  // Return unpaired teams as floaters
  const unpaired = sortedTeams.filter((t) => !paired.has(t.teamId));

  return { matches, unpaired };
}

/**
 * Calculate recommended number of Swiss rounds
 * Standard formula: ceil(log2(teamCount)) rounds
 */
export function calculateRecommendedRounds(teamCount: number): number {
  if (teamCount < 2) return 0;
  return Math.ceil(Math.log2(teamCount));
}

/**
 * Check if a team has already received a bye
 */
export function hasReceivedBye(
  teamId: string,
  matches: Match[]
): boolean {
  return matches.some(
    (m) =>
      m.homeTeamId === teamId &&
      m.awayTeamId === null &&
      m.status === 'COMPLETED'
  );
}

/**
 * Validate Swiss pairing (no rematches, no double byes)
 */
export function validatePairing(
  matches: Match[],
  previousMatches: Match[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const previousOpponents = buildOpponentMap(previousMatches);
  const byeReceivers = new Set<string>();

  // Track previous byes
  for (const match of previousMatches) {
    if (match.homeTeamId && match.awayTeamId === null) {
      byeReceivers.add(match.homeTeamId);
    }
  }

  for (const match of matches) {
    // Check for rematch
    if (match.homeTeamId && match.awayTeamId) {
      const homeOpponents = previousOpponents.get(match.homeTeamId);
      if (homeOpponents?.has(match.awayTeamId)) {
        errors.push(
          `Rematch: ${match.homeTeamId} vs ${match.awayTeamId}`
        );
      }
    }

    // Check for double bye
    if (match.homeTeamId && match.awayTeamId === null) {
      if (byeReceivers.has(match.homeTeamId)) {
        errors.push(`Double bye for team ${match.homeTeamId}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if Swiss tournament is complete
 */
export function isSwissComplete(
  matches: Match[],
  totalRounds: number
): boolean {
  const rounds = new Set(matches.map((m) => m.round));
  const allCompleted = matches.every(
    (m) => m.status === 'COMPLETED' || m.status === 'CANCELLED'
  );

  return rounds.size >= totalRounds && allCompleted;
}
