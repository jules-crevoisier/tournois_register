"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Trophy } from "lucide-react"
import type { Match, Team, RoundRobinStanding } from "@/lib/tournament-engine/types"

interface RoundRobinTableProps {
  standings: RoundRobinStanding[]
  matches: Match[]
  teams: Team[]
  onTeamClick?: (teamId: string) => void
  sortBy?: "points" | "goalDifference" | "wins"
  className?: string
}

/**
 * RoundRobinTable - Full standings table with cross-match results
 * Shows standings ranking and optionally a matrix of head-to-head results
 */
export function RoundRobinTable({
  standings,
  matches,
  teams,
  onTeamClick,
  sortBy = "points",
  className,
}: RoundRobinTableProps) {
  // Sort standings
  const sortedStandings = React.useMemo(() => {
    const sorted = [...standings]
    switch (sortBy) {
      case "goalDifference":
        sorted.sort((a, b) => b.goalDifference - a.goalDifference || b.points - a.points)
        break
      case "wins":
        sorted.sort((a, b) => b.won - a.won || b.points - a.points)
        break
      default:
        // Already sorted by points from engine
        break
    }
    return sorted
  }, [standings, sortBy])

  // Build match result lookup
  const matchResults = React.useMemo(() => {
    const results = new Map<string, { homeScore: number; awayScore: number }>()
    for (const match of matches) {
      if (
        match.status === "COMPLETED" &&
        match.homeTeamId &&
        match.awayTeamId &&
        match.homeScore !== null &&
        match.awayScore !== null
      ) {
        const key = `${match.homeTeamId}-${match.awayTeamId}`
        results.set(key, {
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        })
      }
    }
    return results
  }, [matches])

  const getMatchResult = (team1Id: string, team2Id: string) => {
    // Check both directions since team1 could be home or away
    const asHome = matchResults.get(`${team1Id}-${team2Id}`)
    if (asHome) {
      return { score: `${asHome.homeScore}-${asHome.awayScore}`, isHome: true }
    }
    const asAway = matchResults.get(`${team2Id}-${team1Id}`)
    if (asAway) {
      return { score: `${asAway.awayScore}-${asAway.homeScore}`, isHome: false }
    }
    return null
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Main standings table */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[500px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground w-10">
                #
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">
                Equipe
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground w-12">
                J
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground w-12">
                V
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground w-12">
                N
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground w-12">
                D
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground w-16">
                BP
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground w-16">
                BC
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground w-16">
                +/-
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-muted-foreground w-16">
                Pts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedStandings.map((standing, index) => {
              const rank = index + 1
              const isTopThree = rank <= 3

              return (
                <tr
                  key={standing.teamId}
                  onClick={() => onTeamClick?.(standing.teamId)}
                  className={cn(
                    "table-row-interactive",
                    onTeamClick && "cursor-pointer",
                    isTopThree && "bg-primary/5"
                  )}
                >
                  {/* Rank */}
                  <td className="px-2 py-3">
                    <div className="flex justify-center">
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
                  </td>

                  {/* Team name */}
                  <td className="px-2 py-3">
                    <span className="font-medium text-sm truncate">
                      {standing.teamName}
                    </span>
                  </td>

                  {/* Played */}
                  <td className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {standing.played}
                  </td>

                  {/* Won */}
                  <td className="px-2 py-3 text-center text-sm text-status-open font-medium">
                    {standing.won}
                  </td>

                  {/* Drawn */}
                  <td className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {standing.drawn}
                  </td>

                  {/* Lost */}
                  <td className="px-2 py-3 text-center text-sm text-status-closed font-medium">
                    {standing.lost}
                  </td>

                  {/* Goals For */}
                  <td className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {standing.goalsFor}
                  </td>

                  {/* Goals Against */}
                  <td className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {standing.goalsAgainst}
                  </td>

                  {/* Goal Difference */}
                  <td className="px-2 py-3 text-center text-sm">
                    <span
                      className={cn(
                        "font-medium",
                        standing.goalDifference > 0 && "text-status-open",
                        standing.goalDifference < 0 && "text-status-closed",
                        standing.goalDifference === 0 && "text-muted-foreground"
                      )}
                    >
                      {standing.goalDifference > 0 ? "+" : ""}
                      {standing.goalDifference}
                    </span>
                  </td>

                  {/* Points */}
                  <td className="px-2 py-3 text-center">
                    <span
                      className={cn(
                        "font-semibold text-sm",
                        rank === 1 && "text-primary"
                      )}
                    >
                      {standing.points}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Cross-match matrix (desktop only) */}
      {teams.length <= 12 && (
        <div className="hidden lg:block mt-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Resultats tete-a-tete
          </h4>
          <CrossMatchMatrix
            standings={sortedStandings}
            getMatchResult={getMatchResult}
          />
        </div>
      )}
    </div>
  )
}

interface CrossMatchMatrixProps {
  standings: RoundRobinStanding[]
  getMatchResult: (
    team1Id: string,
    team2Id: string
  ) => { score: string; isHome: boolean } | null
}

function CrossMatchMatrix({ standings, getMatchResult }: CrossMatchMatrixProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left text-muted-foreground" />
            {standings.map((s) => (
              <th
                key={s.teamId}
                className="px-2 py-2 text-center text-muted-foreground font-medium w-16 truncate"
                title={s.teamName}
              >
                {s.teamName.substring(0, 3).toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr key={row.teamId}>
              <td className="px-2 py-2 font-medium text-muted-foreground truncate max-w-[100px]">
                {row.teamName}
              </td>
              {standings.map((col) => {
                if (row.teamId === col.teamId) {
                  return (
                    <td
                      key={col.teamId}
                      className="px-2 py-2 text-center bg-muted/50"
                    >
                      -
                    </td>
                  )
                }

                const result = getMatchResult(row.teamId, col.teamId)
                if (!result) {
                  return (
                    <td
                      key={col.teamId}
                      className="px-2 py-2 text-center text-muted-foreground"
                    >
                      —
                    </td>
                  )
                }

                const [score1, score2] = result.score.split("-").map(Number)
                const isWin = score1 > score2
                const isDraw = score1 === score2

                return (
                  <td
                    key={col.teamId}
                    className={cn(
                      "px-2 py-2 text-center font-medium",
                      isWin && "text-status-open bg-status-open/10",
                      !isWin && !isDraw && "text-status-closed bg-status-closed/10",
                      isDraw && "text-muted-foreground bg-muted/50"
                    )}
                  >
                    {result.score}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RoundRobinTable
