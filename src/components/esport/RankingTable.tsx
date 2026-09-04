"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface RankingEntry {
  rank: number
  previousRank?: number
  teamName: string
  teamLogo?: string
  wins: number
  losses: number
  points: number
}

interface RankingTableProps {
  entries: RankingEntry[]
  className?: string
}

/**
 * RankBadge - Clean medal styling for top 3, muted for rest
 */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="rank-badge rank-1">
        <Trophy className="h-4 w-4" />
      </div>
    )
  }

  if (rank === 2) {
    return (
      <div className="rank-badge rank-2">
        {rank}
      </div>
    )
  }

  if (rank === 3) {
    return (
      <div className="rank-badge rank-3">
        {rank}
      </div>
    )
  }

  return (
    <div className="rank-badge rank-default">
      {rank}
    </div>
  )
}

function RankChange({
  current,
  previous,
}: {
  current: number
  previous?: number
}) {
  if (previous === undefined) return null

  const change = previous - current

  if (change > 0) {
    return (
      <div className="flex items-center gap-0.5 text-status-open text-xs">
        <TrendingUp className="h-3 w-3" />
        <span>{change}</span>
      </div>
    )
  }

  if (change < 0) {
    return (
      <div className="flex items-center gap-0.5 text-status-closed text-xs">
        <TrendingDown className="h-3 w-3" />
        <span>{Math.abs(change)}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center text-muted-foreground text-xs">
      <Minus className="h-3 w-3" />
    </div>
  )
}

/**
 * RankingTable - Clean professional leaderboard
 * Inspired by FACEIT/Start.gg - clean rows, subtle highlights
 */
export function RankingTable({ entries, className }: RankingTableProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border border-border bg-card overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 sm:gap-4",
          "px-3 sm:px-4 py-3 bg-muted/50 border-b border-border",
          "text-xs sm:text-sm font-medium text-muted-foreground"
        )}
      >
        <div className="w-10 text-center">#</div>
        <div>Équipe</div>
        <div className="w-16 text-center">V-D</div>
        <div className="w-16 text-center">Pts</div>
        <div className="w-8" />
      </div>

      {/* Entries */}
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <div
            key={`${entry.teamName}-${entry.rank}`}
            className={cn(
              "grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 sm:gap-4 items-center",
              "px-3 sm:px-4 py-3",
              "table-row-interactive",
              entry.rank <= 3 && "bg-primary/5"
            )}
          >
            {/* Rank */}
            <div className="w-10 flex justify-center">
              <RankBadge rank={entry.rank} />
            </div>

            {/* Team */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {entry.teamLogo ? (
                <img
                  src={entry.teamLogo}
                  alt={entry.teamName}
                  className="size-8 rounded-full object-cover border border-border shrink-0"
                />
              ) : (
                <div className="size-8 rounded-full bg-muted shrink-0" />
              )}
              <span className="font-medium truncate">{entry.teamName}</span>
            </div>

            {/* W-L */}
            <div className="w-16 text-center text-sm">
              <span className="text-status-open">{entry.wins}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-status-closed">{entry.losses}</span>
            </div>

            {/* Points */}
            <div
              className={cn(
                "w-16 text-center font-semibold text-sm",
                entry.rank === 1 && "text-primary"
              )}
            >
              {entry.points}
            </div>

            {/* Change */}
            <div className="w-8 flex justify-center">
              <RankChange current={entry.rank} previous={entry.previousRank} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
