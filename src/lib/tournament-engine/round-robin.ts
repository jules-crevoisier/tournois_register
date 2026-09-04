/**
 * Round Robin tournament format
 *
 * Every team plays every other team once.
 * Standings are calculated based on points (configurable),
 * with tiebreakers for goal difference and head-to-head.
 */

import type {
  Team,
  Match,
  RoundRobinStanding,
  RoundRobinOptions
} from './types';

const DEFAULT_POINTS_WIN = 3;
const DEFAULT_POINTS_DRAW = 1;
const DEFAULT_POINTS_LOSS = 0;

/**
 * Generate all matches for a round robin tournament
 *
 * Uses the circle method (Berger tables) for scheduling:
 * - Teams are arranged in a circle
 * - One team is fixed, others rotate
 * - This ensures fair distribution of home/away
 */
export function generateRoundRobinMatches(
  options: RoundRobinOptions
): Match[] {
  const { tournamentId, teams } = options;

  if (teams.length < 2) {
    throw new Error('Need at least 2 teams for round robin');
  }

  const matches: Match[] = [];
  const teamList = [...teams];

  // Add a "bye" team if odd number of teams
  if (teamList.length % 2 !== 0) {
    teamList.push({ id: 'BYE', teamName: 'Bye' });
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  let matchNumber = 1;

  // Generate rounds using circle method
  for (let round = 0; round < numRounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIndex = match === 0 ? 0 : (numTeams - 1 - round + match) % (numTeams - 1) + 1;
      const awayIndex = match === 0
        ? (round % (numTeams - 1)) + 1
        : (numTeams - 1 - round + matchesPerRound + match - 1) % (numTeams - 1) + 1;

      const homeTeam = teamList[homeIndex];
      const awayTeam = teamList[awayIndex];

      // Skip matches involving the bye team
      if (homeTeam.id === 'BYE' || awayTeam.id === 'BYE') {
        continue;
      }

      // Alternate home/away for fairness
      const swapHomeAway = round % 2 === 1;

      matches.push({
        tournamentId,
        round: round + 1,
        matchNumber: matchNumber++,
        homeTeamId: swapHomeAway ? awayTeam.id : homeTeam.id,
        awayTeamId: swapHomeAway ? homeTeam.id : awayTeam.id,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        status: 'PENDING'
      });
    }
  }

  return matches;
}

/**
 * Generate matches using simple pairing algorithm
 * Alternative to circle method, simpler but less optimal scheduling
 */
export function generateSimpleRoundRobin(
  options: RoundRobinOptions
): Match[] {
  const { tournamentId, teams } = options;

  const matches: Match[] = [];
  let matchNumber = 1;
  let round = 1;
  let matchesInRound = 0;
  const maxMatchesPerRound = Math.floor(teams.length / 2);

  // Generate all possible pairings
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        tournamentId,
        round,
        matchNumber: matchNumber++,
        homeTeamId: teams[i].id,
        awayTeamId: teams[j].id,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        status: 'PENDING'
      });

      matchesInRound++;
      if (matchesInRound >= maxMatchesPerRound) {
        round++;
        matchesInRound = 0;
      }
    }
  }

  return matches;
}

/**
 * Calculate standings from completed matches
 */
