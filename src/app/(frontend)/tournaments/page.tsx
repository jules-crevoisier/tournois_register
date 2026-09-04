"use client"

import { useEffect, useState, useMemo } from "react"
import { Search, Filter, X, Gamepad2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TournamentCard, type TournamentCardProps } from "@/components/esport/TournamentCard"
import { StatusBadge } from "@/components/esport/GamingBadge"

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

type StatusFilter = "all" | "open" | "closed" | "ongoing" | "finished"
type SortOption = "date-asc" | "date-desc" | "popularity"

const statusLabels: Record<StatusFilter, string> = {
  all: "Tous les statuts",
  open: "Inscriptions ouvertes",
  closed: "Fermé",
  ongoing: "En cours",
  finished: "Terminé",
}

const sortLabels: Record<SortOption, string> = {
  "date-asc": "Date (croissant)",
  "date-desc": "Date (décroissant)",
  popularity: "Popularité",
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

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [gameFilter, setGameFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortOption, setSortOption] = useState<SortOption>("date-desc")
  const [showFilters, setShowFilters] = useState(false)

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

  // Get unique games for filter
  const games = useMemo(() => {
    const uniqueGames = new Set(tournaments.map((t) => t.game))
    return Array.from(uniqueGames).sort()
  }, [tournaments])

  // Filter and sort tournaments
  const filteredTournaments = useMemo(() => {
    let result = [...tournaments]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.game.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      )
    }

    // Game filter
    if (gameFilter !== "all") {
      result = result.filter((t) => t.game === gameFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter)
    }

    // Sort
    switch (sortOption) {
      case "date-asc":
        result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        break
      case "date-desc":
        result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        break
      case "popularity":
        result.sort((a, b) => b.teamsCount - a.teamsCount)
        break
    }

    return result
  }, [tournaments, searchQuery, gameFilter, statusFilter, sortOption])

  const hasActiveFilters = searchQuery || gameFilter !== "all" || statusFilter !== "all"

  const clearFilters = () => {
    setSearchQuery("")
    setGameFilter("all")
    setStatusFilter("all")
  }

  return (
    <div className="overflow-safe">
      {/* Page Header */}
      <section className="bg-muted/30 border-b border-border py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Tous les tournois</h1>
          <p className="text-muted-foreground">
            {loading
              ? "Chargement..."
              : `${filteredTournaments.length} tournoi${filteredTournaments.length !== 1 ? "s" : ""} disponible${filteredTournaments.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile filter toggle */}
          <div className="flex gap-3 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 min-h-[44px]"
              />
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop filters / Mobile expanded filters */}
          <div className={`${showFilters ? "mt-4" : "hidden"} md:flex md:mt-0 md:items-center md:gap-4`}>
            {/* Search - Desktop */}
            <div className="relative hidden md:block md:w-64 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un tournoi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 md:flex md:flex-1 md:items-center md:justify-end md:gap-3">
              {/* Game Filter */}
              <Select value={gameFilter} onValueChange={setGameFilter}>
                <SelectTrigger className="min-h-[44px] md:w-40">
                  <SelectValue placeholder="Jeu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les jeux</SelectItem>
                  {games.map((game) => (
                    <SelectItem key={game} value={game}>
                      {game}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="min-h-[44px] md:w-44">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="min-h-[44px] md:w-44">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="col-span-2 min-h-[44px] md:col-span-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              )}
            </div>
          </div>

          {/* Active filters pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchQuery && (
                <StatusBadge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery("")}>
                  Recherche: {searchQuery}
                  <X className="h-3 w-3 ml-1" />
                </StatusBadge>
              )}
              {gameFilter !== "all" && (
                <StatusBadge variant="outline" className="cursor-pointer" onClick={() => setGameFilter("all")}>
                  {gameFilter}
                  <X className="h-3 w-3 ml-1" />
                </StatusBadge>
              )}
              {statusFilter !== "all" && (
                <StatusBadge
                  variant={statusFilter}
                  className="cursor-pointer"
                  onClick={() => setStatusFilter("all")}
                >
                  {statusLabels[statusFilter]}
                  <X className="h-3 w-3 ml-1" />
                </StatusBadge>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tournament Grid */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
              {[...Array(6)].map((_, i) => (
                <TournamentSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Tournaments Grid */}
          {!loading && !error && filteredTournaments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredTournaments.map((tournament) => (
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
          {!loading && !error && filteredTournaments.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Gamepad2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              {hasActiveFilters ? (
                <>
                  <h3 className="text-lg font-medium text-foreground mb-2">Aucun résultat</h3>
                  <p className="text-muted-foreground mb-4">
                    Aucun tournoi ne correspond à vos critères de recherche
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Effacer les filtres
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-foreground mb-2">Aucun tournoi disponible</h3>
                  <p className="text-muted-foreground">Revenez plus tard pour découvrir de nouveaux tournois</p>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
