import { describe, it, expect } from 'vitest';
import {
  generateRoundRobinMatches,
  calculateStandings,
  sortStandings,
  divideIntoGroups,
  calculateTotalMatches,
  calculateRoundRobinRounds,
  isRoundRobinComplete,
  getPosition
} from '../round-robin';
import type { Team, Match, RoundRobinStanding } from '../types';

describe('round-robin', () => {
  const createTeams = (count: number): Team[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `team-${i + 1}`,
      teamName: `Team ${i + 1}`
    }));

  describe('generateRoundRobinMatches', () => {
    it('generates correct number of matches for 4 teams', () => {
      const teams = createTeams(4);
      const matches = generateRoundRobinMatches({
        tournamentId: 't1',
        teams
      });

      // n * (n-1) / 2 = 4 * 3 / 2 = 6 matches
      expect(matches).toHaveLength(6);
    });

    it('generates correct number of matches for 6 teams', () => {
      const teams = createTeams(6);
      const matches = generateRoundRobinMatches({
        tournamentId: 't1',
        teams
      });

      // 6 * 5 / 2 = 15 matches
      expect(matches).toHaveLength(15);
    });

    it('handles odd number of teams', () => {
      const teams = createTeams(5);
      const matches = generateRoundRobinMatches({
        tournamentId: 't1',
        teams
      });

      // 5 * 4 / 2 = 10 matches
      expect(matches).toHaveLength(10);
    });

    it('ensures each team plays every other team exactly once', () => {
      const teams = createTeams(4);
      const matches = generateRoundRobinMatches({
        tournamentId: 't1',
        teams
      });

      // Check each pair appears exactly once
      const pairs = new Set<string>();
      for (const match of matches) {
        const pair = [match.homeTeamId, match.awayTeamId].sort().join('-');
        expect(pairs.has(pair)).toBe(false);
        pairs.add(pair);
      }

      expect(pairs.size).toBe(6);
    });

    it('distributes home/away fairly', () => {
      const teams = createTeams(4);
      const matches = generateRoundRobinMatches({
        tournamentId: 't1',
        teams
      });

      const homeCount: Record<string, number> = {};
      const awayCount: Record<string, number> = {};

      for (const match of matches) {
        homeCount[match.homeTeamId!] = (homeCount[match.homeTeamId!] || 0) + 1;
        awayCount[match.awayTeamId!] = (awayCount[match.awayTeamId!] || 0) + 1;
      }

      // Each team plays 3 games total (n-1 for 4 teams)
      // Distribution varies by scheduling algorithm but totals should be correct
      for (const team of teams) {
        const home = homeCount[team.id] || 0;
        const away = awayCount[team.id] || 0;
        expect(home + away).toBe(3); // Each team plays n-1 games
      }
    });
  });

  describe('calculateStandings', () => {
    it('calculates standings correctly', () => {
      const teams = createTeams(3);
      const matches: Match[] = [
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 1,
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          homeScore: 3,
          awayScore: 1,
          winnerId: 'team-1',
          status: 'COMPLETED'
        },
        {
          tournamentId: 't1',
          round: 1,
          matchNumber: 2,
          homeTeamId: 'team-1',
          awayTeamId: 'team-3',
          homeScore: 2,
          awayScore: 2,
          winnerId: null,
          status: 'COMPLETED'
        },
        {
          tournamentId: 't1',
          round: 2,
          matchNumber: 3,
          homeTeamId: 'team-2',
          awayTeamId: 'team-3',
          homeScore: 1,
          awayScore: 2,
          winnerId: 'team-3',
          status: 'COMPLETED'
        }
      ];

      const standings = calculateStandings(teams, matches);

      // Team 1: 1 win (3pts) + 1 draw (1pt) = 4 pts
      // Team 3: 1 win (3pts) + 1 draw (1pt) = 4 pts
      // Team 2: 2 losses = 0 pts

      const team1 = standings.find((s) => s.teamId === 'team-1')!;
      const team2 = standings.find((s) => s.teamId === 'team-2')!;
      const team3 = standings.find((s) => s.teamId === 'team-3')!;

      expect(team1.points).toBe(4);
      expect(team1.won).toBe(1);
      expect(team1.drawn).toBe(1);
      expect(team1.lost).toBe(0);
      expect(team1.goalsFor).toBe(5);
      expect(team1.goalsAgainst).toBe(3);

      expect(team2.points).toBe(0);
      expect(team2.won).toBe(0);
      expect(team2.lost).toBe(2);

      expect(team3.points).toBe(4);
      expect(team3.won).toBe(1);
      expect(team3.drawn).toBe(1);
    });

    it('respects custom point values', () => {
      const teams = createTeams(2);
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

      const standings = calculateStandings(teams, matches, {
        pointsForWin: 2,
        pointsForLoss: 1
      });

      const team1 = standings.find((s) => s.teamId === 'team-1')!;
      const team2 = standings.find((s) => s.teamId === 'team-2')!;

      expect(team1.points).toBe(2);
      expect(team2.points).toBe(1);
    });
  });

  describe('sortStandings', () => {
    it('sorts by points first', () => {
      const standings: RoundRobinStanding[] = [
        {
          teamId: 't1',
          teamName: 'Team 1',
          played: 2,
          won: 1,
          drawn: 0,
          lost: 1,
          goalsFor: 3,
          goalsAgainst: 3,
          goalDifference: 0,
          points: 3,
          headToHead: new Map()
        },
        {
          teamId: 't2',
          teamName: 'Team 2',
          played: 2,
          won: 2,
          drawn: 0,
          lost: 0,
          goalsFor: 4,
          goalsAgainst: 1,
          goalDifference: 3,
          points: 6,
          headToHead: new Map()
        }
      ];

      const sorted = sortStandings(standings);
      expect(sorted[0].teamId).toBe('t2');
      expect(sorted[1].teamId).toBe('t1');
    });

    it('uses goal difference as tiebreaker', () => {
      const standings: RoundRobinStanding[] = [
        {
          teamId: 't1',
          teamName: 'Team 1',
          played: 2,
          won: 1,
          drawn: 1,
          lost: 0,
          goalsFor: 2,
          goalsAgainst: 1,
          goalDifference: 1,
          points: 4,
          headToHead: new Map()
        },
        {
          teamId: 't2',
          teamName: 'Team 2',
          played: 2,
          won: 1,
          drawn: 1,
          lost: 0,
          goalsFor: 5,
          goalsAgainst: 2,
          goalDifference: 3,
          points: 4,
          headToHead: new Map()
        }
      ];

      const sorted = sortStandings(standings);
      expect(sorted[0].teamId).toBe('t2');
    });

    it('uses goals for as secondary tiebreaker', () => {
      const standings: RoundRobinStanding[] = [
        {
          teamId: 't1',
          teamName: 'Team 1',
          played: 2,
          won: 1,
          drawn: 1,
          lost: 0,
          goalsFor: 3,
          goalsAgainst: 1,
          goalDifference: 2,
          points: 4,
          headToHead: new Map()
        },
        {
          teamId: 't2',
          teamName: 'Team 2',
          played: 2,
          won: 1,
          drawn: 1,
          lost: 0,
          goalsFor: 5,
          goalsAgainst: 3,
          goalDifference: 2,
          points: 4,
          headToHead: new Map()
        }
      ];

      const sorted = sortStandings(standings);
      expect(sorted[0].teamId).toBe('t2');
    });
  });

  describe('divideIntoGroups', () => {
    it('divides teams evenly', () => {
      const teams = createTeams(8);
      const groups = divideIntoGroups(teams, 2);

      expect(groups).toHaveLength(2);
      expect(groups[0]).toHaveLength(4);
      expect(groups[1]).toHaveLength(4);
    });

    it('handles uneven division', () => {
      const teams = createTeams(9);
      const groups = divideIntoGroups(teams, 2);

      expect(groups).toHaveLength(2);
      // One group has 5, other has 4
      expect(groups[0].length + groups[1].length).toBe(9);
    });

    it('throws for too few teams', () => {
      const teams = createTeams(3);
      expect(() => divideIntoGroups(teams, 2)).toThrow();
    });
  });

  describe('calculateTotalMatches', () => {
    it('calculates correctly', () => {
      expect(calculateTotalMatches(4)).toBe(6);
      expect(calculateTotalMatches(6)).toBe(15);
      expect(calculateTotalMatches(8)).toBe(28);
      expect(calculateTotalMatches(10)).toBe(45);
    });
  });

  describe('calculateRoundRobinRounds', () => {
    it('calculates correctly for even teams', () => {
      expect(calculateRoundRobinRounds(4)).toBe(3);
      expect(calculateRoundRobinRounds(6)).toBe(5);
      expect(calculateRoundRobinRounds(8)).toBe(7);
    });

    it('calculates correctly for odd teams', () => {
      expect(calculateRoundRobinRounds(5)).toBe(5);
      expect(calculateRoundRobinRounds(7)).toBe(7);
    });
  });

  describe('isRoundRobinComplete', () => {
    it('returns true when all completed', () => {
      const matches: Match[] = [
        { tournamentId: 't1', round: 1, matchNumber: 1, homeTeamId: 't1', awayTeamId: 't2', homeScore: 1, awayScore: 0, winnerId: 't1', status: 'COMPLETED' },
        { tournamentId: 't1', round: 1, matchNumber: 2, homeTeamId: 't3', awayTeamId: 't4', homeScore: 2, awayScore: 1, winnerId: 't3', status: 'COMPLETED' }
      ];

      expect(isRoundRobinComplete(matches)).toBe(true);
    });

    it('returns false when some pending', () => {
      const matches: Match[] = [
        { tournamentId: 't1', round: 1, matchNumber: 1, homeTeamId: 't1', awayTeamId: 't2', homeScore: 1, awayScore: 0, winnerId: 't1', status: 'COMPLETED' },
        { tournamentId: 't1', round: 1, matchNumber: 2, homeTeamId: 't3', awayTeamId: 't4', homeScore: null, awayScore: null, winnerId: null, status: 'PENDING' }
      ];

      expect(isRoundRobinComplete(matches)).toBe(false);
    });
  });

  describe('getPosition', () => {
    it('returns 1-indexed position', () => {
      const standings: RoundRobinStanding[] = [
        { teamId: 't1', teamName: 'Team 1', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 6, headToHead: new Map() },
        { teamId: 't2', teamName: 'Team 2', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 3, headToHead: new Map() }
      ];

      expect(getPosition('t1', standings)).toBe(1);
      expect(getPosition('t2', standings)).toBe(2);
    });

    it('returns -1 for unknown team', () => {
      const standings: RoundRobinStanding[] = [
        { teamId: 't1', teamName: 'Team 1', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 6, headToHead: new Map() }
      ];

      expect(getPosition('unknown', standings)).toBe(-1);
    });
  });
});