export function calculateStandings(
  teams: Team[],
  matches: Match[],
  options?: {
    pointsForWin?: number;
    pointsForDraw?: number;
    pointsForLoss?: number;
  }
): RoundRobinStanding[] {
  const pointsWin = options?.pointsForWin ?? DEFAULT_POINTS_WIN;
  const pointsDraw = options?.pointsForDraw ?? DEFAULT_POINTS_DRAW;
  const pointsLoss = options?.pointsForLoss ?? DEFAULT_POINTS_LOSS;

  // Initialize standings
  const standingsMap = new Map<string, RoundRobinStanding>();

  for (const team of teams) {
    standingsMap.set(team.id, {
      teamId: team.id,
      teamName: team.teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      headToHead: new Map()
    });
  }

  // Process completed matches
  for (const match of matches) {
    if (match.status !== 'COMPLETED') continue;
    if (match.homeScore === null || match.awayScore === null) continue;
    if (!match.homeTeamId || !match.awayTeamId) continue;

    const homeStanding = standingsMap.get(match.homeTeamId);
    const awayStanding = standingsMap.get(match.awayTeamId);

    if (!homeStanding || !awayStanding) continue;

    // Update games played
    homeStanding.played++;
    awayStanding.played++;

    // Update goals
    homeStanding.goalsFor += match.homeScore;
    homeStanding.goalsAgainst += match.awayScore;
    awayStanding.goalsFor += match.awayScore;
    awayStanding.goalsAgainst += match.homeScore;

    // Update goal difference
    homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
    awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;

    // Determine result
    if (match.homeScore > match.awayScore) {
      // Home win
      homeStanding.won++;
      homeStanding.points += pointsWin;
      awayStanding.lost++;
      awayStanding.points += pointsLoss;

      // Head-to-head
      updateHeadToHead(homeStanding, match.awayTeamId, 'won');
      updateHeadToHead(awayStanding, match.homeTeamId, 'lost');
    } else if (match.homeScore < match.awayScore) {
      // Away win
      awayStanding.won++;
      awayStanding.points += pointsWin;
      homeStanding.lost++;
      homeStanding.points += pointsLoss;

      // Head-to-head
      updateHeadToHead(awayStanding, match.homeTeamId, 'won');
      updateHeadToHead(homeStanding, match.awayTeamId, 'lost');
    } else {
      // Draw
      homeStanding.drawn++;
      homeStanding.points += pointsDraw;
      awayStanding.drawn++;
      awayStanding.points += pointsDraw;

      // Head-to-head
      updateHeadToHead(homeStanding, match.awayTeamId, 'drawn');
      updateHeadToHead(awayStanding, match.homeTeamId, 'drawn');
    }
  }

  // Convert to array and sort
  const standings = Array.from(standingsMap.values());
  return sortStandings(standings);
}

/**
 * Update head-to-head record
 */
function updateHeadToHead(
  standing: RoundRobinStanding,
  opponentId: string,
  result: 'won' | 'drawn' | 'lost'
): void {
  if (!standing.headToHead.has(opponentId)) {
    standing.headToHead.set(opponentId, { won: 0, drawn: 0, lost: 0 });
  }
  const h2h = standing.headToHead.get(opponentId)!;
  h2h[result]++;
}

/**
 * Sort standings by:
 * 1. Points (descending)
 * 2. Goal difference (descending)
 * 3. Goals for (descending)
 * 4. Head-to-head (if tied on all above)
 */
export function sortStandings(
  standings: RoundRobinStanding[]
): RoundRobinStanding[] {
  return [...standings].sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // 2. Goal difference
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }

    // 3. Goals for
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    // 4. Head-to-head
    const aH2H = a.headToHead.get(b.teamId);
    const bH2H = b.headToHead.get(a.teamId);

    if (aH2H && bH2H) {
      const aH2HPoints = aH2H.won * 3 + aH2H.drawn;
      const bH2HPoints = bH2H.won * 3 + bH2H.drawn;

      if (aH2HPoints !== bH2HPoints) {
        return bH2HPoints - aH2HPoints;
      }
    }

    // Tie
    return 0;
  });
}

/**
 * Get groups for multi-group round robin (e.g., World Cup format)
 */
export function divideIntoGroups(
  teams: Team[],
  groupCount: number
): Team[][] {
  if (teams.length < groupCount * 2) {
    throw new Error('Not enough teams for the requested number of groups');
  }

  const groups: Team[][] = Array.from({ length: groupCount }, () => []);
  const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

  // Distribute teams across groups (snake draft style for seeding)
  for (let i = 0; i < shuffledTeams.length; i++) {
    const groupIndex = i % groupCount;
    groups[groupIndex].push(shuffledTeams[i]);
  }

  return groups;
}

/**
 * Calculate total matches in round robin format
 */
export function calculateTotalMatches(teamCount: number): number {
  // n * (n - 1) / 2 for single round robin
  return (teamCount * (teamCount - 1)) / 2;
}

/**
 * Calculate number of rounds needed
 */
export function calculateRoundRobinRounds(teamCount: number): number {
  // Each team plays n-1 games, one per round
  // If odd number of teams, add 1 for bye rounds
  return teamCount % 2 === 0 ? teamCount - 1 : teamCount;
}

/**
 * Check if all round robin matches are completed
 */
export function isRoundRobinComplete(matches: Match[]): boolean {
  return matches.every(
    (m) => m.status === 'COMPLETED' || m.status === 'CANCELLED'
  );
}

/**
 * Get current standings position (1-indexed)
 */
export function getPosition(
  teamId: string,
  standings: RoundRobinStanding[]
): number {
  const index = standings.findIndex((s) => s.teamId === teamId);
  return index === -1 ? -1 : index + 1;
}
