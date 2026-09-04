import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateNextRound,
  calculateSwissStandings,
  calculateRecommendedRounds,
  isSwissComplete,
  type Team as TournamentTeam,
  type Match as TournamentMatch
} from '@/lib/tournament-engine';

/**
 * POST /api/tournaments/[id]/swiss-round
 * Generate the next Swiss round
 */
export async function POST(
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

    if (tournament.mode !== 'SWISS') {
      return NextResponse.json(
        { error: 'This endpoint is only for Swiss tournaments' },
        { status: 400 }
      );
    }

    // Parse optional request body
    let requestBody: { totalRounds?: number } = {};
    try {
      requestBody = await request.json();
    } catch {
      // No body provided
    }

    const teams: TournamentTeam[] = tournament.teams.map((team) => ({
      id: team.id,
      teamName: team.teamName
    }));

    const totalRounds =
      requestBody.totalRounds ?? calculateRecommendedRounds(teams.length);

    // Check current round status
    const currentRound =
      tournament.matches.length > 0
        ? Math.max(...tournament.matches.map((m) => m.round))
        : 0;

    // Check if current round is complete
    const currentRoundMatches = tournament.matches.filter(
      (m) => m.round === currentRound
    );
    const roundComplete = currentRoundMatches.every(
      (m) => m.status === 'COMPLETED' || m.status === 'CANCELLED'
    );

    if (!roundComplete && currentRound > 0) {
      return NextResponse.json(
        {
          error: `Round ${currentRound} is not complete. Complete all matches before generating next round.`
        },
        { status: 400 }
      );
    }

    // Check if tournament is already complete
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

    if (isSwissComplete(completedMatches, totalRounds)) {
      const standings = calculateSwissStandings(teams, completedMatches);
      return NextResponse.json(
        {
          error: 'Swiss tournament is complete',
          standings: standings.map((s, idx) => ({
            position: idx + 1,
            ...s
          }))
        },
        { status: 400 }
      );
    }

    // Generate next round
    const nextRound = generateNextRound(
      { tournamentId: id, teams, totalRounds },
      completedMatches,
      currentRound
    );

    // Create matches in database
    const createdMatches = await prisma.$transaction(
      nextRound.matches.map((match) =>
        prisma.match.create({
          data: {
            tournamentId: match.tournamentId,
            round: match.round,
            matchNumber: match.matchNumber,
            homeTeamId: match.homeTeamId,
            awayTeamId: match.awayTeamId,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            winnerId: match.winnerId,
            status: match.status
          }
        })
      )
    );

    return NextResponse.json({
      message: `Round ${nextRound.roundNumber} generated successfully`,
      round: nextRound.roundNumber,
      matchCount: createdMatches.length,
      remainingRounds: totalRounds - nextRound.roundNumber
    });
  } catch (error) {
    console.error('Error generating Swiss round:', error);
    return NextResponse.json(
      { error: 'Failed to generate Swiss round' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tournaments/[id]/swiss-round
 * Get current Swiss standings
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
        matches: true
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.mode !== 'SWISS') {
      return NextResponse.json(
        { error: 'This endpoint is only for Swiss tournaments' },
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

    const standings = calculateSwissStandings(teams, completedMatches);
    const currentRound =
      tournament.matches.length > 0
        ? Math.max(...tournament.matches.map((m) => m.round))
        : 0;
    const recommendedRounds = calculateRecommendedRounds(teams.length);

    return NextResponse.json({
      tournamentId: tournament.id,
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
  } catch (error) {
    console.error('Error fetching Swiss standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Swiss standings' },
      { status: 500 }
    );
  }
}
