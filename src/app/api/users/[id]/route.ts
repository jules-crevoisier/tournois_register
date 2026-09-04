import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        image: true,
        createdAt: true,
        teams: {
          where: {
            status: {
              not: "CANCELLED",
            },
          },
          select: {
            id: true,
            teamName: true,
            tournament: {
              select: {
                id: true,
                title: true,
                game: true,
                status: true,
              },
            },
          },
          orderBy: {
            registeredAt: "desc",
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recuperation de l'utilisateur" },
      { status: 500 }
    )
  }
}
