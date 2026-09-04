/**
 * Tournament Engine
 *
 * A comprehensive library for managing esports tournament formats.
 * Supports Single Elimination, Double Elimination, Round Robin, and Swiss System.
 */

// Types
export * from './types';

// Seeding
export {
  generateSeedOrder,
  calculateBracketSize,
  calculateByes,
  seedTeamsIntoBracket,
  createMatchPairs,
  getByeAdvancers,
  calculateRounds,
  shuffleTeams,
  assignSeeds
} from './seeding';

// Bracket Generation
export {
  generateBracket,
  generateSingleElimination,
  generateDoubleElimination,
  getMatchesPerRound,
  getRoundName
} from './bracket-generator';

// Round Robin
export {
  generateRoundRobinMatches,
  generateSimpleRoundRobin,
  calculateStandings,
  sortStandings,
  divideIntoGroups,
  calculateTotalMatches,
  calculateRoundRobinRounds,
  isRoundRobinComplete,
  getPosition
} from './round-robin';

// Swiss System
export {
  generateFirstRound,
  generateNextRound,
  calculateSwissStandings,
  sortSwissStandings,
  calculateRecommendedRounds,
  hasReceivedBye,
  validatePairing,
  isSwissComplete
} from './swiss';

// Match Resolution
export {
  reportScore,
  resolveMatch,
  resolveMatchSingleElimination,
  resolveMatchDoubleElimination,
  isMatchReady,
  getReadyMatches,
  getCurrentRound,
  isRoundComplete,
  isTournamentComplete,
  getTournamentWinner,
  forfeitMatch,
  cancelMatch,
  updateMatchStatus,
  getMatch,
  getTeamMatches,
  getTeamStats
} from './match-resolver';
