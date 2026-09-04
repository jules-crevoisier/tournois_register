"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

interface Player {
  playerName: string
  gameUsername: string
  discordUsername?: string
}

interface Team {
  id: string
  teamName: string
  players: Player[]
  registeredAt: string
  status: string
  captain: {
    id: string
    name: string | null
    email: string
  }
}

interface Tournament {
  id: string
  title: string
  playersPerTeam: number
  maxTeams: number
  teamsCount: number
  status: string
}

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CONFIRMED: "default",
  CANCELLED: "destructive",
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  CANCELLED: XCircle,
}

export default function RegistrationsPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [tournamentRes, teamsRes] = await Promise.all([
          fetch(`/api/admin/tournaments/${params.id}`),
          fetch(`/api/admin/tournaments/${params.id}/teams`),
        ])

        if (!tournamentRes.ok) {
          throw new Error("Tournoi non trouvé")
        }

        const tournamentData = await tournamentRes.json()
        const teamsData = await teamsRes.json()

        setTournament(tournamentData)
        setTeams(teamsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchData()
    }
  }, [params.id])

  async function handleStatusChange(teamId: string, newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/tournaments/${params.id}/teams`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, status: newStatus }),
      })

      if (!res.ok) throw new Error("Erreur lors de la mise à jour")

      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, status: newStatus } : t))
      )

      toast.success(
        newStatus === "CONFIRMED"
          ? "Équipe confirmée"
          : newStatus === "CANCELLED"
          ? "Inscription annulée"
          : "Statut mis à jour"
      )
    } catch {
      toast.error("Impossible de mettre à jour le statut")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 skeleton rounded-lg" />
          ))}
        </div>
        <div className="h-96 skeleton rounded-lg" />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error || "Tournoi non trouvé"}</p>
        <Button
          onClick={() => router.push("/admin/tournaments")}
          className="mt-4"
        >
          Retour aux tournois
        </Button>
      </div>
    )
  }

  const pendingCount = teams.filter((t) => t.status === "PENDING").length
  const confirmedCount = teams.filter((t) => t.status === "CONFIRMED").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/tournaments">
          <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Inscriptions</h1>
          <p className="text-muted-foreground">{tournament.title}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Capacité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {confirmedCount} / {tournament.maxTeams}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams list */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune inscription pour le moment</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Équipes inscrites ({teams.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile view */}
            <div className="sm:hidden divide-y">
              {teams.map((team) => {
                const StatusIcon = statusIcons[team.status]
                return (
                  <div key={team.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{team.teamName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {team.captain.name || team.captain.email}
                        </p>
                      </div>
                      <Badge variant={statusVariants[team.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusLabels[team.status]}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(team.players) ? team.players.length : 0} joueurs •{" "}
                      {new Date(team.registeredAt).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-h-[40px]"
                        onClick={() => setSelectedTeam(team)}
                      >
                        Voir détails
                      </Button>
                      {team.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 min-h-[40px]"
                            disabled={updating}
                            onClick={() =>
                              handleStatusChange(team.id, "CONFIRMED")
                            }
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="min-h-[40px] min-w-[40px] p-0"
                            disabled={updating}
                            onClick={() =>
                              handleStatusChange(team.id, "CANCELLED")
                            }
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <Table className="hidden sm:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Équipe</TableHead>
                  <TableHead>Capitaine</TableHead>
                  <TableHead>Joueurs</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => {
                  const StatusIcon = statusIcons[team.status]
                  return (
                    <TableRow key={team.id} className="table-row-interactive">
                      <TableCell className="font-medium">
                        {team.teamName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{team.captain.name || team.captain.email}</span>
                          <a
                            href={`mailto:${team.captain.email}`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(team.players) ? team.players.length : 0}
                      </TableCell>
                      <TableCell>
                        {new Date(team.registeredAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[team.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[team.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTeam(team)}
                          >
                            Détails
                          </Button>
                          {team.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                disabled={updating}
                                onClick={() =>
                                  handleStatusChange(team.id, "CONFIRMED")
                                }
                              >
                                Confirmer
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={updating}
                                onClick={() =>
                                  handleStatusChange(team.id, "CANCELLED")
                                }
                              >
                                Refuser
                              </Button>
                            </>
                          )}
                          {team.status === "CONFIRMED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updating}
                              onClick={() =>
                                handleStatusChange(team.id, "CANCELLED")
                              }
                            >
                              Annuler
                            </Button>
                          )}
                          {team.status === "CANCELLED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updating}
                              onClick={() =>
                                handleStatusChange(team.id, "PENDING")
                              }
                            >
                              Réactiver
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Team details dialog */}
      <Dialog
        open={!!selectedTeam}
        onOpenChange={(open) => !open && setSelectedTeam(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTeam?.teamName}</DialogTitle>
            <DialogDescription>
              Inscrit le{" "}
              {selectedTeam &&
                new Date(selectedTeam.registeredAt).toLocaleString("fr-FR")}
            </DialogDescription>
          </DialogHeader>

          {selectedTeam && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Capitaine</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">
                    {selectedTeam.captain.name || "Non renseigné"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTeam.captain.email}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">
                  Joueurs (
                  {Array.isArray(selectedTeam.players)
                    ? selectedTeam.players.length
                    : 0}
                  )
                </h4>
                <div className="space-y-2">
                  {Array.isArray(selectedTeam.players) &&
                    selectedTeam.players.map((player, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-muted/50 space-y-1"
                      >
                        <p className="font-medium">{player.playerName}</p>
                        <p className="text-sm text-muted-foreground">
                          In-game: {player.gameUsername}
                        </p>
                        {player.discordUsername && (
                          <p className="text-sm text-muted-foreground">
                            Discord: {player.discordUsername}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTeam(null)}>
              Fermer
            </Button>
            {selectedTeam && selectedTeam.status === "PENDING" && (
              <>
                <Button
                  variant="destructive"
                  disabled={updating}
                  onClick={() => {
                    handleStatusChange(selectedTeam.id, "CANCELLED")
                    setSelectedTeam(null)
                  }}
                >
                  Refuser
                </Button>
                <Button
                  disabled={updating}
                  onClick={() => {
                    handleStatusChange(selectedTeam.id, "CONFIRMED")
                    setSelectedTeam(null)
                  }}
                >
                  Confirmer
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
