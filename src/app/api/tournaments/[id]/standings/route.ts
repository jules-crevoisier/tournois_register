import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  calculateStandings,
  calculateSwissStandings,
  isRoundRobinComplete,
  isSwissComplete,
  calculateRecommendedRounds,
  type Team as TournamentTeam,
  type Match as TournamentMatch
} from '@/lib/tournament-engine';

/**
 * GET /api/tournaments/[id]/standings
 * Get standings for round robin or Swiss tournaments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          where: { status: 'CONFIRMED' },
          select: { id: true, teamName: true }
        },
        matches: {
          orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }]
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (
      tournament.mode !== 'ROUND_ROBIN' &&
      tournament.mode !== 'SWISS'
    ) {
      return NextResponse.json(
        {
          error:
            'Standings are only available for Round Robin and Swiss tournaments'
        },
        { status: 400 }
      );
    }

    const teams: TournamentTeam[] = tournament.teams.map((team) => ({
      id: team.id,
      teamName: team.teamName
    }));

    const completedMatches: TournamentMatch[] = tournament.matches.map((m) => ({
      tournamentId: m.tournamentId,
      round: m.round,
      matchNumber: m.matchNumber,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      winnerId: m.winnerId,
      status: m.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    }));

    const currentRound =
      tournament.matches.length > 0
        ? Math.max(...tournament.matches.map((m) => m.round))
        : 0;

    if (tournament.mode === 'ROUND_ROBIN') {
      const standings = calculateStandings(teams, completedMatches);

      return NextResponse.json({
        tournamentId: tournament.id,
        mode: 'ROUND_ROBIN',
        currentRound,
        isComplete: isRoundRobinComplete(completedMatches),
        standings: standings.map((s, idx) => ({
          position: idx + 1,
          teamId: s.teamId,
          teamName: s.teamName,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalDifference: s.goalDifference,
          points: s.points
        }))
      });
    } else {
      // Swiss
      const standings = calculateSwissStandings(teams, completedMatches);
      const recommendedRounds = calculateRecommendedRounds(teams.length);

      return NextResponse.json({
        tournamentId: tournament.id,
        mode: 'SWISS',
        currentRound,
        recommendedTotalRounds: recommendedRounds,
        isComplete: isSwissComplete(completedMatches, recommendedRounds),
        standings: standings.map((s, idx) => ({
          position: idx + 1,
          teamId: s.teamId,
          teamName: s.teamName,
          points: s.points,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          buchholz: s.buchholz
        }))
      });
    }
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
