"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Team {
  name: string
  logo?: string
  score?: number
}

interface MatchCardProps {
  team1: Team
  team2: Team
  status: "upcoming" | "live" | "finished"
  matchTime?: string
  matchDate?: string
  className?: string
}

/**
 * MatchCard - Clean professional match display
 * Inspired by FACEIT/Start.gg - clean layout, subtle highlights
 */
export function MatchCard({
  team1,
  team2,
  status,
  matchTime,
  matchDate,
  className,
}: MatchCardProps) {
  const hasScores =
    team1.score !== undefined && team2.score !== undefined && status === "finished"
  const team1Wins = hasScores && team1.score! > team2.score!
  const team2Wins = hasScores && team2.score! > team1.score!

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-card",
        "p-3 sm:p-4",
        "transition-colors duration-200",
        "hover:bg-card-hover",
        status === "live" && "border-status-ongoing",
        className
      )}
    >
      {/* Live indicator */}
      {status === "live" && (
        <div className="live-indicator absolute top-2 right-2">
          <span>LIVE</span>
        </div>
      )}

      {/* Match time/date for upcoming */}
      {status === "upcoming" && (matchTime || matchDate) && (
        <div className="text-center mb-3">
          <div className="text-xs text-muted-foreground">
            {matchDate && <span>{new Date(matchDate).toLocaleDateString("fr-FR")}</span>}
            {matchDate && matchTime && <span> • </span>}
            {matchTime && <span>{matchTime}</span>}
          </div>
        </div>
      )}

      {/* Teams and scores */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Team 1 */}
        <div
          className={cn(
            "flex items-center gap-2 sm:gap-3 min-w-0 flex-1",
            hasScores && !team1Wins && "opacity-60"
          )}
        >
          {team1.logo ? (
            <img
              src={team1.logo}
              alt={team1.name}
              className="size-8 sm:size-10 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="size-8 sm:size-10 rounded-full bg-muted shrink-0" />
          )}
          <span
            className={cn(
              "font-medium truncate text-sm sm:text-base",
              team1Wins && "text-foreground"
            )}
          >
            {team1.name}
          </span>
        </div>

        {/* Score / VS */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-4">
          {hasScores ? (
            <>
              <span
                className={cn(
                  "match-score",
                  team1Wins ? "match-score-winner" : "match-score-loser"
                )}
              >
                {team1.score}
              </span>
              <span className="text-muted-foreground text-sm">-</span>
              <span
                className={cn(
                  "match-score",
                  team2Wins ? "match-score-winner" : "match-score-loser"
                )}
              >
                {team2.score}
              </span>
            </>
          ) : (
            <span
              className={cn(
                "text-xs sm:text-sm font-medium px-2 py-1 rounded bg-muted text-muted-foreground",
                status === "live" && "bg-status-ongoing/15 text-status-ongoing"
              )}
            >
              {status === "live" ? "EN COURS" : "VS"}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div
          className={cn(
            "flex items-center gap-2 sm:gap-3 min-w-0 flex-1 justify-end",
            hasScores && !team2Wins && "opacity-60"
          )}
        >
          <span
            className={cn(
              "font-medium truncate text-sm sm:text-base text-right",
              team2Wins && "text-foreground"
            )}
          >
            {team2.name}
          </span>
          {team2.logo ? (
            <img
              src={team2.logo}
              alt={team2.name}
              className="size-8 sm:size-10 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="size-8 sm:size-10 rounded-full bg-muted shrink-0" />
          )}
        </div>
      </div>
    </div>
  )
}
