import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TournamentMode } from '@prisma/client';

/**
 * GET /api/matches/[id]
 * Get a single match with details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { id: true, title: true, mode: true }
        },
        homeTeam: { select: { id: true, teamName: true } },
        awayTeam: { select: { id: true, teamName: true } },
        winner: { select: { id: true, teamName: true } }
      }
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches/[id]/report-score
 * Report a match score
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { homeScore, awayScore } = body;

    // Validate scores
    if (typeof homeScore !== 'number' || typeof awayScore !== 'number') {
      return NextResponse.json(
        { error: 'homeScore and awayScore must be numbers' },
        { status: 400 }
      );
    }

    if (homeScore < 0 || awayScore < 0) {
      return NextResponse.json(
        { error: 'Scores cannot be negative' },
        { status: 400 }
      );
    }

    // Get the match
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: {
          select: { id: true, mode: true }
        }
      }
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    if (match.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Match has already been completed' },
        { status: 400 }
      );
    }

    if (match.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot report score for cancelled match' },
        { status: 400 }
      );
    }

    if (!match.homeTeamId || !match.awayTeamId) {
      return NextResponse.json(
        { error: 'Match is missing participants' },
        { status: 400 }
      );
    }

    // Determine winner
    let winnerId: string | null = null;
    const mode = match.tournament.mode as TournamentMode;

    if (homeScore > awayScore) {
      winnerId = match.homeTeamId;
    } else if (awayScore > homeScore) {
      winnerId = match.awayTeamId;
    } else {
      // Draw - only allowed in Round Robin and Swiss
      if (
        mode === 'SINGLE_ELIMINATION' ||
        mode === 'DOUBLE_ELIMINATION'
      ) {
        return NextResponse.json(
          { error: 'Draws are not allowed in elimination formats' },
          { status: 400 }
        );
      }
    }

    // Update the match
    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        winnerId,
        status: 'COMPLETED',
        playedAt: new Date()
      },
      include: {
        homeTeam: { select: { id: true, teamName: true } },
        awayTeam: { select: { id: true, teamName: true } },
        winner: { select: { id: true, teamName: true } }
      }
    });

    // For elimination brackets, advance winner to next match
    if (
      (mode === 'SINGLE_ELIMINATION' || mode === 'DOUBLE_ELIMINATION') &&
      winnerId
    ) {
      await advanceWinner(match, winnerId);
    }

    // Check if tournament is complete
    await checkTournamentCompletion(match.tournamentId);

    return NextResponse.json({
      message: 'Score reported successfully',
      match: updatedMatch
    });
  } catch (error) {
    console.error('Error reporting score:', error);
    return NextResponse.json(
      { error: 'Failed to report score' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/matches/[id]
 * Update match status (e.g., start match, cancel match)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { status, scheduledAt } = body;

    const match = await prisma.match.findUnique({
      where: { id }
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    const updateData: {
      status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      scheduledAt?: Date;
    } = {};

    if (status) {
      const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      // Prevent invalid transitions
      if (match.status === 'COMPLETED' && status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Cannot change status of completed match' },
          { status: 400 }
        );
      }

      updateData.status = status;
    }

    if (scheduledAt) {
      updateData.scheduledAt = new Date(scheduledAt);
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: { select: { id: true, teamName: true } },
        awayTeam: { select: { id: true, teamName: true } }
      }
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

/**
 * Advance winner to next match in elimination bracket
 */
async function advanceWinner(
  completedMatch: {
    tournamentId: string;
    round: number;
    matchNumber: number;
  },
  winnerId: string
): Promise<void> {
  // Find the next match based on round progression
  // In single elimination: round N match M feeds into round N+1 match ceil(M/2)
  const nextRound = completedMatch.round + 1;
  const nextMatchNumber = Math.ceil(completedMatch.matchNumber / 2);
  const slot = completedMatch.matchNumber % 2 === 1 ? 'home' : 'away';

  const nextMatch = await prisma.match.findUnique({
    where: {
      tournamentId_round_matchNumber: {
        tournamentId: completedMatch.tournamentId,
        round: nextRound,
        matchNumber: nextMatchNumber
      }
    }
  });

  if (nextMatch) {
    await prisma.match.update({
      where: { id: nextMatch.id },
      data: slot === 'home' ? { homeTeamId: winnerId } : { awayTeamId: winnerId }
    });
  }
}

/**
 * Check if tournament is complete and update status
 */
async function checkTournamentCompletion(tournamentId: string): Promise<void> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      matches: { select: { status: true } }
    }
  });

  if (!tournament || tournament.matches.length === 0) return;

  const allCompleted = tournament.matches.every(
    (m) => m.status === 'COMPLETED' || m.status === 'CANCELLED'
  );

  if (allCompleted && tournament.status !== 'FINISHED') {
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'FINISHED' }
    });
  }
}
