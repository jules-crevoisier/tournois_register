"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { BracketMatchCard } from "./BracketMatchCard"
import { BracketConnector, HorizontalConnector } from "./BracketLine"
import type { Match, Team, Bracket, BracketType } from "@/lib/tournament-engine/types"
import { getRoundName } from "@/lib/tournament-engine/bracket-generator"

interface DoubleEliminationBracketProps {
  bracket: Bracket
  teams: Team[]
  highlightedMatchId?: string
  onMatchClick?: (match: Match) => void
  className?: string
}

/**
 * DoubleEliminationBracket - Full double elimination bracket
 * Winners bracket on top, losers bracket below, grand final in center
 */
export function DoubleEliminationBracket({
  bracket,
  teams,
  highlightedMatchId,
  onMatchClick,
  className,
}: DoubleEliminationBracketProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  // Build teams map
  const teamsMap = React.useMemo(() => {
    const map = new Map<string, Team>()
    teams.forEach((t) => map.set(t.id, t))
    return map
  }, [teams])

  // Separate matches by bracket type
  const { winnersMatches, losersMatches, grandFinalMatches } = React.useMemo(() => {
    const winners: Match[] = []
    const losers: Match[] = bracket.losersMatches ?? []
    const grandFinal: Match[] = []

    for (const match of bracket.matches) {
      if (match.bracketType === "GRAND_FINAL") {
        grandFinal.push(match)
      } else if (match.bracketType === "WINNERS") {
        winners.push(match)
      }
    }

    return {
      winnersMatches: winners.sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber),
      losersMatches: losers.sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber),
      grandFinalMatches: grandFinal.sort((a, b) => a.round - b.round),
    }
  }, [bracket])

  // Group matches by round
  const winnersByRound = groupByRound(winnersMatches)
  const losersByRound = groupByRound(losersMatches)

  const winnersRoundCount = winnersByRound.size
  const losersRoundCount = losersByRound.size

  const matchHeight = 64
  const matchGap = 16

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
        <div className="min-w-max space-y-8">
          {/* Winners Bracket */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Winners Bracket
            </h3>
            <BracketSection
              matchesByRound={winnersByRound}
              totalRounds={winnersRoundCount}
              teams={teamsMap}
              bracketType="WINNERS"
              highlightedMatchId={highlightedMatchId}
              onMatchClick={onMatchClick}
              matchHeight={matchHeight}
              matchGap={matchGap}
            />
          </div>

          {/* Grand Final */}
          {grandFinalMatches.length > 0 && (
            <div className="flex flex-col items-center">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Grand Final
              </h3>
              <div className="flex gap-4 items-center">
                {grandFinalMatches.map((match, idx) => (
                  <React.Fragment key={match.matchNumber}>
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        {idx === 0 ? "Grand Final" : "Bracket Reset"}
                      </div>
                      <BracketMatchCard
                        match={match}
                        teams={teamsMap}
                        isHighlighted={match.id === highlightedMatchId}
                        onClick={() => onMatchClick?.(match)}
                      />
                    </div>
                    {idx === 0 && grandFinalMatches.length > 1 && (
                      <div className="flex items-center">
                        <HorizontalConnector width={32} />
                        <div className="text-xs text-muted-foreground px-2">
                          si necessaire
                        </div>
                        <HorizontalConnector width={32} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Losers Bracket */}
          {losersMatches.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Losers Bracket
              </h3>
              <BracketSection
                matchesByRound={losersByRound}
                totalRounds={losersRoundCount}
                teams={teamsMap}
                bracketType="LOSERS"
                highlightedMatchId={highlightedMatchId}
                onMatchClick={onMatchClick}
                matchHeight={matchHeight}
                matchGap={matchGap}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface BracketSectionProps {
  matchesByRound: Map<number, Match[]>
  totalRounds: number
  teams: Map<string, Team>
  bracketType: BracketType
  highlightedMatchId?: string
  onMatchClick?: (match: Match) => void
  matchHeight: number
  matchGap: number
}

function BracketSection({
  matchesByRound,
  totalRounds,
  teams,
  bracketType,
  highlightedMatchId,
  onMatchClick,
  matchHeight,
  matchGap,
}: BracketSectionProps) {
  const roundNumbers = Array.from(matchesByRound.keys()).sort((a, b) => a - b)

  return (
    <div className="flex gap-0">
      {roundNumbers.map((roundNum, roundIdx) => {
        const roundMatches = matchesByRound.get(roundNum) ?? []
        const matchCount = roundMatches.length
        const isLastRound = roundIdx === roundNumbers.length - 1
        const roundName = getRoundName(roundNum, totalRounds, bracketType)

        // Spacing calculation
        const spacingMultiplier = Math.pow(2, roundIdx)
        const roundMatchGap = matchGap * spacingMultiplier

        return (
          <div key={roundNum} className="flex items-center">
            {/* Round column */}
            <div className="flex flex-col">
              {/* Round header */}
              <div className="text-xs font-medium text-muted-foreground text-center mb-2 px-2 whitespace-nowrap">
                {roundName}
              </div>

              {/* Matches */}
              <div
                className="flex flex-col justify-center"
                style={{
                  gap: roundMatchGap,
                  paddingTop:
                    roundIdx > 0
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
                      teams={teams}
                      isHighlighted={match.id === highlightedMatchId}
                      onClick={() => onMatchClick?.(match)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Connectors */}
            {!isLastRound && matchCount > 0 && (
              <div
                className="flex flex-col justify-center"
                style={{
                  gap: roundMatchGap,
                  paddingTop:
                    roundIdx > 0
                      ? (matchHeight + matchGap) * (spacingMultiplier - 1) / 2
                      : 0,
                }}
              >
                {Array.from({ length: Math.ceil(matchCount / 2) }).map((_, i) => {
                  const sourceMatch1 = roundMatches[i * 2]
                  const sourceMatch2 = roundMatches[i * 2 + 1]
                  const connectorHeight = matchHeight * 2 + roundMatchGap
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
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function groupByRound(matches: Match[]): Map<number, Match[]> {
  const rounds = new Map<number, Match[]>()
  for (const match of matches) {
    const existing = rounds.get(match.round) ?? []
    existing.push(match)
    rounds.set(match.round, existing)
  }
  for (const [round, matchList] of rounds) {
    rounds.set(
      round,
      matchList.sort((a, b) => a.matchNumber - b.matchNumber)
    )
  }
  return rounds
}

export default DoubleEliminationBracket
