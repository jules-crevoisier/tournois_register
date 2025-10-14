import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tournamentId, teamName, players } = body

    // Validate required fields
    if (!tournamentId || !teamName || !players) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if tournament exists and is open for registration
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true },
    })

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    if (tournament.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Tournament is not open for registration' },
        { status: 400 }
      )
    }

    if (tournament.teams.length >= tournament.maxTeams) {
      return NextResponse.json(
        { error: 'Tournament is full' },
        { status: 400 }
      )
    }

    // Check if registration deadline has passed
    const now = new Date()
    if (now > tournament.registrationDeadline) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      )
    }

    // Validate team size
    if (players.length !== tournament.playersPerTeam) {
      return NextResponse.json(
        { error: `Team must have exactly ${tournament.playersPerTeam} players` },
        { status: 400 }
      )
    }

    // Validate player data
    for (const player of players) {
      if (!player.playerName || !player.gameUsername || !player.discordUsername) {
        return NextResponse.json(
          { error: 'All player fields are required' },
          { status: 400 }
        )
      }
    }

    // TODO: Get user from session/auth
    // For now, we'll use a mock user ID
    const mockUserId = 'mock-user-id'

    // Create the team
    const team = await prisma.team.create({
      data: {
        teamName,
        players: players,
        tournamentId,
        captainId: mockUserId,
        status: 'PENDING',
      },
      include: {
        tournament: true,
        captain: true,
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    )
  }
}
