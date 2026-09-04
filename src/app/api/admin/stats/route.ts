import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Filter by user's created tournaments if ORGANIZER
    const whereClause =
      session.user.role === "ADMIN" ? {} : { createdById: session.user.id }

    const [
      totalTournaments,
      activeTournaments,
      totalTeams,
      pendingTeams,
      recentRegistrations,
      tournamentsByStatus,
    ] = await Promise.all([
      prisma.tournament.count({ where: whereClause }),
      prisma.tournament.count({
        where: { ...whereClause, status: { in: ["OPEN", "ONGOING"] } },
      }),
      prisma.team.count({
        where: { tournament: whereClause },
      }),
      prisma.team.count({
        where: { tournament: whereClause, status: "PENDING" },
      }),
      prisma.team.findMany({
        where: { tournament: whereClause },
        orderBy: { registeredAt: "desc" },
        take: 5,
        include: {
          tournament: { select: { title: true, id: true } },
          captain: { select: { name: true, email: true } },
        },
      }),
      prisma.tournament.groupBy({
        by: ["status"],
        where: whereClause,
        _count: true,
      }),
    ])

    const statusCounts = Object.fromEntries(
      tournamentsByStatus.map((s) => [s.status.toLowerCase(), s._count])
    )

    return NextResponse.json({
      totalTournaments,
      activeTournaments,
      totalTeams,
      pendingTeams,
      recentRegistrations: recentRegistrations.map((r) => ({
        id: r.id,
        teamName: r.teamName,
        registeredAt: r.registeredAt.toISOString(),
        status: r.status,
        tournament: r.tournament,
        captain: r.captain,
      })),
      tournamentsByStatus: {
        draft: statusCounts.draft || 0,
        open: statusCounts.open || 0,
        closed: statusCounts.closed || 0,
        ongoing: statusCounts.ongoing || 0,
        finished: statusCounts.finished || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
