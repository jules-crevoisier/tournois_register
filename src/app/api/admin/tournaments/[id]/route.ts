import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TournamentStatus, TournamentMode } from "@prisma/client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: { select: { teams: true, matches: true } },
        createdBy: { select: { name: true, email: true } },
        admins: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Check access for organizers
    if (
      session.user.role === "ORGANIZER" &&
      tournament.createdById !== session.user.id
    ) {
      const isAdmin = tournament.admins.some(
        (a) => a.userId === session.user.id
      )
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json({
      ...tournament,
      startDate: tournament.startDate.toISOString(),
      endDate: tournament.endDate.toISOString(),
      registrationDeadline: tournament.registrationDeadline.toISOString(),
      createdAt: tournament.createdAt.toISOString(),
      updatedAt: tournament.updatedAt.toISOString(),
      teamsCount: tournament._count.teams,
      matchesCount: tournament._count.matches,
    })
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Check tournament ownership for organizers
    const existing = await prisma.tournament.findUnique({
      where: { id },
      include: { admins: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    if (
      session.user.role === "ORGANIZER" &&
      existing.createdById !== session.user.id
    ) {
      const hasAccess = existing.admins.some(
        (a) =>
          a.userId === session.user.id &&
          (a.permission === "FULL_ACCESS" || a.permission === "MANAGE_TEAMS")
      )
      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const body = await req.json()
    const updateData: Record<string, unknown> = {}

    // Only update provided fields
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.game !== undefined) updateData.game = body.game
    if (body.mode !== undefined) updateData.mode = body.mode as TournamentMode
    if (body.playersPerTeam !== undefined) updateData.playersPerTeam = parseInt(body.playersPerTeam)
    if (body.maxTeams !== undefined) updateData.maxTeams = parseInt(body.maxTeams)
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
    if (body.registrationDeadline !== undefined) updateData.registrationDeadline = new Date(body.registrationDeadline)
    if (body.status !== undefined) updateData.status = body.status as TournamentStatus
    if (body.image !== undefined) updateData.image = body.image

    const tournament = await prisma.tournament.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only admin and tournament creator can delete
  if (session.user.role !== "ADMIN") {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    if (tournament.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  try {
    await prisma.tournament.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tournament:", error)
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    )
  }
}
