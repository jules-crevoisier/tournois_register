"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface BracketLineProps {
  /** Direction: right for winners advancing right, left for losers bracket */
  direction?: "right" | "left"
  /** Whether the line is active (winner path) */
  isActive?: boolean
  /** Height of the connector (for multi-match connections) */
  height?: number
  className?: string
}

/**
 * BracketLine - SVG connector for bracket visualization
 * Draws lines connecting matches in elimination brackets
 */
export function BracketLine({
  direction = "right",
  isActive = false,
  height = 64,
  className,
}: BracketLineProps) {
  const width = 24
  const strokeWidth = 2
  const midX = width / 2

  return (
    <svg
      width={width}
      height={height}
      className={cn(
        "shrink-0",
        isActive ? "text-primary" : "text-border",
        className
      )}
      aria-hidden="true"
    >
      {direction === "right" ? (
        // Right-facing connector: match → next round
        <>
          {/* Horizontal line from left edge to middle */}
          <line
            x1={0}
            y1={height / 2}
            x2={midX}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          {/* Vertical line in middle connecting to other match */}
          <line
            x1={midX}
            y1={0}
            x2={midX}
            y2={height}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          {/* Horizontal line from middle to right edge */}
          <line
            x1={midX}
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
        </>
      ) : (
        // Left-facing connector (for losers bracket)
        <>
          <line
            x1={width}
            y1={height / 2}
            x2={midX}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          <line
            x1={midX}
            y1={0}
            x2={midX}
            y2={height}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
          <line
            x1={midX}
            y1={height / 2}
            x2={0}
            y2={height / 2}
            stroke="currentColor"
            strokeWidth={strokeWidth}
          />
        </>
      )}
    </svg>
  )
}

interface BracketConnectorProps {
  /** Number of source matches connecting */
  sourceCount: number
  /** Total height of the connector area */
  height: number
  /** Whether this path is active (winner advanced) */
  isActive?: boolean
  className?: string
}

/**
 * BracketConnector - Connects multiple matches to one
 * Used for single/double elimination where 2 matches feed into 1
 */
export function BracketConnector({
  sourceCount,
  height,
  isActive = false,
  className,
}: BracketConnectorProps) {
  const width = 24
  const strokeWidth = 2
  const midX = width / 2
  const segmentHeight = height / sourceCount

  return (
    <svg
      width={width}
      height={height}
      className={cn(
        "shrink-0",
        isActive ? "text-primary" : "text-border",
        className
      )}
      aria-hidden="true"
    >
      {/* Horizontal lines from each source match */}
      {Array.from({ length: sourceCount }).map((_, i) => (
        <line
          key={i}
          x1={0}
          y1={segmentHeight * i + segmentHeight / 2}
          x2={midX}
          y2={segmentHeight * i + segmentHeight / 2}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      ))}
      {/* Vertical line connecting all sources */}
      <line
        x1={midX}
        y1={segmentHeight / 2}
        x2={midX}
        y2={height - segmentHeight / 2}
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      {/* Horizontal line to destination */}
      <line
        x1={midX}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  )
}

/**
 * Simple horizontal line connector
 */
export function HorizontalConnector({
  width = 24,
  isActive = false,
  className,
}: {
  width?: number
  isActive?: boolean
  className?: string
}) {
  return (
    <svg
      width={width}
      height={4}
      className={cn(
        "shrink-0",
        isActive ? "text-primary" : "text-border",
        className
      )}
      aria-hidden="true"
    >
      <line
        x1={0}
        y1={2}
        x2={width}
        y2={2}
        stroke="currentColor"
        strokeWidth={2}
      />
    </svg>
  )
}

export default BracketLine
