"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Player {
  playerName: string
  gameUsername: string
  discordUsername: string
}

interface Tournament {
  id: string
  title: string
  game: string
  playersPerTeam: number
  maxTeams: number
  teamsCount: number
}

interface RegistrationFormProps {
  tournament: Tournament
}

export default function RegistrationForm({ tournament }: RegistrationFormProps) {
  const [teamName, setTeamName] = useState("")
  const [players, setPlayers] = useState<Player[]>(() => 
    Array(tournament.playersPerTeam).fill(null).map(() => ({
      playerName: "",
      gameUsername: "",
      discordUsername: ""
    }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePlayerChange = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setPlayers(newPlayers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          teamName,
          players
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to register team')
      }

      const data = await response.json()
      console.log("Team registered successfully:", data)

      // Redirect to tournament details page
      window.location.href = `/tournaments/${tournament.id}`
    } catch (error) {
      console.error("Error submitting registration:", error)
      alert(error instanceof Error ? error.message : "Erreur lors de l'inscription. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = teamName.trim() && players.every(player => 
    player.playerName.trim() && 
    player.gameUsername.trim() && 
    player.discordUsername.trim()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button variant="outline" asChild className="mr-4">
              <Link href={`/tournaments/${tournament.id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au tournoi
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inscription au tournoi</h1>
              <p className="text-gray-600">{tournament.title}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Inscription d&apos;équipe</CardTitle>
            <CardDescription>
              Remplissez les informations de votre équipe pour participer au tournoi {tournament.game}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName">Nom de l&apos;équipe</Label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Nom de votre équipe"
                  required
                />
              </div>

              {/* Tournament Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Informations du tournoi</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Jeu:</span> {tournament.game}
                  </div>
                  <div>
                    <span className="font-medium">Joueurs par équipe:</span> {tournament.playersPerTeam}
                  </div>
                  <div>
                    <span className="font-medium">Équipes inscrites:</span> {tournament.teamsCount}/{tournament.maxTeams}
                  </div>
                </div>
              </div>

              {/* Players */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Joueurs ({tournament.playersPerTeam} requis)
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Remplissez les informations pour chaque joueur de votre équipe
                  </p>
                </div>

                <div className="space-y-6">
                  {players.map((player, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Joueur {index + 1}
                          {index === 0 && <span className="text-sm font-normal text-gray-500 ml-2">(Capitaine)</span>}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`playerName-${index}`}>Nom complet</Label>
                            <Input
                              id={`playerName-${index}`}
                              value={player.playerName}
                              onChange={(e) => handlePlayerChange(index, 'playerName', e.target.value)}
                              placeholder="Nom et prénom"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`gameUsername-${index}`}>Pseudo en jeu</Label>
                            <Input
                              id={`gameUsername-${index}`}
                              value={player.gameUsername}
                              onChange={(e) => handlePlayerChange(index, 'gameUsername', e.target.value)}
                              placeholder="Pseudo dans le jeu"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`discordUsername-${index}`}>Pseudo Discord</Label>
                            <Input
                              id={`discordUsername-${index}`}
                              value={player.discordUsername}
                              onChange={(e) => handlePlayerChange(index, 'discordUsername', e.target.value)}
                              placeholder="Pseudo#1234"
                              required
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline" asChild>
                  <Link href={`/tournaments/${tournament.id}`}>
                    Annuler
                  </Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={!isFormValid || isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? "Inscription..." : "S&apos;inscrire"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
