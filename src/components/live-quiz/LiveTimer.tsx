'use client'

import React from 'react'
import { useSyncedTimer } from '@/hooks/useSyncedTimer'
import { Clock } from 'lucide-react'

interface LiveTimerProps {
  startedAt: string | null
  timeLimitSeconds: number
  onTimeUp?: () => void
  size?: 'sm' | 'md' | 'lg'
  showProgress?: boolean
}

export function LiveTimer({
  startedAt,
  timeLimitSeconds,
  onTimeUp,
  size = 'md',
  showProgress = false,
}: LiveTimerProps) {
  const { remainingSeconds, isExpired, progress } = useSyncedTimer({
    startedAt,
    timeLimitSeconds,
    onTimeUp,
    enabled: !!startedAt,
  })

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  }

  const getColorClass = () => {
    if (isExpired) return 'text-red-600'
    if (remainingSeconds <= 5) return 'text-red-500 animate-pulse'
    if (remainingSeconds <= 10) return 'text-orange-500'
    return 'text-ocean-blue'
  }

  const getProgressColor = () => {
    if (isExpired) return 'bg-red-600'
    if (progress < 0.2) return 'bg-red-500'
    if (progress < 0.4) return 'bg-orange-500'
    return 'bg-ocean-blue'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Clock className={`w-6 h-6 ${getColorClass()}`} />
        <span className={`font-bold ${sizeClasses[size]} ${getColorClass()} tabular-nums`}>
          {remainingSeconds}
        </span>
      </div>
      {showProgress && (
        <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${getProgressColor()}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
      {isExpired && (
        <span className="text-sm text-red-600 font-medium">Time&apos;s up!</span>
      )}
    </div>
  )
}
