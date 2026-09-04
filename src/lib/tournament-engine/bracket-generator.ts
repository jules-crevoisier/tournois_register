/**
 * Bracket generation for elimination tournaments
 * Supports single elimination and double elimination formats
 */

import type {
  Team,
  Match,
  Bracket,
  BracketGenerationOptions,
  BracketType
} from './types';
import {
  calculateBracketSize,
  calculateRounds,
  seedTeamsIntoBracket,
  createMatchPairs,
  assignSeeds,
  shuffleTeams
} from './seeding';

/**
 * Generate a single elimination bracket
 *
 * Creates all matches from round 1 to the final.
 * Handles byes by giving top seeds automatic advancement.
 */
export function generateSingleElimination(
  options: BracketGenerationOptions
): Bracket {
  const { tournamentId, teams, seedTeams = true } = options;

  if (teams.length < 2) {
    throw new Error('Need at least 2 teams for a bracket');
  }

  if (teams.length > 64) {
    throw new Error('Maximum 64 teams supported');
  }

  // Prepare teams with seeding
  let seededTeams = seedTeams ? assignSeeds(teams) : shuffleTeams(teams);
  seededTeams = assignSeeds(seededTeams); // Ensure all have seeds

  const bracketSize = calculateBracketSize(teams.length);
  const totalRounds = calculateRounds(bracketSize);

  // Seed teams into bracket positions
  const positions = seedTeamsIntoBracket(seededTeams, bracketSize);
  const firstRoundPairs = createMatchPairs(positions);

  const matches: Match[] = [];
  let matchNumber = 1;

  // Generate Round 1 matches
  const round1Matches: Match[] = [];
  for (const [homeTeamId, awayTeamId] of firstRoundPairs) {
    const isBye = homeTeamId === null || awayTeamId === null;
    const match: Match = {
      tournamentId,
      round: 1,
      matchNumber: matchNumber++,
      homeTeamId,
      awayTeamId,
      homeScore: null,
      awayScore: null,
      winnerId: isBye ? (homeTeamId ?? awayTeamId) : null,
      status: isBye ? 'COMPLETED' : 'PENDING',
      bracketType: 'WINNERS'
    };
    round1Matches.push(match);
    matches.push(match);
  }

  // Generate subsequent rounds
  let previousRoundMatches = round1Matches;
  for (let round = 2; round <= totalRounds; round++) {
    const roundMatches: Match[] = [];
    const matchesInRound = previousRoundMatches.length / 2;

    for (let i = 0; i < matchesInRound; i++) {
      const match: Match = {
        tournamentId,
        round,
        matchNumber: matchNumber++,
        homeTeamId: null,
        awayTeamId: null,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        status: 'PENDING',
        bracketType: 'WINNERS'
      };
      roundMatches.push(match);
      matches.push(match);

      // Link previous round matches to this one
      const prevMatch1 = previousRoundMatches[i * 2];
      const prevMatch2 = previousRoundMatches[i * 2 + 1];

      prevMatch1.nextMatchId = `${round}-${match.matchNumber}`;
      prevMatch1.nextMatchSlot = 'home';
      prevMatch2.nextMatchId = `${round}-${match.matchNumber}`;
      prevMatch2.nextMatchSlot = 'away';

      // If previous matches are byes, propagate winners
      if (prevMatch1.winnerId) {
        match.homeTeamId = prevMatch1.winnerId;
      }
      if (prevMatch2.winnerId) {
        match.awayTeamId = prevMatch2.winnerId;
      }

      // If both slots are filled from byes, mark as ready
      if (match.homeTeamId && match.awayTeamId) {
        match.status = 'PENDING';
      }
    }

    previousRoundMatches = roundMatches;
  }

  return {
    tournamentId,
    mode: 'SINGLE_ELIMINATION',
    matches,
    totalRounds
  };
}

/**
 * Generate a double elimination bracket
 *
 * Creates winners bracket, losers bracket, and grand final.
 * Losers bracket gives eliminated teams a second chance.
 */
