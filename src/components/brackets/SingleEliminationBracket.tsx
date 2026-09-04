"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { BracketMatchCard } from "./BracketMatchCard"
import { BracketConnector } from "./BracketLine"
import type { Match, Team, Bracket } from "@/lib/tournament-engine/types"
import { getRoundName } from "@/lib/tournament-engine/bracket-generator"

interface SingleEliminationBracketProps {
  bracket: Bracket
  teams: Team[]
  highlightedMatchId?: string
  onMatchClick?: (match: Match) => void
  className?: string
}

/**
 * SingleEliminationBracket - Horizontal bracket visualization
 * Supports 4-32 teams with proper spacing and connectors
 * Mobile: horizontal scroll with touch pan
 * Desktop: full view with zoom controls
 */
export function SingleEliminationBracket({
  bracket,
  teams,
  highlightedMatchId,
  onMatchClick,
  className,
}: SingleEliminationBracketProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Build teams map for quick lookup
  const teamsMap = React.useMemo(() => {
    const map = new Map<string, Team>()
    teams.forEach((t) => map.set(t.id, t))
    return map
  }, [teams])

  // Group matches by round
  const matchesByRound = React.useMemo(() => {
    const rounds = new Map<number, Match[]>()
    for (const match of bracket.matches) {
      const existing = rounds.get(match.round) ?? []
      existing.push(match)
      rounds.set(match.round, existing)
    }
    // Sort matches within each round by matchNumber
    for (const [round, matches] of rounds) {
      rounds.set(
        round,
        matches.sort((a, b) => a.matchNumber - b.matchNumber)
      )
    }
    return rounds
  }, [bracket.matches])

  const totalRounds = bracket.totalRounds
  const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1)

  // Calculate match heights for consistent connector spacing
  const matchHeight = 64 // Base match card height
  const matchGap = 16 // Gap between matches in same round

  return (
    <div className={cn("relative", className)}>
      {/* Mobile scroll hint */}
      <div className="sm:hidden text-xs text-muted-foreground text-center mb-2">
        <span>← Faire glisser pour voir le bracket →</span>
      </div>

      {/* Scrollable container */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "overflow-x-auto overflow-y-visible pb-4",
          "-mx-4 px-4 sm:mx-0 sm:px-0"
        )}
      >
        <div className="flex gap-0 min-w-max">
          {roundNumbers.map((roundNum) => {
            const roundMatches = matchesByRound.get(roundNum) ?? []
            const matchCount = roundMatches.length
            const isLastRound = roundNum === totalRounds
            const roundName = getRoundName(roundNum, totalRounds, "WINNERS")

            // Calculate vertical spacing for this round
            // Each subsequent round doubles the spacing
            const spacingMultiplier = Math.pow(2, roundNum - 1)
            const roundMatchGap = matchGap * spacingMultiplier

            return (
              <div key={roundNum} className="flex items-center">
                {/* Round column */}
                <div className="flex flex-col">
                  {/* Round header */}
                  <div className="text-xs font-medium text-muted-foreground text-center mb-2 px-2">
                    {roundName}
                  </div>

                  {/* Matches */}
                  <div
                    className="flex flex-col justify-center"
                    style={{
                      gap: roundMatchGap,
                      paddingTop:
                        roundNum > 1
                          ? (matchHeight + matchGap) * (spacingMultiplier - 1) / 2
                          : 0,
                    }}
                  >
                    {roundMatches.map((match) => (
                      <div
                        key={match.matchNumber}
                        className="flex items-center"
                        style={{ height: matchHeight }}
                      >
                        <BracketMatchCard
                          match={match}
                          teams={teamsMap}
                          isHighlighted={match.id === highlightedMatchId}
                          onClick={() => onMatchClick?.(match)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connectors to next round */}
                {!isLastRound && matchCount > 0 && (
                  <div
                    className="flex flex-col justify-center"
                    style={{
                      gap: roundMatchGap,
                      paddingTop:
                        roundNum > 1
                          ? (matchHeight + matchGap) * (spacingMultiplier - 1) / 2
                          : 0,
                    }}
                  >
                    {Array.from({ length: Math.ceil(matchCount / 2) }).map(
                      (_, i) => {
                        const sourceMatch1 = roundMatches[i * 2]
                        const sourceMatch2 = roundMatches[i * 2 + 1]
                        const connectorHeight =
                          matchHeight * 2 + roundMatchGap

                        // Check if either source has a winner for active state
                        const hasActiveWinner =
                          sourceMatch1?.winnerId !== null ||
                          sourceMatch2?.winnerId !== null

                        return (
                          <BracketConnector
                            key={i}
                            sourceCount={2}
                            height={connectorHeight}
                            isActive={hasActiveWinner}
                          />
                        )
                      }
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SingleEliminationBracket
