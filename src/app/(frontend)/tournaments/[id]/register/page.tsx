"use client"

import RegistrationForm from "@/components/RegistrationForm"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Tournament {
  id: string
  title: string
  game: string
  playersPerTeam: number
  maxTeams: number
  teamsCount: number
}

export default function TournamentRegister({ params }: { params: Promise<{ id: string }> }) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tournamentId, setTournamentId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => {
      setTournamentId(id)
    })
  }, [params])

  useEffect(() => {
    if (!tournamentId) return

    const fetchTournament = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/tournaments/${tournamentId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch tournament')
        }

        const data = await response.json()
        setTournament({
          id: data.id,
          title: data.title,
          game: data.game,
          playersPerTeam: data.playersPerTeam,
          maxTeams: data.maxTeams,
          teamsCount: data.teams?.length || 0,
        })
      } catch (err) {
        setError("Erreur lors du chargement du tournoi")
        console.error("Error fetching tournament:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTournament()
  }, [tournamentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
            <CardDescription>{error || "Tournoi introuvable"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Retour à l&apos;accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <RegistrationForm tournament={tournament} />
}
