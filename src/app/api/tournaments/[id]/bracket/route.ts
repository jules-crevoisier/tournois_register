import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateBracket,
  generateRoundRobinMatches,
  generateFirstRound,
  calculateRecommendedRounds,
  type Team as TournamentTeam
} from '@/lib/tournament-engine';

/**
 * GET /api/tournaments/[id]/bracket
 * Retrieve the bracket/matches for a tournament
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
        matches: {
          orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
          include: {
            homeTeam: { select: { id: true, teamName: true } },
            awayTeam: { select: { id: true, teamName: true } },
            winner: { select: { id: true, teamName: true } }
          }
        },
        teams: {
          where: { status: 'CONFIRMED' },
          select: { id: true, teamName: true }
        }
      }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tournamentId: tournament.id,
      mode: tournament.mode,
      matches: tournament.matches,
      teams: tournament.teams,
      totalRounds: tournament.matches.length > 0
        ? Math.max(...tournament.matches.map((m) => m.round))
        : 0
    });
  } catch (error) {
    console.error('Error fetching bracket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bracket' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tournaments/[id]/bracket
 * Generate bracket/matches for a tournament
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
          orderBy: { registeredAt: 'asc' }
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

    // Check if bracket already exists
    if (tournament.matches.length > 0) {
      return NextResponse.json(
        { error: 'Bracket already generated. Delete existing matches first.' },
        { status: 400 }
      );
    }

    // Check minimum teams
    if (tournament.teams.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 confirmed teams to generate bracket' },
        { status: 400 }
      );
    }

    // Check max teams for elimination brackets
    if (
      (tournament.mode === 'SINGLE_ELIMINATION' ||
        tournament.mode === 'DOUBLE_ELIMINATION') &&
      tournament.teams.length > 64
    ) {
      return NextResponse.json(
        { error: 'Maximum 64 teams supported for elimination brackets' },
        { status: 400 }
      );
    }

    // Prepare teams for bracket generation
    const teams: TournamentTeam[] = tournament.teams.map((team, index) => ({
      id: team.id,
      teamName: team.teamName,
      seed: index + 1
    }));

    // Parse optional request body
    let requestBody: { seedTeams?: boolean; swissRounds?: number } = {};
    try {
      requestBody = await request.json();
    } catch {
      // No body provided, use defaults
    }

    let matches: Array<{
      tournamentId: string;
      round: number;
      matchNumber: number;
      homeTeamId: string | null;
      awayTeamId: string | null;
      homeScore: number | null;
      awayScore: number | null;
      winnerId: string | null;
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    }> = [];

    switch (tournament.mode) {
      case 'SINGLE_ELIMINATION':
      case 'DOUBLE_ELIMINATION': {
        const bracket = generateBracket({
          tournamentId: id,
          teams,
          mode: tournament.mode,
          seedTeams: requestBody.seedTeams ?? true
        });
        matches = bracket.matches.map((m) => ({
          tournamentId: m.tournamentId,
          round: m.round,
          matchNumber: m.matchNumber,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          winnerId: m.winnerId,
          status: m.status
        }));
        // Include losers matches for double elimination
        if (bracket.losersMatches) {
          matches.push(
            ...bracket.losersMatches.map((m) => ({
              tournamentId: m.tournamentId,
              round: m.round + 100, // Offset losers bracket rounds
              matchNumber: m.matchNumber,
              homeTeamId: m.homeTeamId,
              awayTeamId: m.awayTeamId,
              homeScore: m.homeScore,
              awayScore: m.awayScore,
              winnerId: m.winnerId,
              status: m.status
            }))
          );
        }
        break;
      }

      case 'ROUND_ROBIN': {
        const rrMatches = generateRoundRobinMatches({
          tournamentId: id,
          teams
        });
        matches = rrMatches.map((m) => ({
          tournamentId: m.tournamentId,
          round: m.round,
          matchNumber: m.matchNumber,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          winnerId: m.winnerId,
          status: m.status
        }));
        break;
      }

      case 'SWISS': {
        const totalRounds =
          requestBody.swissRounds ?? calculateRecommendedRounds(teams.length);
        const firstRound = generateFirstRound({
          tournamentId: id,
          teams,
          totalRounds
        });
        matches = firstRound.matches.map((m) => ({
          tournamentId: m.tournamentId,
          round: m.round,
          matchNumber: m.matchNumber,
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          winnerId: m.winnerId,
          status: m.status
        }));
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported tournament mode: ${tournament.mode}` },
          { status: 400 }
        );
    }

    // Create matches in database
    const createdMatches = await prisma.$transaction(
      matches.map((match) =>
        prisma.match.create({
          data: match
        })
      )
    );

    // Update tournament status to ONGOING if it was OPEN or CLOSED
    if (
      tournament.status === 'OPEN' ||
      tournament.status === 'CLOSED'
    ) {
      await prisma.tournament.update({
        where: { id },
        data: { status: 'ONGOING' }
      });
    }

    return NextResponse.json({
      message: 'Bracket generated successfully',
      matchCount: createdMatches.length,
      mode: tournament.mode
    });
  } catch (error) {
    console.error('Error generating bracket:', error);
    return NextResponse.json(
      { error: 'Failed to generate bracket' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tournaments/[id]/bracket
 * Delete all matches for a tournament (reset bracket)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id }
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check if any matches have been played
    const playedMatches = await prisma.match.count({
      where: {
        tournamentId: id,
        status: { in: ['IN_PROGRESS', 'COMPLETED'] }
      }
    });

    if (playedMatches > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete bracket with matches in progress or completed. Cancel them first.'
        },
        { status: 400 }
      );
    }

    // Delete all matches
    const deleted = await prisma.match.deleteMany({
      where: { tournamentId: id }
    });

    return NextResponse.json({
      message: 'Bracket deleted successfully',
      deletedCount: deleted.count
    });
  } catch (error) {
    console.error('Error deleting bracket:', error);
    return NextResponse.json(
      { error: 'Failed to delete bracket' },
      { status: 500 }
    );
  }
}
