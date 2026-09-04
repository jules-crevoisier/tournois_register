import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Vous devez etre connecte pour inscrire une equipe' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tournamentId, teamName, players } = body

    // Validate required fields
    if (!tournamentId || !teamName || !players) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
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
        { error: 'Tournoi introuvable' },
        { status: 404 }
      )
    }

    if (tournament.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Les inscriptions ne sont pas ouvertes pour ce tournoi' },
        { status: 400 }
      )
    }

    if (tournament.teams.length >= tournament.maxTeams) {
      return NextResponse.json(
        { error: 'Le tournoi est complet' },
        { status: 400 }
      )
    }

    // Check if registration deadline has passed
    const now = new Date()
    if (now > tournament.registrationDeadline) {
      return NextResponse.json(
        { error: 'La date limite d\'inscription est passee' },
        { status: 400 }
      )
    }

    // Validate team size
    if (players.length !== tournament.playersPerTeam) {
      return NextResponse.json(
        { error: `L'equipe doit avoir exactement ${tournament.playersPerTeam} joueur(s)` },
        { status: 400 }
      )
    }

    // Validate player data
    for (const player of players) {
      if (!player.playerName || !player.gameUsername || !player.discordUsername) {
        return NextResponse.json(
          { error: 'Tous les champs joueur sont requis' },
          { status: 400 }
        )
      }
    }

    // Create the team with authenticated user as captain
    const team = await prisma.team.create({
      data: {
        teamName,
        players: players,
        tournamentId,
        captainId: session.user.id,
        status: 'PENDING',
      },
      include: {
        tournament: true,
        captain: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la creation de l\'equipe' },
      { status: 500 }
    )
  }
}
