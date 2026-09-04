import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TournamentStatus, TournamentMode } from "@prisma/client"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const searchParams = req.nextUrl.searchParams
  const status = searchParams.get("status") as TournamentStatus | null
  const search = searchParams.get("search")

  try {
    const whereClause: Record<string, unknown> = session.user.role === "ADMIN"
      ? {}
      : { createdById: session.user.id }

    if (status) {
      whereClause.status = status
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { game: { contains: search, mode: "insensitive" } },
      ]
    }

    const tournaments = await prisma.tournament.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { teams: true } },
        createdBy: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(
      tournaments.map((t) => ({
        id: t.id,
        title: t.title,
        game: t.game,
        mode: t.mode,
        status: t.status,
        playersPerTeam: t.playersPerTeam,
        maxTeams: t.maxTeams,
        teamsCount: t._count.teams,
        startDate: t.startDate.toISOString(),
        registrationDeadline: t.registrationDeadline.toISOString(),
        createdAt: t.createdAt.toISOString(),
        createdBy: t.createdBy,
        image: t.image,
      }))
    )
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const {
      title,
      description,
      game,
      mode,
      playersPerTeam,
      maxTeams,
      startDate,
      endDate,
      registrationDeadline,
      status,
      image,
    } = body

    if (!title || !game || !playersPerTeam || !maxTeams || !startDate || !endDate || !registrationDeadline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.create({
      data: {
        title,
        description: description || null,
        game,
        mode: mode || TournamentMode.SINGLE_ELIMINATION,
        playersPerTeam: parseInt(playersPerTeam),
        maxTeams: parseInt(maxTeams),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        status: status || TournamentStatus.DRAFT,
        image: image || null,
        createdById: session.user.id,
      },
    })

    return NextResponse.json(tournament, { status: 201 })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    )
  }
}