export function generateDoubleElimination(
  options: BracketGenerationOptions
): Bracket {
  const { tournamentId, teams, seedTeams = true, bracketResetInFinal = true } = options;

  if (teams.length < 2) {
    throw new Error('Need at least 2 teams for a bracket');
  }

  if (teams.length > 64) {
    throw new Error('Maximum 64 teams supported');
  }

  // Prepare teams with seeding
  let seededTeams = seedTeams ? assignSeeds(teams) : shuffleTeams(teams);
  seededTeams = assignSeeds(seededTeams);

  const bracketSize = calculateBracketSize(teams.length);
  const winnersRounds = calculateRounds(bracketSize);
  // Losers bracket has 2 * (winnersRounds - 1) rounds
  const losersRounds = 2 * (winnersRounds - 1);

  const positions = seedTeamsIntoBracket(seededTeams, bracketSize);
  const firstRoundPairs = createMatchPairs(positions);

  const winnersMatches: Match[] = [];
  const losersMatches: Match[] = [];
  let matchNumber = 1;
  let losersMatchNumber = 1;

  // Generate Winners Round 1
  const winnersRound1: Match[] = [];
  for (const [homeTeamId, awayTeamId] of firstRoundPairs) {
    const isBye = homeTeamId === null || awayTeamId === null;
    const match: Match = {
      tournamentId,
      round: 1,
      matchNumber: matchNumber++,
      homeTeamId,
      awayTeamId,
      homeScore: null,
      awayScore: null,
      winnerId: isBye ? (homeTeamId ?? awayTeamId) : null,
      status: isBye ? 'COMPLETED' : 'PENDING',
      bracketType: 'WINNERS'
    };
    winnersRound1.push(match);
    winnersMatches.push(match);
  }

  // Generate subsequent winners bracket rounds
  let previousWinnersMatches = winnersRound1;
  for (let round = 2; round <= winnersRounds; round++) {
    const roundMatches: Match[] = [];
    const matchesInRound = previousWinnersMatches.length / 2;

    for (let i = 0; i < matchesInRound; i++) {
      const match: Match = {
        tournamentId,
        round,
        matchNumber: matchNumber++,
        homeTeamId: null,
        awayTeamId: null,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        status: 'PENDING',
        bracketType: 'WINNERS'
      };
      roundMatches.push(match);
      winnersMatches.push(match);

      // Link previous round matches
      const prevMatch1 = previousWinnersMatches[i * 2];
      const prevMatch2 = previousWinnersMatches[i * 2 + 1];

      prevMatch1.nextMatchId = `W${round}-${match.matchNumber}`;
      prevMatch1.nextMatchSlot = 'home';
      prevMatch2.nextMatchId = `W${round}-${match.matchNumber}`;
      prevMatch2.nextMatchSlot = 'away';

      // Propagate bye winners
      if (prevMatch1.winnerId) {
        match.homeTeamId = prevMatch1.winnerId;
      }
      if (prevMatch2.winnerId) {
        match.awayTeamId = prevMatch2.winnerId;
      }
    }

    previousWinnersMatches = roundMatches;
  }

  // Generate Losers Bracket
  // Losers bracket structure:
  // - Odd rounds: losers from winners bracket drop down
  // - Even rounds: losers play each other
  let currentLosersCount = bracketSize / 2; // First losers round size

  for (let losersRound = 1; losersRound <= losersRounds; losersRound++) {
    const isDropDownRound = losersRound % 2 === 1;
    const matchesInRound = isDropDownRound
      ? currentLosersCount / 2
      : currentLosersCount;

    for (let i = 0; i < matchesInRound; i++) {
      const match: Match = {
        tournamentId,
        round: losersRound,
        matchNumber: losersMatchNumber++,
        homeTeamId: null,
        awayTeamId: null,
        homeScore: null,
        awayScore: null,
        winnerId: null,
        status: 'PENDING',
        bracketType: 'LOSERS'
      };
      losersMatches.push(match);
    }

    if (!isDropDownRound) {
      currentLosersCount = Math.ceil(currentLosersCount / 2);
    }
  }

  // Generate Grand Final
  const grandFinal: Match = {
    tournamentId,
    round: winnersRounds + 1,
    matchNumber: matchNumber++,
    homeTeamId: null, // Winners bracket champion
    awayTeamId: null, // Losers bracket champion
    homeScore: null,
    awayScore: null,
    winnerId: null,
    status: 'PENDING',
    bracketType: 'GRAND_FINAL'
  };
  winnersMatches.push(grandFinal);

  // Optional bracket reset match (if losers bracket champion wins grand final)
  if (bracketResetInFinal) {
    const bracketReset: Match = {
      tournamentId,
      round: winnersRounds + 2,
      matchNumber: matchNumber++,
      homeTeamId: null,
      awayTeamId: null,
      homeScore: null,
      awayScore: null,
      winnerId: null,
      status: 'PENDING',
      bracketType: 'GRAND_FINAL'
    };
    winnersMatches.push(bracketReset);
  }

  // Link losers of winners bracket to losers bracket
  linkLosersToLosersBracket(winnersMatches, losersMatches, winnersRounds);

  return {
    tournamentId,
    mode: 'DOUBLE_ELIMINATION',
    matches: winnersMatches,
    losersMatches,
    totalRounds: winnersRounds + (bracketResetInFinal ? 2 : 1)
  };
}

