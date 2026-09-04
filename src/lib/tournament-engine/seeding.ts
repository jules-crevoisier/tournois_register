/**
 * Seeding algorithms for tournament brackets
 *
 * Standard seeding ensures top seeds meet in later rounds:
 * - Seed 1 vs Seed 8, Seed 4 vs Seed 5, etc.
 * - Creates balanced brackets where best teams don't meet early
 */

import type { Team } from './types';

/**
 * Generate standard seeding order for a bracket
 * Uses recursive algorithm to ensure proper seed distribution
 *
 * For 8 teams: [1, 8, 4, 5, 2, 7, 3, 6]
 * This ensures:
 * - Round 1: 1v8, 4v5, 2v7, 3v6
 * - Semis: winner(1v8) vs winner(4v5), winner(2v7) vs winner(3v6)
 * - Final: expected 1 vs 2
 */
export function generateSeedOrder(bracketSize: number): number[] {
  if (bracketSize < 2 || !isPowerOfTwo(bracketSize)) {
    throw new Error(`Bracket size must be a power of 2, got ${bracketSize}`);
  }

  // Base case
  if (bracketSize === 2) {
    return [1, 2];
  }

  // Get seeding for half-size bracket
  const halfOrder = generateSeedOrder(bracketSize / 2);
  const result: number[] = [];

  // For each position in half bracket, create the matchup
  for (const seed of halfOrder) {
    result.push(seed);
    // Opponent is (bracketSize + 1 - seed)
    result.push(bracketSize + 1 - seed);
  }

  return result;
}

/**
 * Calculate the required bracket size (nearest power of 2)
 */
export function calculateBracketSize(teamCount: number): number {
  if (teamCount < 2) {
    throw new Error('Need at least 2 teams for a bracket');
  }

  let size = 2;
  while (size < teamCount) {
    size *= 2;
  }
  return size;
}

/**
 * Calculate number of byes needed
 */
export function calculateByes(teamCount: number, bracketSize: number): number {
  return bracketSize - teamCount;
}

/**
 * Seed teams into bracket positions
 * Teams are placed according to their seed (or random if no seed specified)
 * Byes are placed to give top seeds automatic advancement
 *
 * @returns Array of team IDs or null (for byes), in match order
 */
export function seedTeamsIntoBracket(
  teams: Team[],
  bracketSize: number
): (string | null)[] {
  const seedOrder = generateSeedOrder(bracketSize);
  const byeCount = calculateByes(teams.length, bracketSize);

  // Sort teams by seed if available, otherwise maintain original order
  const sortedTeams = [...teams].sort((a, b) => {
    const seedA = a.seed ?? teams.indexOf(a) + 1;
    const seedB = b.seed ?? teams.indexOf(b) + 1;
    return seedA - seedB;
  });

  // Create bracket positions
  const positions: (string | null)[] = new Array(bracketSize).fill(null);

  // Place teams and byes according to seed order
  // Byes go to the highest seeds (they face the lowest seeded opponents, which are byes)
  for (let i = 0; i < bracketSize; i++) {
    const seedPosition = seedOrder[i] - 1; // Convert to 0-indexed

    if (seedPosition < teams.length) {
      positions[i] = sortedTeams[seedPosition].id;
    } else {
      // This position is a bye
      positions[i] = null;
    }
  }

  return positions;
}

/**
 * Create match pairs from seeded positions
 * @returns Array of [homeTeamId, awayTeamId] pairs, where null indicates a bye
 */
export function createMatchPairs(
  positions: (string | null)[]
): [string | null, string | null][] {
  const pairs: [string | null, string | null][] = [];

  for (let i = 0; i < positions.length; i += 2) {
    pairs.push([positions[i], positions[i + 1]]);
  }

  return pairs;
}

/**
 * Get teams that advance automatically due to byes
 * @returns Array of team IDs that get byes (advance without playing round 1)
 */
export function getByeAdvancers(
  matchPairs: [string | null, string | null][]
): string[] {
  const advancers: string[] = [];

  for (const [home, away] of matchPairs) {
    // If one team is null (bye), the other advances
    if (home === null && away !== null) {
      advancers.push(away);
    } else if (away === null && home !== null) {
      advancers.push(home);
    }
    // If both are null, this shouldn't happen in a valid bracket
  }

  return advancers;
}

/**
 * Calculate the number of rounds needed for a bracket
 */
export function calculateRounds(bracketSize: number): number {
  return Math.log2(bracketSize);
}

/**
 * Check if a number is a power of 2
 */
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 * Used for random seeding when no seeds are provided
 */
export function shuffleTeams(teams: Team[]): Team[] {
  const shuffled = [...teams];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Assign seeds to teams based on their position
 * Useful when teams don't have pre-assigned seeds
 */
export function assignSeeds(teams: Team[]): Team[] {
  return teams.map((team, index) => ({
    ...team,
    seed: team.seed ?? index + 1
  }));
}
