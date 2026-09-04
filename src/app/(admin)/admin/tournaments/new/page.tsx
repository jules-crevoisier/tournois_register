import { TournamentForm } from "@/components/admin/TournamentForm"

export default function NewTournamentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Créer un tournoi</h1>
      <TournamentForm mode="create" />
    </div>
  )
}
