"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Calendar, Users, Gamepad2 } from "lucide-react"
import { useEffect, useState } from "react"
import TournamentCardSkeleton from "@/components/TournamentCardSkeleton"

interface Tournament {
  id: string
  title: string
  description: string
  game: string
  playersPerTeam: number
  maxTeams: number
  startDate: string
  endDate: string
  registrationDeadline: string
  status: string
  image?: string | null
  teamsCount: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-green-500"
    case "closed":
      return "bg-red-500"
    case "ongoing":
      return "bg-blue-500"
    case "finished":
      return "bg-gray-500"
    case "draft":
      return "bg-yellow-500"
    default:
      return "bg-gray-500"
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case "open":
      return "Inscriptions ouvertes"
    case "closed":
      return "Inscriptions fermées"
    case "ongoing":
      return "En cours"
    case "finished":
      return "Terminé"
    case "draft":
      return "Brouillon"
    default:
      return status
  }
}

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // const response = await fetch('/api/tournaments')
        // const data = await response.json()
        
        // Mock data for now
        const mockData: Tournament[] = [
          {
            id: "1",
            title: "League of Legends Championship",
            description: "Join the ultimate League of Legends tournament!",
            game: "League of Legends",
            playersPerTeam: 5,
            maxTeams: 16,
            startDate: "2024-12-15T10:00:00Z",
            endDate: "2024-12-15T18:00:00Z",
            registrationDeadline: "2024-12-10T23:59:59Z",
            status: "open",
            image: null,
            teamsCount: 8,
          },
          {
            id: "2",
            title: "Valorant Masters",
            description: "Compete in the Valorant Masters tournament",
            game: "Valorant",
            playersPerTeam: 5,
            maxTeams: 8,
            startDate: "2024-12-20T14:00:00Z",
            endDate: "2024-12-20T22:00:00Z",
            registrationDeadline: "2024-12-15T23:59:59Z",
            status: "open",
            image: null,
            teamsCount: 3,
          },
          {
            id: "3",
            title: "CS2 Solo Tournament",
            description: "Individual CS2 tournament for solo players",
            game: "Counter-Strike 2",
            playersPerTeam: 1,
            maxTeams: 32,
            startDate: "2024-12-25T12:00:00Z",
            endDate: "2024-12-25T20:00:00Z",
            registrationDeadline: "2024-12-20T23:59:59Z",
            status: "draft",
            image: null,
            teamsCount: 0,
          },
        ]
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        setTournaments(mockData)
      } catch (err) {
        setError("Erreur lors du chargement des tournois")
        console.error("Error fetching tournaments:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tournois Gaming</h1>
              <p className="text-gray-600">Inscrivez-vous aux meilleurs tournois de jeux vidéo</p>
            </div>
            <nav className="flex gap-4" role="navigation" aria-label="Navigation principale">
              <Button variant="outline" asChild>
                <Link href="/login" aria-label="Se connecter à votre compte">Connexion</Link>
              </Button>
              <Button asChild>
                <Link href="/register" aria-label="Créer un nouveau compte">S&apos;inscrire</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournois disponibles</h2>
          <p className="text-gray-600">Découvrez et participez aux tournois de votre jeu préféré</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <TournamentCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Tournaments Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{tournament.title}</CardTitle>
                      <CardDescription className="mt-1">{tournament.description}</CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                      {getStatusText(tournament.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Gamepad2 className="h-4 w-4" />
                      <span>{tournament.game}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>
                        {tournament.playersPerTeam === 1 
                          ? "Solo" 
                          : `${tournament.playersPerTeam} joueurs par équipe`
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(tournament.startDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{tournament.teamsCount}</span> / {tournament.maxTeams} équipes
                    </div>
                    
                    <div className="pt-4">
                      <Button asChild className="w-full">
                        <Link href={`/tournaments/${tournament.id}`}>
                          Voir les détails
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && tournaments.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <Gamepad2 className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun tournoi disponible</h3>
            <p className="text-gray-500">Revenez plus tard pour découvrir de nouveaux tournois</p>
          </div>
        )}
      </main>
    </div>
  )
}