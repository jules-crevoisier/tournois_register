import { describe, it, expect } from 'vitest';
import {
  generateSeedOrder,
  calculateBracketSize,
  calculateByes,
  seedTeamsIntoBracket,
  createMatchPairs,
  getByeAdvancers,
  calculateRounds,
  assignSeeds
} from '../seeding';
import type { Team } from '../types';

describe('seeding', () => {
  describe('generateSeedOrder', () => {
    it('generates correct order for 2 teams', () => {
      expect(generateSeedOrder(2)).toEqual([1, 2]);
    });

    it('generates correct order for 4 teams', () => {
      expect(generateSeedOrder(4)).toEqual([1, 4, 2, 3]);
    });

    it('generates correct order for 8 teams', () => {
      const order = generateSeedOrder(8);
      expect(order).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
    });

    it('generates correct order for 16 teams', () => {
      const order = generateSeedOrder(16);
      // First match should be 1 vs 16
      expect(order[0]).toBe(1);
      expect(order[1]).toBe(16);
      // Second match should be 8 vs 9
      expect(order[2]).toBe(8);
      expect(order[3]).toBe(9);
    });

    it('throws for non-power of 2', () => {
      expect(() => generateSeedOrder(3)).toThrow();
      expect(() => generateSeedOrder(5)).toThrow();
      expect(() => generateSeedOrder(6)).toThrow();
    });

    it('throws for sizes less than 2', () => {
      expect(() => generateSeedOrder(1)).toThrow();
      expect(() => generateSeedOrder(0)).toThrow();
    });
  });

  describe('calculateBracketSize', () => {
    it('returns 2 for 2 teams', () => {
      expect(calculateBracketSize(2)).toBe(2);
    });

    it('returns 4 for 3-4 teams', () => {
      expect(calculateBracketSize(3)).toBe(4);
      expect(calculateBracketSize(4)).toBe(4);
    });

    it('returns 8 for 5-8 teams', () => {
      expect(calculateBracketSize(5)).toBe(8);
      expect(calculateBracketSize(6)).toBe(8);
      expect(calculateBracketSize(7)).toBe(8);
      expect(calculateBracketSize(8)).toBe(8);
    });

    it('returns 16 for 9-16 teams', () => {
      expect(calculateBracketSize(9)).toBe(16);
      expect(calculateBracketSize(16)).toBe(16);
    });

    it('returns 64 for 33-64 teams', () => {
      expect(calculateBracketSize(33)).toBe(64);
      expect(calculateBracketSize(64)).toBe(64);
    });

    it('throws for less than 2 teams', () => {
      expect(() => calculateBracketSize(1)).toThrow();
    });
  });

  describe('calculateByes', () => {
    it('returns 0 when teams match bracket size', () => {
      expect(calculateByes(4, 4)).toBe(0);
      expect(calculateByes(8, 8)).toBe(0);
      expect(calculateByes(16, 16)).toBe(0);
    });

    it('returns correct bye count', () => {
      expect(calculateByes(3, 4)).toBe(1);
      expect(calculateByes(5, 8)).toBe(3);
      expect(calculateByes(6, 8)).toBe(2);
      expect(calculateByes(10, 16)).toBe(6);
    });
  });

  describe('seedTeamsIntoBracket', () => {
    const createTeams = (count: number): Team[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `team-${i + 1}`,
        teamName: `Team ${i + 1}`,
        seed: i + 1
      }));

    it('places teams correctly for full bracket', () => {
      const teams = createTeams(4);
      const positions = seedTeamsIntoBracket(teams, 4);

      // Expected order: 1 vs 4, 2 vs 3
      expect(positions).toHaveLength(4);
      expect(positions[0]).toBe('team-1'); // Seed 1
      expect(positions[1]).toBe('team-4'); // Seed 4
      expect(positions[2]).toBe('team-2'); // Seed 2
      expect(positions[3]).toBe('team-3'); // Seed 3
    });

    it('handles byes correctly', () => {
      const teams = createTeams(3);
      const positions = seedTeamsIntoBracket(teams, 4);

      expect(positions).toHaveLength(4);
      // One position should be null (bye)
      const byeCount = positions.filter((p) => p === null).length;
      expect(byeCount).toBe(1);
    });

    it('places byes against low seeds', () => {
      const teams = createTeams(5);
      const positions = seedTeamsIntoBracket(teams, 8);

      // 3 byes should be present
      const byeCount = positions.filter((p) => p === null).length;
      expect(byeCount).toBe(3);

      // Top seeds should face byes (null in their pair)
      const pairs = createMatchPairs(positions);
      const byePairs = pairs.filter(
        ([home, away]) => home === null || away === null
      );
      expect(byePairs.length).toBe(3);
    });
  });

  describe('createMatchPairs', () => {
    it('creates correct pairs', () => {
      const positions = ['t1', 't8', 't4', 't5'];
      const pairs = createMatchPairs(positions);

      expect(pairs).toHaveLength(2);
      expect(pairs[0]).toEqual(['t1', 't8']);
      expect(pairs[1]).toEqual(['t4', 't5']);
    });

    it('handles null values (byes)', () => {
      const positions = ['t1', null, 't2', 't3'];
      const pairs = createMatchPairs(positions);

      expect(pairs).toHaveLength(2);
      expect(pairs[0]).toEqual(['t1', null]);
      expect(pairs[1]).toEqual(['t2', 't3']);
    });
  });

  describe('getByeAdvancers', () => {
    it('returns teams with byes', () => {
      const pairs: [string | null, string | null][] = [
        ['t1', null],
        ['t2', 't3'],
        [null, 't4']
      ];

      const advancers = getByeAdvancers(pairs);
      expect(advancers).toEqual(['t1', 't4']);
    });

    it('returns empty for no byes', () => {
      const pairs: [string | null, string | null][] = [
        ['t1', 't2'],
        ['t3', 't4']
      ];

      const advancers = getByeAdvancers(pairs);
      expect(advancers).toEqual([]);
    });
  });

  describe('calculateRounds', () => {
    it('calculates correct round count', () => {
      expect(calculateRounds(2)).toBe(1);
      expect(calculateRounds(4)).toBe(2);
      expect(calculateRounds(8)).toBe(3);
      expect(calculateRounds(16)).toBe(4);
      expect(calculateRounds(32)).toBe(5);
      expect(calculateRounds(64)).toBe(6);
    });
  });

  describe('assignSeeds', () => {
    it('assigns seeds based on position', () => {
      const teams: Team[] = [
        { id: 't1', teamName: 'Team A' },
        { id: 't2', teamName: 'Team B' },
        { id: 't3', teamName: 'Team C' }
      ];

      const seeded = assignSeeds(teams);

      expect(seeded[0].seed).toBe(1);
      expect(seeded[1].seed).toBe(2);
      expect(seeded[2].seed).toBe(3);
    });

    it('preserves existing seeds', () => {
      const teams: Team[] = [
        { id: 't1', teamName: 'Team A', seed: 3 },
        { id: 't2', teamName: 'Team B' },
        { id: 't3', teamName: 'Team C', seed: 1 }
      ];

      const seeded = assignSeeds(teams);

      expect(seeded[0].seed).toBe(3); // Preserved
      expect(seeded[1].seed).toBe(2); // Assigned
      expect(seeded[2].seed).toBe(1); // Preserved
    });
  });
});
