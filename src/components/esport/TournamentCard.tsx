"use client"

import * as React from "react"
import Link from "next/link"
import { Calendar, Users, Gamepad2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./GamingBadge"
import { Button } from "@/components/ui/button"

export interface TournamentCardProps {
  id: string
  title: string
  description?: string
  game: string
  playersPerTeam: number
  maxTeams: number
  teamsCount: number
  startDate: string
  registrationDeadline?: string
  status: "open" | "closed" | "ongoing" | "finished" | "draft"
  image?: string | null
  className?: string
}

const statusLabels: Record<string, string> = {
  open: "Inscriptions ouvertes",
  closed: "Inscriptions fermées",
  ongoing: "En cours",
  finished: "Terminé",
  draft: "Brouillon",
}

/**
 * TournamentCard - Clean professional tournament card
 * Inspired by FACEIT/Start.gg - subtle hover, no glow effects
 */
export function TournamentCard({
  id,
  title,
  description,
  game,
  playersPerTeam,
  maxTeams,
  teamsCount,
  startDate,
  registrationDeadline,
  status,
  image,
  className,
}: TournamentCardProps) {
  const spotsLeft = maxTeams - teamsCount
  const isFull = spotsLeft <= 0
  const isAlmostFull = spotsLeft > 0 && spotsLeft <= 3
  const fillPercentage = Math.min((teamsCount / maxTeams) * 100, 100)

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card",
        "transition-all duration-200 ease-out",
        "hover:border-primary/60 hover:-translate-y-0.5",
        "hover:shadow-md",
        className
      )}
    >
      {/* Image section */}
      {image && (
        <div className="relative h-36 sm:h-40 w-full overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
          {/* Status badge on image */}
          <div className="absolute top-3 right-3">
            <StatusBadge variant={status}>
              {statusLabels[status] || status}
            </StatusBadge>
          </div>
        </div>
      )}

      <div className="relative p-4">
        {/* Header with title */}
        <div className="mb-3">
          <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          {/* Status badge when no image */}
          {!image && (
            <div className="mt-2">
              <StatusBadge variant={status}>
                {statusLabels[status] || status}
              </StatusBadge>
            </div>
          )}
        </div>

        {/* Tournament details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Gamepad2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{game}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {playersPerTeam === 1 ? "Solo" : `${playersPerTeam}v${playersPerTeam}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{new Date(startDate).toLocaleDateString("fr-FR")}</span>
          </div>

          {registrationDeadline && status === "open" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-xs">
                Deadline: {new Date(registrationDeadline).toLocaleDateString("fr-FR")}
              </span>
            </div>
          )}
        </div>

        {/* Team capacity bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Équipes inscrites</span>
            <span
              className={cn(
                "font-medium",
                isFull
                  ? "text-status-closed"
                  : isAlmostFull
                  ? "text-status-draft"
                  : "text-foreground"
              )}
            >
              {teamsCount} / {maxTeams}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={cn(
                "progress-bar-fill",
                isFull
                  ? "progress-bar-fill-high"
                  : isAlmostFull
                  ? "progress-bar-fill-medium"
                  : "progress-bar-fill-low"
              )}
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-4">
          <Button
            asChild
            variant="default"
            className="w-full min-h-[44px]"
          >
            <Link href={`/tournaments/${id}`}>Voir les détails</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
