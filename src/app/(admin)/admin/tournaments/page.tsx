"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Tournament {
  id: string
  title: string
  game: string
  mode: string
  status: string
  playersPerTeam: number
  maxTeams: number
  teamsCount: number
  startDate: string
  registrationDeadline: string
  createdAt: string
  image: string | null
}

const statusLabels: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Ouvert",
  CLOSED: "Fermé",
  ONGOING: "En cours",
  FINISHED: "Terminé",
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  OPEN: "default",
  CLOSED: "outline",
  ONGOING: "default",
  FINISHED: "outline",
}

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    tournament: Tournament | null
  }>({ open: false, tournament: null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTournaments()
  }, [statusFilter])

  async function fetchTournaments() {
    try {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter)
      }
      const res = await fetch(`/api/admin/tournaments?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setTournaments(data)
    } catch {
      toast.error("Impossible de charger les tournois")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteDialog.tournament) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/tournaments/${deleteDialog.tournament.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Tournoi supprimé")
      setTournaments((prev) =>
        prev.filter((t) => t.id !== deleteDialog.tournament!.id)
      )
      setDeleteDialog({ open: false, tournament: null })
    } catch {
      toast.error("Impossible de supprimer le tournoi")
    } finally {
      setDeleting(false)
    }
  }

  const filteredTournaments = tournaments.filter((t) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      t.title.toLowerCase().includes(searchLower) ||
      t.game.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Tournois</h1>
        <Link href="/admin/tournaments/new">
          <Button className="min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau tournoi
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 min-h-[44px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 min-h-[44px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="DRAFT">Brouillon</SelectItem>
            <SelectItem value="OPEN">Ouvert</SelectItem>
            <SelectItem value="CLOSED">Fermé</SelectItem>
            <SelectItem value="ONGOING">En cours</SelectItem>
            <SelectItem value="FINISHED">Terminé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 skeleton rounded" />
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">Aucun tournoi trouvé</p>
          <Link href="/admin/tournaments/new">
            <Button className="mt-4">Créer un tournoi</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Mobile view */}
          <div className="sm:hidden divide-y">
            {filteredTournaments.map((tournament) => (
              <div key={tournament.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{tournament.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tournament.game}
                    </p>
                  </div>
                  <Badge variant={statusVariants[tournament.status]}>
                    {statusLabels[tournament.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {tournament.teamsCount}/{tournament.maxTeams}
                  </span>
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/tournaments/${tournament.id}/edit`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full min-h-[40px]">
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </Link>
                  <Link
                    href={`/admin/tournaments/${tournament.id}/registrations`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full min-h-[40px]">
                      <Users className="h-4 w-4 mr-1" />
                      Équipes
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[40px] min-w-[40px] p-0"
                    onClick={() =>
                      setDeleteDialog({ open: true, tournament })
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <Table className="hidden sm:table">
            <TableHeader>
              <TableRow>
                <TableHead>Tournoi</TableHead>
                <TableHead>Jeu</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Équipes</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTournaments.map((tournament) => (
                <TableRow key={tournament.id} className="table-row-interactive">
                  <TableCell className="font-medium">
                    {tournament.title}
                  </TableCell>
                  <TableCell>{tournament.game}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[tournament.status]}>
                      {statusLabels[tournament.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tournament.teamsCount}/{tournament.maxTeams}
                  </TableCell>
                  <TableCell>
                    {new Date(tournament.startDate).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/tournaments/${tournament.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/tournaments/${tournament.id}/registrations`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Users className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setDeleteDialog({ open: true, tournament })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, tournament: deleteDialog.tournament })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le tournoi</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer &quot;{deleteDialog.tournament?.title}&quot; ?
              Cette action est irréversible et supprimera également toutes les
              inscriptions associées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteDialog({ open: false, tournament: null })
              }
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
