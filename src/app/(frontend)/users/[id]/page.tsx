"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, User, Shield, Trophy, Loader2 } from "lucide-react"

interface PublicTeam {
  id: string
  teamName: string
  tournament: {
    id: string
    title: string
    game: string
    status: string
  }
}

interface PublicProfile {
  id: string
  name: string | null
  role: string
  createdAt: string
  teams: PublicTeam[]
}

export default function PublicProfile() {
  const params = useParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError("Utilisateur non trouve")
          } else {
            throw new Error("Failed to fetch profile")
          }
          return
        }
        const data = await response.json()
        setProfile(data)
      } catch (err) {
        setError("Erreur lors du chargement du profil")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProfile()
    }
  }, [params.id])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500"
      case "ORGANIZER":
        return "bg-purple-500"
      default:
        return "bg-blue-500"
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur"
      case "ORGANIZER":
        return "Organisateur"
      default:
        return "Joueur"
    }
  }

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-500"
      case "ONGOING":
        return "bg-blue-500"
      case "FINISHED":
        return "bg-gray-500"
      default:
        return "bg-yellow-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Button variant="outline" asChild className="mb-6">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour a l&apos;accueil
            </Link>
          </Button>
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">{error}</h2>
              <p className="text-gray-500">L&apos;utilisateur que vous recherchez n&apos;existe pas.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour a l&apos;accueil
            </Link>
          </Button>
        </div>

        {profile && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-gray-500" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {profile.name || "Joueur anonyme"}
                      </CardTitle>
                      <CardDescription>
                        Membre depuis le {new Date(profile.createdAt).toLocaleDateString("fr-FR")}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`${getRoleBadgeColor(profile.role)} text-white`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleText(profile.role)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Participations aux tournois
                </CardTitle>
                <CardDescription>
                  {profile.teams.length} participation{profile.teams.length > 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.teams.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucune participation a un tournoi</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{team.teamName}</p>
                          <p className="text-sm text-gray-600">
                            {team.tournament.title} - {team.tournament.game}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getTournamentStatusColor(team.tournament.status)} text-white`}>
                            {team.tournament.status}
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/tournaments/${team.tournament.id}`}>
                              Voir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
