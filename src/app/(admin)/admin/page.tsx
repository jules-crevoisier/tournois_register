"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Trophy,
  Users,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Stats {
  totalTournaments: number
  activeTournaments: number
  totalTeams: number
  pendingTeams: number
  recentRegistrations: {
    id: string
    teamName: string
    registeredAt: string
    status: string
    tournament: { id: string; title: string }
    captain: { name: string | null; email: string }
  }[]
  tournamentsByStatus: {
    draft: number
    open: number
    closed: number
    ongoing: number
    finished: number
  }
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats")
        if (!res.ok) throw new Error("Failed to fetch stats")
        const data = await res.json()
        setStats(data)
      } catch {
        setError("Impossible de charger les statistiques")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="h-8 w-48 skeleton rounded" />
          <div className="h-10 w-40 skeleton rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error || "Erreur inconnue"}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/tournaments/new">
          <Button className="min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau tournoi
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total tournois
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTournaments}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeTournaments} actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Équipes inscrites
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingTeams} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inscriptions ouvertes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.tournamentsByStatus.open}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.tournamentsByStatus.draft} brouillons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En cours
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.tournamentsByStatus.ongoing}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.tournamentsByStatus.finished} terminés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent registrations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inscriptions récentes</CardTitle>
          <Link href="/admin/tournaments">
            <Button variant="ghost" size="sm">
              Voir tout
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {stats.recentRegistrations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucune inscription récente
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reg.teamName}</span>
                      <Badge variant={statusVariants[reg.status]}>
                        {statusLabels[reg.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {reg.tournament.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{reg.captain.name || reg.captain.email}</span>
                    <span>
                      {new Date(reg.registeredAt).toLocaleDateString("fr-FR")}
                    </span>
                    <Link href={`/admin/tournaments/${reg.tournament.id}/registrations`}>
                      <Button variant="outline" size="sm" className="min-h-[36px]">
                        Gérer
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:border-primary/60 transition-colors cursor-pointer">
          <Link href="/admin/tournaments">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Gérer les tournois
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Voir, créer et modifier vos tournois
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/60 transition-colors cursor-pointer">
          <Link href="/admin/tournaments/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer un tournoi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Lancer un nouveau tournoi
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:border-primary/60 transition-colors cursor-pointer">
          <Link href="/">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Voir le site
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Accéder à la vue publique
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
