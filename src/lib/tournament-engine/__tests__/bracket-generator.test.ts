import { describe, it, expect } from 'vitest';
import {
  generateSingleElimination,
  generateDoubleElimination,
  generateBracket,
  getMatchesPerRound,
  getRoundName
} from '../bracket-generator';
import type { Team } from '../types';

describe('bracket-generator', () => {
  const createTeams = (count: number): Team[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `team-${i + 1}`,
      teamName: `Team ${i + 1}`,
      seed: i + 1
    }));

  describe('generateSingleElimination', () => {
    it('generates correct bracket for 4 teams', () => {
      const teams = createTeams(4);
      const bracket = generateSingleElimination({
        tournamentId: 'tournament-1',
        teams,
        mode: 'SINGLE_ELIMINATION'
      });

      expect(bracket.mode).toBe('SINGLE_ELIMINATION');
      expect(bracket.totalRounds).toBe(2);
      expect(bracket.matches).toHaveLength(3); // 2 + 1

      // Round 1 should have 2 matches
      const round1 = bracket.matches.filter((m) => m.round === 1);
      expect(round1).toHaveLength(2);

      // Round 2 (final) should have 1 match
      const round2 = bracket.matches.filter((m) => m.round === 2);
      expect(round2).toHaveLength(1);

      // All round 1 matches should be pending
      round1.forEach((m) => {
        expect(m.homeTeamId).not.toBeNull();
        expect(m.awayTeamId).not.toBeNull();
        expect(m.status).toBe('PENDING');
      });
    });

    it('generates correct bracket for 8 teams', () => {
      const teams = createTeams(8);
      const bracket = generateSingleElimination({
        tournamentId: 'tournament-1',
        teams,
        mode: 'SINGLE_ELIMINATION'
      });

      expect(bracket.totalRounds).toBe(3);
      expect(bracket.matches).toHaveLength(7); // 4 + 2 + 1
    });

    it('handles byes correctly for 6 teams', () => {
      const teams = createTeams(6);
      const bracket = generateSingleElimination({
        tournamentId: 'tournament-1',
        teams,
        mode: 'SINGLE_ELIMINATION'
      });

      // Bracket size 8, so 3 rounds
      expect(bracket.totalRounds).toBe(3);

      // Round 1 should have 4 matches, 2 with byes
      const round1 = bracket.matches.filter((m) => m.round === 1);
      expect(round1).toHaveLength(4);

      // 2 matches should be completed (byes)
      const byeMatches = round1.filter((m) => m.status === 'COMPLETED');
      expect(byeMatches.length).toBe(2);

      // Bye winners should be propagated to round 2
      const round2 = bracket.matches.filter((m) => m.round === 2);
      const round2WithTeams = round2.filter(
        (m) => m.homeTeamId !== null || m.awayTeamId !== null
      );
      expect(round2WithTeams.length).toBeGreaterThan(0);
    });

    it('throws for less than 2 teams', () => {
      expect(() =>
        generateSingleElimination({
          tournamentId: 't1',
          teams: createTeams(1),
          mode: 'SINGLE_ELIMINATION'
        })
      ).toThrow();
    });

    it('throws for more than 64 teams', () => {
      expect(() =>
        generateSingleElimination({
          tournamentId: 't1',
          teams: createTeams(65),
          mode: 'SINGLE_ELIMINATION'
        })
      ).toThrow();
    });
  });

  describe('generateDoubleElimination', () => {
    it('generates winners and losers brackets', () => {
      const teams = createTeams(4);
      const bracket = generateDoubleElimination({
        tournamentId: 'tournament-1',
        teams,
        mode: 'DOUBLE_ELIMINATION'
      });

      expect(bracket.mode).toBe('DOUBLE_ELIMINATION');
      expect(bracket.matches.length).toBeGreaterThan(0);
      expect(bracket.losersMatches).toBeDefined();
      expect(bracket.losersMatches!.length).toBeGreaterThan(0);

      // Check for grand final
      const grandFinal = bracket.matches.find(
        (m) => m.bracketType === 'GRAND_FINAL'
      );
      expect(grandFinal).toBeDefined();
    });

    it('includes bracket reset option', () => {
      const teams = createTeams(4);
      const bracket = generateDoubleElimination({
        tournamentId: 'tournament-1',
        teams,
        mode: 'DOUBLE_ELIMINATION',
        bracketResetInFinal: true
      });

      // Should have 2 grand final matches (regular + reset)
      const grandFinals = bracket.matches.filter(
        (m) => m.bracketType === 'GRAND_FINAL'
      );
      expect(grandFinals.length).toBe(2);
    });
  });

  describe('generateBracket', () => {
    it('routes to single elimination', () => {
      const teams = createTeams(4);
      const bracket = generateBracket({
        tournamentId: 't1',
        teams,
        mode: 'SINGLE_ELIMINATION'
      });

      expect(bracket.mode).toBe('SINGLE_ELIMINATION');
    });

    it('routes to double elimination', () => {
      const teams = createTeams(4);
      const bracket = generateBracket({
        tournamentId: 't1',
        teams,
        mode: 'DOUBLE_ELIMINATION'
      });

      expect(bracket.mode).toBe('DOUBLE_ELIMINATION');
    });

    it('throws for unsupported modes', () => {
      expect(() =>
        generateBracket({
          tournamentId: 't1',
          teams: createTeams(4),
          mode: 'ROUND_ROBIN'
        })
      ).toThrow();
    });
  });

  describe('getMatchesPerRound', () => {
    it('returns correct matches per round for 4 teams', () => {
      const matches = getMatchesPerRound(4);
      expect(matches).toEqual([2, 1]);
    });

    it('returns correct matches per round for 8 teams', () => {
      const matches = getMatchesPerRound(8);
      expect(matches).toEqual([4, 2, 1]);
    });

    it('returns correct matches per round for 16 teams', () => {
      const matches = getMatchesPerRound(16);
      expect(matches).toEqual([8, 4, 2, 1]);
    });

    it('handles teams requiring byes', () => {
      const matches = getMatchesPerRound(6);
      expect(matches).toEqual([4, 2, 1]); // Bracket size 8
    });
  });

  describe('getRoundName', () => {
    it('returns correct names for single elimination', () => {
      expect(getRoundName(3, 3)).toBe('Finals');
      expect(getRoundName(2, 3)).toBe('Semi-Finals');
      expect(getRoundName(1, 3)).toBe('Quarter-Finals');
    });

    it('returns numbered rounds for early rounds', () => {
      expect(getRoundName(1, 5)).toBe('Round 1');
      expect(getRoundName(2, 5)).toBe('Round 2');
    });

    it('handles losers bracket', () => {
      expect(getRoundName(3, 3, 'LOSERS')).toBe('Losers Finals');
      expect(getRoundName(2, 3, 'LOSERS')).toBe('Losers Semi-Finals');
    });

    it('handles grand final', () => {
      expect(getRoundName(4, 4, 'GRAND_FINAL')).toBe('Grand Final');
      expect(getRoundName(5, 4, 'GRAND_FINAL')).toBe('Bracket Reset');
    });
  });
});
