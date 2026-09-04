"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Users, Gamepad2, Clock, Trophy, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/esport/GamingBadge"
import { Countdown } from "@/components/esport/Countdown"

interface Player {
  playerName: string
  gameUsername: string
  discordUsername: string
}

interface Team {
  id: string
  teamName: string
  players: Player[]
  registeredAt: string
  status: string
  captain: {
    id: string
    email: string
  }
}

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
  image: string | null
  teams: Team[]
}

const statusLabels: Record<string, string> = {
  open: "Inscriptions ouvertes",
  closed: "Inscriptions fermées",
  ongoing: "En cours",
  finished: "Terminé",
  draft: "Brouillon",
}

const teamStatusLabels: Record<string, string> = {
  confirmed: "Confirmée",
  pending: "En attente",
  cancelled: "Annulée",
}

type Tab = "description" | "teams" | "rules"

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 min-h-[44px] ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      {children}
    </button>
  )
}

export default function TournamentDetail({ params }: { params: Promise<{ id: string }> }) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tournamentId, setTournamentId] = useState<string>("")
  const [activeTab, setActiveTab] = useState<Tab>("description")

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
          throw new Error("Failed to fetch tournament")
        }

        const data = await response.json()
        setTournament(data)
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "Tournoi introuvable"}</p>
            <Button asChild className="w-full min-h-[44px]">
              <Link href="/tournaments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux tournois
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = tournament.status.toLowerCase()
  const canRegister = status === "open" && tournament.teams.length < tournament.maxTeams
  const registrationDeadline = new Date(tournament.registrationDeadline)
  const isRegistrationOpen = registrationDeadline > new Date()
  const spotsLeft = tournament.maxTeams - tournament.teams.length
  const fillPercentage = Math.min((tournament.teams.length / tournament.maxTeams) * 100, 100)

  return (
    <div className="overflow-safe">
      {/* Hero Header */}
      <section className="relative min-h-[280px] sm:min-h-[320px] flex items-end overflow-hidden">
        {/* Background */}
        {tournament.image ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${tournament.image})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Content */}
        <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-4 -ml-2 text-foreground hover:bg-background/50"
          >
            <Link href="/tournaments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tournois
            </Link>
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge variant={status as "open" | "closed" | "ongoing" | "finished" | "draft"} size="lg">
                  {statusLabels[status] || status}
                </StatusBadge>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{tournament.title}</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                {tournament.game}
              </p>
            </div>

            {/* Countdown */}
            {status === "open" && isRegistrationOpen && (
              <div className="shrink-0">
                <p className="text-xs text-muted-foreground mb-2 text-center sm:text-right">Début du tournoi dans</p>
                <Countdown targetDate={tournament.startDate} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="border-b border-border flex gap-2 overflow-x-auto">
              <TabButton active={activeTab === "description"} onClick={() => setActiveTab("description")}>
                Description
              </TabButton>
              <TabButton active={activeTab === "teams"} onClick={() => setActiveTab("teams")}>
                Équipes ({tournament.teams.length})
              </TabButton>
              <TabButton active={activeTab === "rules"} onClick={() => setActiveTab("rules")}>
                Règles
              </TabButton>
            </div>

            {/* Tab Content */}
            {activeTab === "description" && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {tournament.description || "Aucune description disponible."}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Format</p>
                        <p className="font-medium">
                          {tournament.playersPerTeam === 1 ? "Solo" : `${tournament.playersPerTeam}v${tournament.playersPerTeam}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date de début</p>
                        <p className="font-medium">{new Date(tournament.startDate).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fin inscriptions</p>
                        <p className="font-medium">{new Date(tournament.registrationDeadline).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Équipes max</p>
                        <p className="font-medium">{tournament.maxTeams}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "teams" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Équipes inscrites</CardTitle>
                </CardHeader>
                <CardContent>
                  {tournament.teams.length > 0 ? (
                    <div className="overflow-x-auto -mx-6">
                      <div className="min-w-[600px] px-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Équipe</TableHead>
                              <TableHead>Joueurs</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Inscription</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tournament.teams.map((team) => (
                              <TableRow key={team.id} className="table-row-interactive">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">{team.teamName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {team.players.map((player, index) => (
                                      <div key={index} className="text-sm">
                                        <span className="text-foreground">{player.playerName}</span>
                                        <span className="text-muted-foreground ml-2">({player.gameUsername})</span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <StatusBadge
                                    variant={
                                      team.status.toLowerCase() === "confirmed"
                                        ? "open"
                                        : team.status.toLowerCase() === "pending"
                                        ? "draft"
                                        : "closed"
                                    }
                                  >
                                    {teamStatusLabels[team.status.toLowerCase()] || team.status}
                                  </StatusBadge>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {new Date(team.registeredAt).toLocaleDateString("fr-FR")}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Aucune équipe inscrite pour le moment</p>
                      {canRegister && isRegistrationOpen && (
                        <Button asChild className="mt-4 min-h-[44px]">
                          <Link href={`/tournaments/${tournament.id}/register`}>Être la première équipe</Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "rules" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Règles du tournoi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none text-muted-foreground">
                    <p>Les règles du tournoi seront communiquées aux participants inscrits.</p>
                    <ul className="mt-4 space-y-2">
                      <li>Respect des adversaires et de l&apos;organisation</li>
                      <li>Ponctualité pour les matchs</li>
                      <li>Utilisation d&apos;outils tiers interdite</li>
                      <li>Les décisions des arbitres sont finales</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Capacity */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Équipes inscrites</span>
                    <span className="font-medium">
                      {tournament.teams.length} / {tournament.maxTeams}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${
                        spotsLeft === 0
                          ? "progress-bar-fill-high"
                          : spotsLeft <= 3
                          ? "progress-bar-fill-medium"
                          : "progress-bar-fill-low"
                      }`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                  {spotsLeft > 0 && spotsLeft <= 5 && (
                    <p className="text-xs text-status-draft mt-2">
                      Plus que {spotsLeft} place{spotsLeft > 1 ? "s" : ""} disponible{spotsLeft > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joueurs par équipe</span>
                    <span>{tournament.playersPerTeam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin des inscriptions</span>
                    <span>{new Date(tournament.registrationDeadline).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>

                {/* CTA */}
                {canRegister && isRegistrationOpen ? (
                  <Button asChild className="w-full min-h-[48px] text-base">
                    <Link href={`/tournaments/${tournament.id}/register`}>S&apos;inscrire au tournoi</Link>
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      {!isRegistrationOpen
                        ? "Les inscriptions sont fermées"
                        : spotsLeft === 0
                        ? "Tournoi complet"
                        : "Inscriptions fermées"}
                    </p>
                    <Button disabled className="w-full min-h-[48px]">
                      Inscription non disponible
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Jeu</p>
                    <p className="font-medium">{tournament.game}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date du tournoi</p>
                    <p className="font-medium">
                      {new Date(tournament.startDate).toLocaleDateString("fr-FR")} -{" "}
                      {new Date(tournament.endDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Format</p>
                    <p className="font-medium">
                      {tournament.playersPerTeam === 1 ? "Solo" : `${tournament.playersPerTeam}v${tournament.playersPerTeam}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
