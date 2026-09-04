import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        teams: {
          select: {
            id: true,
            teamName: true,
            status: true,
            registeredAt: true,
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
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Erreur lors de la recuperation du profil" },
      { status: 500 }
    )
  }
}