/**
 * Link losers from winners bracket to appropriate losers bracket matches
 */
function linkLosersToLosersBracket(
  winnersMatches: Match[],
  losersMatches: Match[],
  winnersRounds: number
): void {
  // Winners R1 losers -> Losers R1
  // Winners R2 losers -> Losers R3
  // Winners R3 losers -> Losers R5
  // etc.

  for (let winnersRound = 1; winnersRound < winnersRounds; winnersRound++) {
    const winnersRoundMatches = winnersMatches.filter(
      (m) => m.round === winnersRound && m.bracketType === 'WINNERS'
    );
    const losersRound = winnersRound === 1 ? 1 : (winnersRound - 1) * 2 + 1;
    const losersRoundMatches = losersMatches.filter(
      (m) => m.round === losersRound
    );

    // Link each winners match to corresponding losers match
    for (let i = 0; i < winnersRoundMatches.length && i < losersRoundMatches.length; i++) {
      const winnersMatch = winnersRoundMatches[i];
      const losersMatch = losersRoundMatches[Math.floor(i / 2)];

      if (losersMatch) {
        winnersMatch.loserNextMatchId = `L${losersRound}-${losersMatch.matchNumber}`;
        winnersMatch.loserNextMatchSlot = i % 2 === 0 ? 'home' : 'away';
      }
    }
  }
}

/**
 * Generate bracket based on tournament mode
 */
export function generateBracket(options: BracketGenerationOptions): Bracket {
  switch (options.mode) {
    case 'SINGLE_ELIMINATION':
      return generateSingleElimination(options);
    case 'DOUBLE_ELIMINATION':
      return generateDoubleElimination(options);
    default:
      throw new Error(`Bracket generation not supported for mode: ${options.mode}`);
  }
}

/**
 * Get the number of matches in each round for single elimination
 */
export function getMatchesPerRound(totalTeams: number): number[] {
  const bracketSize = calculateBracketSize(totalTeams);
  const totalRounds = calculateRounds(bracketSize);
  const matchesPerRound: number[] = [];

  let matches = bracketSize / 2;
  for (let i = 0; i < totalRounds; i++) {
    matchesPerRound.push(matches);
    matches = matches / 2;
  }

  return matchesPerRound;
}

/**
 * Get round names for display
 */
export function getRoundName(
  round: number,
  totalRounds: number,
  bracketType: BracketType = 'WINNERS'
): string {
  if (bracketType === 'GRAND_FINAL') {
    return round === totalRounds ? 'Grand Final' : 'Bracket Reset';
  }

  const prefix = bracketType === 'LOSERS' ? 'Losers ' : '';

  if (round === totalRounds) return `${prefix}Finals`;
  if (round === totalRounds - 1) return `${prefix}Semi-Finals`;
  if (round === totalRounds - 2) return `${prefix}Quarter-Finals`;

  return `${prefix}Round ${round}`;
}
