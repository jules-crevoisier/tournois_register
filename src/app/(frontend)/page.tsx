"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Trophy, Users, Gamepad2, ArrowRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TournamentCard, type TournamentCardProps } from "@/components/esport/TournamentCard"
import { Countdown } from "@/components/esport/Countdown"

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

function TournamentSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="h-36 sm:h-40 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="space-y-2 pt-2">
          <div className="h-4 w-1/2 skeleton rounded" />
          <div className="h-4 w-1/3 skeleton rounded" />
        </div>
        <div className="h-10 w-full skeleton rounded mt-4" />
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, value, label }: { icon: React.ElementType; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center p-4 sm:p-6 rounded-lg bg-card border border-border">
      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2" />
      <span className="text-2xl sm:text-3xl font-bold text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/tournaments")

        if (!response.ok) {
          throw new Error("Failed to fetch tournaments")
        }

        const data = await response.json()

        const transformedData: Tournament[] = data.map(
          (tournament: {
            id: string
            title: string
            description: string | null
            game: string
            playersPerTeam: number
            maxTeams: number
            startDate: string
            endDate: string
            registrationDeadline: string
            status: string
            image: string | null
            teams?: unknown[]
          }) => ({
            id: tournament.id,
            title: tournament.title,
            description: tournament.description || "",
            game: tournament.game,
            playersPerTeam: tournament.playersPerTeam,
            maxTeams: tournament.maxTeams,
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            registrationDeadline: tournament.registrationDeadline,
            status: tournament.status.toLowerCase(),
            image: tournament.image,
            teamsCount: tournament.teams?.length || 0,
          })
        )

        setTournaments(transformedData)
      } catch (err) {
        setError("Erreur lors du chargement des tournois")
        console.error("Error fetching tournaments:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  const featuredTournaments = tournaments.filter((t) => t.status === "open").slice(0, 3)
  const nextTournament = featuredTournaments[0]
  const totalPlayers = tournaments.reduce((acc, t) => acc + t.teamsCount * t.playersPerTeam, 0)

  return (
    <div className="overflow-safe">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=2070&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background" />

        {/* Content */}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            Rejoignez la
            <span className="text-primary"> compétition</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8">
            Inscrivez-vous aux meilleurs tournois esport. Affrontez les meilleurs joueurs et prouvez votre valeur.
          </p>

          {/* Countdown to next tournament */}
          {nextTournament && (
            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-3">
                Prochain tournoi: <span className="text-foreground font-medium">{nextTournament.title}</span>
              </p>
              <div className="flex justify-center">
                <Countdown targetDate={nextTournament.startDate} />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button size="lg" className="min-h-[48px] text-base" asChild>
              <Link href="/tournaments">
                Voir les tournois
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="min-h-[48px] text-base" asChild>
              <Link href="/register">Créer un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <StatCard icon={Trophy} value={String(tournaments.length)} label="Tournois" />
            <StatCard icon={Users} value={String(totalPlayers)} label="Joueurs inscrits" />
            <StatCard
              icon={Gamepad2}
              value={String(new Set(tournaments.map((t) => t.game)).size)}
              label="Jeux"
            />
            <StatCard
              icon={Calendar}
              value={String(tournaments.filter((t) => t.status === "open").length)}
              label="En cours"
            />
          </div>
        </div>
      </section>

      {/* Featured Tournaments */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Tournois en vedette</h2>
              <p className="text-muted-foreground mt-1">Inscriptions ouvertes maintenant</p>
            </div>
            <Button variant="outline" asChild className="self-start sm:self-auto">
              <Link href="/tournaments">
                Voir tous les tournois
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <TournamentSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Tournaments Grid */}
          {!loading && !error && featuredTournaments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {featuredTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  id={tournament.id}
                  title={tournament.title}
                  description={tournament.description}
                  game={tournament.game}
                  playersPerTeam={tournament.playersPerTeam}
                  maxTeams={tournament.maxTeams}
                  teamsCount={tournament.teamsCount}
                  startDate={tournament.startDate}
                  registrationDeadline={tournament.registrationDeadline}
                  status={tournament.status as TournamentCardProps["status"]}
                  image={tournament.image}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && featuredTournaments.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Gamepad2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Aucun tournoi disponible</h3>
              <p className="text-muted-foreground">Revenez plus tard pour découvrir de nouveaux tournois</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-primary/5 border-y border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Prêt à compétitionner?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-6 sm:mb-8">
            Créez votre compte gratuitement et rejoignez la communauté des compétiteurs.
          </p>
          <Button size="lg" className="min-h-[48px] text-base" asChild>
            <Link href="/register">
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
