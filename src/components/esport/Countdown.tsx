"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CountdownProps {
  targetDate: string | Date
  className?: string
  onComplete?: () => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const difference = targetDate.getTime() - Date.now()

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  }
}

/**
 * Countdown - Clean professional countdown timer
 * Inspired by FACEIT/Start.gg - no glow effects, subtle styling
 */
export function Countdown({ targetDate, className, onComplete }: CountdownProps) {
  const target = React.useMemo(
    () => (typeof targetDate === "string" ? new Date(targetDate) : targetDate),
    [targetDate]
  )

  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(() =>
    calculateTimeLeft(target)
  )
  const [isComplete, setIsComplete] = React.useState(false)

  React.useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(target)
      setTimeLeft(newTimeLeft)

      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        setIsComplete(true)
        clearInterval(timer)
        onComplete?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [target, onComplete])

  if (isComplete) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-status-closed/15 border border-status-closed/30 px-4 py-2",
          className
        )}
      >
        <span className="text-status-closed font-medium">Terminé</span>
      </div>
    )
  }

  const segments = [
    { value: timeLeft.days, label: "Jours" },
    { value: timeLeft.hours, label: "Heures" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ]

  return (
    <div className={cn("flex gap-2 sm:gap-3", className)}>
      {segments.map((segment) => (
        <div
          key={segment.label}
          className="countdown-segment"
        >
          <span className="countdown-value">
            {String(segment.value).padStart(2, "0")}
          </span>
          <span className="countdown-label">
            {segment.label}
          </span>
        </div>
      ))}
    </div>
  )
}
