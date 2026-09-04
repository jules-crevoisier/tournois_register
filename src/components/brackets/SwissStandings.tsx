"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Trophy, ChevronDown, ChevronUp } from "lucide-react"
import type { SwissStanding, SwissRound } from "@/lib/tournament-engine/types"

interface SwissStandingsProps {
  standings: SwissStanding[]
  rounds: SwissRound[]
  currentRound: number
  totalRounds: number
  onTeamClick?: (teamId: string) => void
  className?: string
}

/**
 * SwissStandings - Swiss system standings with round history
 * Shows current standings and match history by round
 */
export function SwissStandings({
  standings,
  rounds,
  currentRound,
  totalRounds,
  onTeamClick,
  className,
}: SwissStandingsProps) {
  const [expandedTeam, setExpandedTeam] = React.useState<string | null>(null)

  // Build match history per team
  const teamMatchHistory = React.useMemo(() => {
    const history = new Map<string, { round: number; opponent: string; result: "W" | "D" | "L" | "BYE" }[]>()

    for (const round of rounds) {
      for (const match of round.matches) {
        if (match.status !== "COMPLETED") continue
        if (!match.homeTeamId) continue

        const homeHistory = history.get(match.homeTeamId) ?? []
        const awayHistory = match.awayTeamId ? history.get(match.awayTeamId) ?? [] : []

        if (!match.awayTeamId) {
          // Bye
          homeHistory.push({
            round: round.roundNumber,
            opponent: "BYE",
            result: "BYE",
          })
        } else if (match.homeScore !== null && match.awayScore !== null) {
          const homeWin = match.homeScore > match.awayScore
          const draw = match.homeScore === match.awayScore

          const opponentName =
            standings.find((s) => s.teamId === match.awayTeamId)?.teamName ??
            match.awayTeamId

          homeHistory.push({
            round: round.roundNumber,
            opponent: opponentName,
            result: homeWin ? "W" : draw ? "D" : "L",
          })

          const homeName =
            standings.find((s) => s.teamId === match.homeTeamId)?.teamName ??
            match.homeTeamId

          awayHistory.push({
            round: round.roundNumber,
            opponent: homeName,
            result: homeWin ? "L" : draw ? "D" : "W",
          })

          history.set(match.awayTeamId, awayHistory)
        }

        history.set(match.homeTeamId, homeHistory)
      }
    }

    return history
  }, [rounds, standings])

  const handleTeamClick = (teamId: string) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId)
    onTeamClick?.(teamId)
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Round indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Ronde {currentRound} / {totalRounds}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full",
                i + 1 <= currentRound ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Standings table */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[360px] rounded-lg border border-border bg-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 px-3 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
            <div className="w-8 text-center">#</div>
            <div>Equipe</div>
            <div className="w-12 text-center">V-N-D</div>
            <div className="w-12 text-center">Pts</div>
            <div className="w-14 text-center hidden sm:block">Buchholz</div>
            <div className="w-6" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {standings.map((standing, index) => {
              const rank = index + 1
              const isTopThree = rank <= 3
              const isExpanded = expandedTeam === standing.teamId
              const history = teamMatchHistory.get(standing.teamId) ?? []

              return (
                <div key={standing.teamId}>
                  {/* Main row */}
                  <div
                    onClick={() => handleTeamClick(standing.teamId)}
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 items-center px-3 py-3",
                      "table-row-interactive cursor-pointer",
                      isTopThree && "bg-primary/5"
                    )}
                  >
                    {/* Rank */}
                    <div className="w-8 flex justify-center">
                      {rank === 1 ? (
                        <div className="rank-badge rank-1">
                          <Trophy className="h-4 w-4" />
                        </div>
                      ) : rank === 2 ? (
                        <div className="rank-badge rank-2">{rank}</div>
                      ) : rank === 3 ? (
                        <div className="rank-badge rank-3">{rank}</div>
                      ) : (
                        <div className="rank-badge rank-default">{rank}</div>
                      )}
                    </div>

                    {/* Team name */}
                    <div className="min-w-0">
                      <span className="font-medium text-sm truncate block">
                        {standing.teamName}
                      </span>
                    </div>

                    {/* W-D-L */}
                    <div className="w-12 text-center text-sm">
                      <span className="text-status-open">{standing.wins}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-muted-foreground">{standing.draws}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-status-closed">{standing.losses}</span>
                    </div>

                    {/* Points */}
                    <div
                      className={cn(
                        "w-12 text-center font-semibold text-sm",
                        rank === 1 && "text-primary"
                      )}
                    >
                      {standing.points}
                    </div>

                    {/* Buchholz (desktop) */}
                    <div className="w-14 text-center text-sm text-muted-foreground hidden sm:block">
                      {standing.buchholz}
                    </div>

                    {/* Expand icon */}
                    <div className="w-6 flex justify-center">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Match history (expanded) */}
                  {isExpanded && history.length > 0 && (
                    <div className="px-3 pb-3 pt-1 bg-muted/30 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-2">
                        Historique des matchs
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {history.map((h, i) => (
                          <div
                            key={i}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                              h.result === "W" && "bg-status-open/15 text-status-open",
                              h.result === "L" && "bg-status-closed/15 text-status-closed",
                              h.result === "D" && "bg-muted text-muted-foreground",
                              h.result === "BYE" && "bg-muted text-muted-foreground italic"
                            )}
                          >
                            <span className="font-medium">R{h.round}</span>
                            <span className="text-foreground/60">vs</span>
                            <span className="truncate max-w-[100px]">
                              {h.opponent}
                            </span>
                            <span className="font-semibold">{h.result}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="font-medium">V</span>=Victoire
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">N</span>=Nul
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">D</span>=Defaite
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">Buchholz</span>=Score cumulé des adversaires
        </div>
      </div>
    </div>
  )
}

export default SwissStandings
