"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Users, Gamepad2, Trophy, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    Array(tournament.playersPerTeam)
      .fill(null)
      .map(() => ({
        playerName: "",
        gameUsername: "",
        discordUsername: "",
      }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handlePlayerChange = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setPlayers(newPlayers)
  }

  const isPlayerValid = (player: Player) =>
    player.playerName.trim() && player.gameUsername.trim() && player.discordUsername.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          teamName,
          players,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to register team")
      }

      window.location.href = `/tournaments/${tournament.id}`
    } catch (error) {
      console.error("Error submitting registration:", error)
      setSubmitError(error instanceof Error ? error.message : "Erreur lors de l'inscription. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = teamName.trim() && players.every(isPlayerValid)
  const completedPlayers = players.filter(isPlayerValid).length

  return (
    <div className="overflow-safe">
      {/* Page Header */}
      <section className="bg-muted/30 border-b border-border py-6 sm:py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
            <Link href={`/tournaments/${tournament.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tournoi
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inscription au tournoi</h1>
          <p className="text-muted-foreground mt-1">{tournament.title}</p>
        </div>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Team Name */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Nom de l&apos;équipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Choisissez un nom d&apos;équipe</Label>
                    <Input
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Ex: Les Champions"
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Joueurs ({completedPlayers}/{tournament.playersPerTeam})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {players.map((player, index) => {
                    const playerValid = isPlayerValid(player)
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border transition-colors ${
                          playerValid ? "border-status-open/50 bg-status-open/5" : "border-border bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Joueur {index + 1}
                              {index === 0 && (
                                <span className="text-sm font-normal text-muted-foreground ml-2">(Capitaine)</span>
                              )}
                            </span>
                          </div>
                          {playerValid && <CheckCircle2 className="h-5 w-5 text-status-open" />}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`playerName-${index}`}>Nom complet</Label>
                            <Input
                              id={`playerName-${index}`}
                              value={player.playerName}
                              onChange={(e) => handlePlayerChange(index, "playerName", e.target.value)}
                              placeholder="Jean Dupont"
                              required
                              className="min-h-[44px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`gameUsername-${index}`}>Pseudo en jeu</Label>
                            <Input
                              id={`gameUsername-${index}`}
                              value={player.gameUsername}
                              onChange={(e) => handlePlayerChange(index, "gameUsername", e.target.value)}
                              placeholder="ProGamer123"
                              required
                              className="min-h-[44px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`discordUsername-${index}`}>Discord</Label>
                            <Input
                              id={`discordUsername-${index}`}
                              value={player.discordUsername}
                              onChange={(e) => handlePlayerChange(index, "discordUsername", e.target.value)}
                              placeholder="pseudo#1234"
                              required
                              className="min-h-[44px]"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Error Message */}
              {submitError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                  <p className="text-destructive text-sm">{submitError}</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="flex-1 min-h-[48px] text-base order-1 sm:order-2"
                >
                  {isSubmitting ? "Inscription en cours..." : "Confirmer l'inscription"}
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="min-h-[48px] order-2 sm:order-1"
                >
                  <Link href={`/tournaments/${tournament.id}`}>Annuler</Link>
                </Button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="order-first lg:order-last">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Jeu</p>
                    <p className="font-medium">{tournament.game}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Joueurs par équipe</p>
                    <p className="font-medium">{tournament.playersPerTeam}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Places disponibles</p>
                    <p className="font-medium">
                      {tournament.maxTeams - tournament.teamsCount} / {tournament.maxTeams}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Équipe</span>
                    <span className={teamName.trim() ? "text-status-open" : "text-muted-foreground"}>
                      {teamName.trim() ? "Complet" : "À remplir"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">Joueurs</span>
                    <span
                      className={
                        completedPlayers === tournament.playersPerTeam ? "text-status-open" : "text-muted-foreground"
                      }
                    >
                      {completedPlayers}/{tournament.playersPerTeam}
                    </span>
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
