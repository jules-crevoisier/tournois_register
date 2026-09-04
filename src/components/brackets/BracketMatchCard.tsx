"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Match, MatchStatus, Team } from "@/lib/tournament-engine/types"

interface BracketMatchCardProps {
  match: Match
  teams: Map<string, Team>
  isHighlighted?: boolean
  onClick?: () => void
  className?: string
}

function getStatusStyle(status: MatchStatus, isHighlighted?: boolean) {
  if (isHighlighted) {
    return "border-primary bg-primary/10"
  }
  switch (status) {
    case "IN_PROGRESS":
      return "border-status-ongoing bg-status-ongoing/10"
    case "COMPLETED":
      return "border-border"
    case "CANCELLED":
      return "border-muted opacity-50"
    default:
      return "border-border"
  }
}

/**
 * BracketMatchCard - Compact match display for brackets
 * Clean style, minimal height for dense bracket layouts
 */
export function BracketMatchCard({
  match,
  teams,
  isHighlighted,
  onClick,
  className,
}: BracketMatchCardProps) {
  const homeTeam = match.homeTeamId ? teams.get(match.homeTeamId) ?? null : null
  const awayTeam = match.awayTeamId ? teams.get(match.awayTeamId) ?? null : null
  const hasScores =
    match.homeScore !== null &&
    match.awayScore !== null &&
    match.status === "COMPLETED"
  const homeWins = hasScores && match.homeScore! > match.awayScore!
  const awayWins = hasScores && match.awayScore! > match.homeScore!
  const isLive = match.status === "IN_PROGRESS"

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-full min-w-[140px] rounded border bg-card transition-colors duration-150",
        getStatusStyle(match.status, isHighlighted),
        onClick && "cursor-pointer hover:bg-card-hover",
        className
      )}
    >
      {/* Live indicator */}
      {isLive && (
        <div className="live-indicator absolute top-1 right-1 text-[10px]">
          <span>LIVE</span>
        </div>
      )}

      {/* Team rows */}
      <div className="divide-y divide-border">
        {/* Home team */}
        <TeamRow
          team={homeTeam}
          seed={homeTeam?.seed}
          score={match.homeScore}
          isWinner={homeWins}
          isLoser={hasScores && !homeWins}
          isBye={!homeTeam && !awayTeam ? false : !homeTeam}
        />
        {/* Away team */}
        <TeamRow
          team={awayTeam}
          seed={awayTeam?.seed}
          score={match.awayScore}
          isWinner={awayWins}
          isLoser={hasScores && !awayWins}
          isBye={!awayTeam && homeTeam !== null}
        />
      </div>
    </div>
  )
}

interface TeamRowProps {
  team: Team | null
  seed?: number
  score: number | null
  isWinner: boolean
  isLoser: boolean
  isBye: boolean
}

function TeamRow({ team, seed, score, isWinner, isLoser, isBye }: TeamRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-2 py-1.5",
        "min-h-[32px]",
        isLoser && "opacity-50"
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {seed !== undefined && (
          <span className="text-[10px] text-muted-foreground w-4 shrink-0">
            {seed}
          </span>
        )}
        <span
          className={cn(
            "text-sm truncate",
            isWinner ? "font-medium text-foreground" : "text-muted-foreground",
            isBye && "italic"
          )}
        >
          {team?.teamName ?? (isBye ? "BYE" : "TBD")}
        </span>
      </div>
      {score !== null && (
        <span
          className={cn(
            "text-sm font-semibold tabular-nums shrink-0",
            isWinner ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {score}
        </span>
      )}
    </div>
  )
}

export default BracketMatchCard
