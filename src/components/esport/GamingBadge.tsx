"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * StatusBadge - Clean professional badge for tournament status
 * Inspired by FACEIT/Start.gg - subtle colors, no glow effects
 */
const statusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-medium border transition-colors duration-200 shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-transparent",
        open: "bg-status-open/15 text-status-open border-status-open/30",
        closed: "bg-status-closed/15 text-status-closed border-status-closed/30",
        ongoing: "bg-status-ongoing/15 text-status-ongoing border-status-ongoing/30",
        finished: "bg-status-finished/15 text-status-finished border-status-finished/30",
        draft: "bg-status-draft/15 text-status-draft border-status-draft/30",
        outline: "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {}

function StatusBadge({
  className,
  variant,
  size,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

// Backwards compatibility aliases
const GamingBadge = StatusBadge
const gamingBadgeVariants = statusBadgeVariants
type GamingBadgeProps = StatusBadgeProps

export { StatusBadge, statusBadgeVariants, GamingBadge, gamingBadgeVariants }
export type { GamingBadgeProps }
