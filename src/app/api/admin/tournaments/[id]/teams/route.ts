import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TeamStatus } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id: tournamentId } = await params

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Check tournament access
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { admins: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    if (
      session.user.role === "ORGANIZER" &&
      tournament.createdById !== session.user.id
    ) {
      const hasAccess = tournament.admins.some(
        (a) => a.userId === session.user.id
      )
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const teams = await prisma.team.findMany({
      where: { tournamentId },
      orderBy: { registeredAt: "desc" },
      include: {
        captain: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(
      teams.map((t) => ({
        id: t.id,
        teamName: t.teamName,
        players: t.players,
        registeredAt: t.registeredAt.toISOString(),
        status: t.status,
        captain: t.captain,
      }))
    )
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id: tournamentId } = await params

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { teamId, status } = body

    if (!teamId || !status) {
      return NextResponse.json(
        { error: "Missing teamId or status" },
        { status: 400 }
      )
    }

    // Check tournament access
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        tournament: {
          include: { admins: true },
        },
      },
    })

    if (!team || team.tournamentId !== tournamentId) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    if (
      session.user.role === "ORGANIZER" &&
      team.tournament.createdById !== session.user.id
    ) {
      const hasAccess = team.tournament.admins.some(
        (a) =>
          a.userId === session.user.id &&
          (a.permission === "FULL_ACCESS" || a.permission === "MANAGE_TEAMS")
      )
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { status: status as TeamStatus },
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id: tournamentId } = await params

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { teamId } = body

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        tournament: {
          include: { admins: true },
        },
      },
    })

    if (!team || team.tournamentId !== tournamentId) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Only admin can delete teams
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can delete teams" }, { status: 403 })
    }

    await prisma.team.delete({ where: { id: teamId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    )
  }
}
