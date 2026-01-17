'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSyncedTimerOptions {
  startedAt: string | null
  timeLimitSeconds: number
  onTimeUp?: () => void
  enabled?: boolean
}

export function useSyncedTimer({
  startedAt,
  timeLimitSeconds,
  onTimeUp,
  enabled = true,
}: UseSyncedTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(timeLimitSeconds)
  const [isExpired, setIsExpired] = useState(false)
  const onTimeUpRef = useRef(onTimeUp)
  const hasCalledTimeUp = useRef(false)

  // Update ref when callback changes
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  const calculateRemaining = useCallback(() => {
    if (!startedAt) return timeLimitSeconds

    const startTime = new Date(startedAt).getTime()
    const elapsed = Date.now() - startTime
    const remaining = timeLimitSeconds * 1000 - elapsed
    return Math.max(0, Math.ceil(remaining / 1000))
  }, [startedAt, timeLimitSeconds])

  useEffect(() => {
    if (!enabled || !startedAt) {
      setRemainingSeconds(timeLimitSeconds)
      setIsExpired(false)
      hasCalledTimeUp.current = false
      return
    }

    // Initial calculation
    const initial = calculateRemaining()
    setRemainingSeconds(initial)
    setIsExpired(initial <= 0)

    if (initial <= 0 && !hasCalledTimeUp.current) {
      hasCalledTimeUp.current = true
      onTimeUpRef.current?.()
      return
    }

    // Update every 100ms for smoother countdown
    const interval = setInterval(() => {
      const remaining = calculateRemaining()
      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        setIsExpired(true)
        clearInterval(interval)
        if (!hasCalledTimeUp.current) {
          hasCalledTimeUp.current = true
          onTimeUpRef.current?.()
        }
      }
    }, 100)

    return () => clearInterval(interval)
  }, [startedAt, timeLimitSeconds, enabled, calculateRemaining])

  // Reset hasCalledTimeUp when startedAt changes (new question)
  useEffect(() => {
    hasCalledTimeUp.current = false
  }, [startedAt])

  const progress = timeLimitSeconds > 0 ? remainingSeconds / timeLimitSeconds : 0

  return {
    remainingSeconds,
    isExpired,
    progress,
    startTime: startedAt ? new Date(startedAt).getTime() : null,
  }
}
