import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Calendar, Users, Gamepad2, Clock, ArrowLeft } from "lucide-react"

// Mock data - will be replaced with actual API calls
const tournament = {
  id: "1",
  title: "League of Legends Championship",
  description: "Join the ultimate League of Legends tournament! Compete against the best teams and prove your skills in this epic championship.",
  game: "League of Legends",
  playersPerTeam: 5,
  maxTeams: 16,
  startDate: "2024-12-15T10:00:00Z",
  endDate: "2024-12-15T18:00:00Z",
  registrationDeadline: "2024-12-10T23:59:59Z",
  status: "open",
  image: null,
  teams: [
    {
      id: "1",
      teamName: "Team Alpha",
      captain: "John Doe",
      players: [
        { playerName: "John Doe", gameUsername: "AlphaLeader", discordUsername: "john#1234" },
        { playerName: "Jane Smith", gameUsername: "AlphaSupport", discordUsername: "jane#5678" },
        { playerName: "Bob Johnson", gameUsername: "AlphaADC", discordUsername: "bob#9012" },
        { playerName: "Alice Brown", gameUsername: "AlphaJungle", discordUsername: "alice#3456" },
        { playerName: "Charlie Wilson", gameUsername: "AlphaTop", discordUsername: "charlie#7890" },
      ],
      registeredAt: "2024-11-01T10:00:00Z",
      status: "confirmed"
    },
    {
      id: "2",
      teamName: "Team Beta",
      captain: "Mike Davis",
      players: [
        { playerName: "Mike Davis", gameUsername: "BetaLeader", discordUsername: "mike#1111" },
        { playerName: "Sarah Lee", gameUsername: "BetaSupport", discordUsername: "sarah#2222" },
        { playerName: "Tom Wilson", gameUsername: "BetaADC", discordUsername: "tom#3333" },
        { playerName: "Lisa Garcia", gameUsername: "BetaJungle", discordUsername: "lisa#4444" },
        { playerName: "David Kim", gameUsername: "BetaTop", discordUsername: "david#5555" },
      ],
      registeredAt: "2024-11-02T14:30:00Z",
      status: "confirmed"
    },
  ]
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

const getTeamStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-500"
    case "pending":
      return "bg-yellow-500"
    case "cancelled":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const getTeamStatusText = (status: string) => {
  switch (status) {
    case "confirmed":
      return "Confirmée"
    case "pending":
      return "En attente"
    case "cancelled":
      return "Annulée"
    default:
      return status
  }
}

export default function TournamentDetail({ params: { id } }: { params: { id: string } }) {
  const canRegister = tournament.status === "open" && tournament.teams.length < tournament.maxTeams
  const registrationDeadline = new Date(tournament.registrationDeadline)
  const isRegistrationOpen = registrationDeadline > new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="outline" asChild className="mr-4">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tournament.title}</h1>
              <p className="text-gray-600">{tournament.game}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tournament Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{tournament.title}</CardTitle>
                    <CardDescription className="mt-2">{tournament.description}</CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(tournament.status)} text-white`}>
                    {getStatusText(tournament.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Jeu:</span>
                    <span>{tournament.game}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Joueurs par équipe:</span>
                    <span>
                      {tournament.playersPerTeam === 1 
                        ? "Solo" 
                        : `${tournament.playersPerTeam} joueurs`
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Début:</span>
                    <span>{new Date(tournament.startDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">Fin des inscriptions:</span>
                    <span>{new Date(tournament.registrationDeadline).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teams List */}
            <Card>
              <CardHeader>
                <CardTitle>Équipes inscrites ({tournament.teams.length}/{tournament.maxTeams})</CardTitle>
              </CardHeader>
              <CardContent>
                {tournament.teams.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Équipe</TableHead>
                        <TableHead>Capitaine</TableHead>
                        <TableHead>Joueurs</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date d&apos;inscription</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tournament.teams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.teamName}</TableCell>
                          <TableCell>{team.captain}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {team.players.map((player, index) => (
                                <div key={index} className="text-sm text-gray-600">
                                  <span className="font-medium">{player.playerName}</span>
                                  <br />
                                  <span className="text-xs">
                                    {player.gameUsername} • {player.discordUsername}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getTeamStatusColor(team.status)} text-white`}>
                              {getTeamStatusText(team.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(team.registeredAt).toLocaleDateString('fr-FR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune équipe inscrite pour le moment</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Registration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p><strong>Capacité:</strong> {tournament.teams.length}/{tournament.maxTeams} équipes</p>
                    <p><strong>Joueurs par équipe:</strong> {tournament.playersPerTeam}</p>
                    <p><strong>Fin des inscriptions:</strong> {new Date(tournament.registrationDeadline).toLocaleDateString('fr-FR')}</p>
                  </div>
                  
                  {canRegister && isRegistrationOpen ? (
                    <Button asChild className="w-full">
                      <Link href={`/tournaments/${tournament.id}/register`}>
                        S&apos;inscrire au tournoi
                      </Link>
                    </Button>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-500 mb-2">
                        {!isRegistrationOpen 
                          ? "Les inscriptions sont fermées"
                          : tournament.teams.length >= tournament.maxTeams
                          ? "Tournoi complet"
                          : "Inscriptions fermées"
                        }
                      </p>
                      <Button disabled className="w-full">
                        Inscription non disponible
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
