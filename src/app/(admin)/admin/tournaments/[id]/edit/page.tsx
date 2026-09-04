"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TournamentForm } from "@/components/admin/TournamentForm"
import { Button } from "@/components/ui/button"

interface Tournament {
  id: string
  title: string
  description: string | null
  game: string
  mode: string
  playersPerTeam: number
  maxTeams: number
  startDate: string
  endDate: string
  registrationDeadline: string
  status: string
  image: string | null
}

export default function EditTournamentPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTournament() {
      try {
        const res = await fetch(`/api/admin/tournaments/${params.id}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error("Tournoi non trouvé")
          throw new Error("Erreur lors du chargement")
        }
        const data = await res.json()
        setTournament(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue")
      } finally {
        setLoading(false)
      }
    }
    if (params.id) {
      fetchTournament()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton rounded" />
        <div className="space-y-4">
          <div className="h-64 skeleton rounded-lg" />
          <div className="h-48 skeleton rounded-lg" />
          <div className="h-48 skeleton rounded-lg" />
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error || "Tournoi non trouvé"}</p>
        <Button onClick={() => router.push("/admin/tournaments")} className="mt-4">
          Retour aux tournois
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Modifier: {tournament.title}</h1>
      <TournamentForm
        mode="edit"
        initialData={{
          id: tournament.id,
          title: tournament.title,
          description: tournament.description || "",
          game: tournament.game,
          mode: tournament.mode as "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "SWISS",
          playersPerTeam: tournament.playersPerTeam,
          maxTeams: tournament.maxTeams,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          registrationDeadline: tournament.registrationDeadline,
          status: tournament.status as "DRAFT" | "OPEN" | "CLOSED" | "ONGOING" | "FINISHED",
          image: tournament.image || "",
        }}
      />
    </div>
  )
}
