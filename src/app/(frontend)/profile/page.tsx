"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, User, Mail, Shield, Trophy, LogOut, Loader2 } from "lucide-react"

interface Team {
  id: string
  teamName: string
  status: string
  registeredAt: string
  tournament: {
    id: string
    title: string
    game: string
    status: string
  }
}

interface ProfileData {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  teams: Team[]
}

export default function Profile() {
  const { status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile")
      return
    }

    if (status === "authenticated") {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch profile")
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

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

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

  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-500"
      case "CANCELLED":
        return "bg-red-500"
      default:
        return "bg-yellow-500"
    }
  }

  const getTeamStatusText = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmee"
      case "CANCELLED":
        return "Annulee"
      default:
        return "En attente"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {profile && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">Mon Profil</CardTitle>
                    <CardDescription>Gerez vos informations personnelles</CardDescription>
                  </div>
                  <Badge className={`${getRoleBadgeColor(profile.role)} text-white`}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleText(profile.role)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Nom</p>
                      <p className="font-medium">{profile.name || "Non renseigne"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500">
                      Membre depuis le {new Date(profile.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button variant="outline" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Se deconnecter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Mes inscriptions aux tournois
                </CardTitle>
                <CardDescription>
                  Historique de vos participations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.teams.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Vous n&apos;etes inscrit a aucun tournoi</p>
                    <Button asChild className="mt-4">
                      <Link href="/">Decouvrir les tournois</Link>
                    </Button>
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
                          <p className="text-xs text-gray-400">
                            Inscrit le {new Date(team.registeredAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getTeamStatusColor(team.status)} text-white`}>
                            {getTeamStatusText(team.status)}
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
