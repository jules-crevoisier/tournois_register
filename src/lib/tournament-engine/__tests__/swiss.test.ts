import { describe, it, expect } from 'vitest';
import {
  generateFirstRound,
  generateNextRound,
  calculateSwissStandings,
  sortSwissStandings,
  calculateRecommendedRounds,
  hasReceivedBye,
  validatePairing,
  isSwissComplete
} from '../swiss';
import type { Team, Match, SwissStanding } from '../types';

describe('swiss', () => {
  const createTeams = (count: number): Team[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `team-${i + 1}`,
      teamName: `Team ${i + 1}`,
      seed: i + 1
    }));

  describe('generateFirstRound', () => {
    it('pairs top half vs bottom half', () => {
      const teams = createTeams(8);
      const round = generateFirstRound({
        tournamentId: 't1',
        teams,
        totalRounds: 3
      });

      expect(round.roundNumber).toBe(1);
      expect(round.matches).toHaveLength(4);

      // Seed 1 should play seed 5
      const match1 = round.matches.find((m) => m.homeTeamId === 'team-1');
      expect(match1?.awayTeamId).toBe('team-5');

      // Seed 2 should play seed 6
      const match2 = round.matches.find((m) => m.homeTeamId === 'team-2');
      expect(match2?.awayTeamId).toBe('team-6');
    });

    it('handles odd number of teams with bye', () => {
      const teams = createTeams(7);
      const round = generateFirstRound({
        tournamentId: 't1',
        teams,
        totalRounds: 3
      });

      // 3 real matches + 1 bye
      expect(round.matches).toHaveLength(4);

      // One match should be a bye (awayTeamId is null)
      const byeMatch = round.matches.find((m) => m.awayTeamId === null);
      expect(byeMatch).toBeDefined();
      expect(byeMatch?.status).toBe('COMPLETED');
      expect(byeMatch?.winnerId).toBe(byeMatch?.homeTeamId);
    });
  });

  describe('calculateSwissStandings', () => {
    it('calculates points correctly', () => {
      const teams = createTeams(4);
      const matches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: 'team-3',
          homeScore: 2,
          awayScore: 1,
          winnerId: 'team-1',
          status: 'COMPLETED'
        },
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 2,
          homeTeamId: 'team-2',
          awayTeamId: 'team-4',
          homeScore: 1,
          awayScore: 1,
          winnerId: null,
          status: 'COMPLETED'
        }
      ];

      const standings = calculateSwissStandings(teams, matches);

      // Team 1: 1 win = 3 pts
      // Team 2: 1 draw = 1 pt
      // Team 3: 1 loss = 0 pts
      // Team 4: 1 draw = 1 pt

      const team1 = standings.find((s) => s.teamId === 'team-1')!;
      const team2 = standings.find((s) => s.teamId === 'team-2')!;
      const team3 = standings.find((s) => s.teamId === 'team-3')!;
      const team4 = standings.find((s) => s.teamId === 'team-4')!;

      expect(team1.points).toBe(3);
      expect(team1.wins).toBe(1);
      expect(team2.points).toBe(1);
      expect(team2.draws).toBe(1);
      expect(team3.points).toBe(0);
      expect(team3.losses).toBe(1);
      expect(team4.points).toBe(1);
    });

    it('calculates Buchholz tiebreaker', () => {
      const teams = createTeams(4);
      const matches: Match[] = [
        // Round 1
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: 'team-3',
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-1',
          status: 'COMPLETED'
        },
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 2,
          homeTeamId: 'team-2',
          awayTeamId: 'team-4',
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-2',
          status: 'COMPLETED'
        }
      ];

      const standings = calculateSwissStandings(teams, matches);

      // Team 1 played team 3 (0 pts) -> Buchholz = 0
      // Team 2 played team 4 (0 pts) -> Buchholz = 0
      const team1 = standings.find((s) => s.teamId === 'team-1')!;
      const team2 = standings.find((s) => s.teamId === 'team-2')!;

      expect(team1.buchholz).toBe(0);
      expect(team2.buchholz).toBe(0);
    });

    it('tracks opponents correctly', () => {
      const teams = createTeams(4);
      const matches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-1',
          status: 'COMPLETED'
        }
      ];

      const standings = calculateSwissStandings(teams, matches);
      const team1 = standings.find((s) => s.teamId === 'team-1')!;
      const team2 = standings.find((s) => s.teamId === 'team-2')!;

      expect(team1.opponents).toContain('team-2');
      expect(team2.opponents).toContain('team-1');
    });
  });

  describe('sortSwissStandings', () => {
    it('sorts by points first', () => {
      const standings: SwissStanding[] = [
        {
          teamId: 't1',
          teamName: 'Team 1',
          points: 3,
          wins: 1,
          draws: 0,
          losses: 0,
          buchholz: 0,
          opponents: []
        },
        {
          teamId: 't2',
          teamName: 'Team 2',
          points: 6,
          wins: 2,
          draws: 0,
          losses: 0,
          buchholz: 0,
          opponents: []
        }
      ];

      const sorted = sortSwissStandings(standings);
      expect(sorted[0].teamId).toBe('t2');
    });

    it('uses Buchholz as tiebreaker', () => {
      const standings: SwissStanding[] = [
        {
          teamId: 't1',
          teamName: 'Team 1',
          points: 3,
          wins: 1,
          draws: 0,
          losses: 0,
          buchholz: 5,
          opponents: []
        },
        {
          teamId: 't2',
          teamName: 'Team 2',
          points: 3,
          wins: 1,
          draws: 0,
          losses: 0,
          buchholz: 8,
          opponents: []
        }
      ];

      const sorted = sortSwissStandings(standings);
      expect(sorted[0].teamId).toBe('t2');
    });
  });

  describe('generateNextRound', () => {
    it('pairs teams with same score', () => {
      const teams = createTeams(4);
      const completedMatches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: 'team-3',
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-1',
          status: 'COMPLETED'
        },
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 2,
          homeTeamId: 'team-2',
          awayTeamId: 'team-4',
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-2',
          status: 'COMPLETED'
        }
      ];

      const nextRound = generateNextRound(
        { tournamentId: 't1', teams, totalRounds: 3 },
        completedMatches,
        1
      );

      expect(nextRound.roundNumber).toBe(2);
      expect(nextRound.matches).toHaveLength(2);

      // Winners should play each other: team-1 vs team-2
      // Losers should play each other: team-3 vs team-4
      const winners = nextRound.matches.find(
        (m) =>
          (m.homeTeamId === 'team-1' && m.awayTeamId === 'team-2') ||
          (m.homeTeamId === 'team-2' && m.awayTeamId === 'team-1')
      );
      expect(winners).toBeDefined();

      const losers = nextRound.matches.find(
        (m) =>
          (m.homeTeamId === 'team-3' && m.awayTeamId === 'team-4') ||
          (m.homeTeamId === 'team-4' && m.awayTeamId === 'team-3')
      );
      expect(losers).toBeDefined();
    });

    it('avoids rematches', () => {
      const teams = createTeams(4);
      const completedMatches: Match[] = [
        // Round 1: t1 vs t2, t3 vs t4
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-1',
          status: 'COMPLETED'
        },
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 2,
          homeTeamId: 'team-3',
          awayTeamId: 'team-4',
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-3',
          status: 'COMPLETED'
        }
      ];

      const nextRound = generateNextRound(
        { tournamentId: 't1', teams, totalRounds: 3 },
        completedMatches,
        1
      );

      // Should not have t1 vs t2 or t3 vs t4 again
      for (const match of nextRound.matches) {
        const pair1 =
          (match.homeTeamId === 'team-1' && match.awayTeamId === 'team-2') ||
          (match.homeTeamId === 'team-2' && match.awayTeamId === 'team-1');
        const pair2 =
          (match.homeTeamId === 'team-3' && match.awayTeamId === 'team-4') ||
          (match.homeTeamId === 'team-4' && match.awayTeamId === 'team-3');
        expect(pair1).toBe(false);
        expect(pair2).toBe(false);
      }
    });

    it('throws when all rounds completed', () => {
      const teams = createTeams(4);
      expect(() =>
        generateNextRound(
          { tournamentId: 't1', teams, totalRounds: 2 },
          [],
          2
        )
      ).toThrow();
    });
  });

  describe('calculateRecommendedRounds', () => {
    it('returns correct values', () => {
      expect(calculateRecommendedRounds(2)).toBe(1);
      expect(calculateRecommendedRounds(4)).toBe(2);
      expect(calculateRecommendedRounds(8)).toBe(3);
      expect(calculateRecommendedRounds(16)).toBe(4);
      expect(calculateRecommendedRounds(32)).toBe(5);
    });

    it('returns 0 for less than 2 teams', () => {
      expect(calculateRecommendedRounds(1)).toBe(0);
    });
  });

  describe('hasReceivedBye', () => {
    it('returns true if team has bye', () => {
      const matches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: null,
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-1',
          status: 'COMPLETED'
        }
      ];

      expect(hasReceivedBye('team-1', matches)).toBe(true);
      expect(hasReceivedBye('team-2', matches)).toBe(false);
    });
  });

  describe('validatePairing', () => {
    it('detects rematches', () => {
      const previousMatches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-1',
          status: 'COMPLETED'
        }
      ];

      const newMatches: Match[] = [
        {
          tournamentId: 't1',
          round: 2,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          homeScore: null,
          awayScore: null,
          winnerId: null,
          status: 'PENDING'
        }
      ];

      const result = validatePairing(newMatches, previousMatches);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('detects double byes', () => {
      const previousMatches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: null,
          homeScore: 1,
          awayScore: 0,
          winnerId: 'team-1',
          status: 'COMPLETED'
        }
      ];

      const newMatches: Match[] = [
        {
          tournamentId: 't1',
          round: 2,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: null,
          homeScore: null,
          awayScore: null,
          winnerId: null,
          status: 'PENDING'
        }
      ];

      const result = validatePairing(newMatches, previousMatches);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('bye'))).toBe(true);
    });
  });

  describe('isSwissComplete', () => {
    it('returns true when all rounds completed', () => {
      const matches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 't1',
          awayTeamId: 't2',
          homeScore: 1,
          awayScore: 0,
          winnerId: 't1',
          status: 'COMPLETED'
        },
        {
          tournamentId: 't1',
          round: 2,
          matchNumber: 1,
          homeTeamId: 't1',
          awayTeamId: 't2',
          homeScore: 0,
          awayScore: 1,
          winnerId: 't2',
          status: 'COMPLETED'
        }
      ];

      expect(isSwissComplete(matches, 2)).toBe(true);
    });

    it('returns false when not all rounds exist', () => {
      const matches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 't1',
          awayTeamId: 't2',
          homeScore: 1,
          awayScore: 0,
          winnerId: 't1',
          status: 'COMPLETED'
        }
      ];

      expect(isSwissComplete(matches, 2)).toBe(false);
    });

    it('returns false when matches pending', () => {
      const matches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 't1',
          awayTeamId: 't2',
          homeScore: 1,
          awayScore: 0,
          winnerId: 't1',
          status: 'COMPLETED'
        },
        {
          tournamentId: 't1',
          round: 2,
          matchNumber: 1,
          homeTeamId: 't1',
          awayTeamId: 't2',
          homeScore: null,
          awayScore: null,
          winnerId: null,
          status: 'PENDING'
        }
      ];

      expect(isSwissComplete(matches, 2)).toBe(false);
    });
  });
});
