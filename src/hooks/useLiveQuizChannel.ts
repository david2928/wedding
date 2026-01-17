'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { LiveQuizEvent } from '@/lib/live-quiz/types'

interface UseLiveQuizChannelOptions {
  sessionId: string | null
  onEvent: (event: LiveQuizEvent) => void
  enabled?: boolean
}

export function useLiveQuizChannel({
  sessionId,
  onEvent,
  enabled = true,
}: UseLiveQuizChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  const broadcast = useCallback(
    (event: LiveQuizEvent) => {
      if (!channelRef.current || !sessionId) return

      channelRef.current.send({
        type: 'broadcast',
        event: event.type,
        payload: event.payload,
      })
    },
    [sessionId]
  )

  useEffect(() => {
    if (!sessionId || !enabled) return

    const channelName = `live-quiz:${sessionId}`
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    })

    channel
      .on('broadcast', { event: 'quiz:started' }, ({ payload }) => {
        onEvent({ type: 'quiz:started', payload })
      })
      .on('broadcast', { event: 'quiz:question' }, ({ payload }) => {
        onEvent({ type: 'quiz:question', payload })
      })
      .on('broadcast', { event: 'quiz:reveal' }, ({ payload }) => {
        onEvent({ type: 'quiz:reveal', payload })
      })
      .on('broadcast', { event: 'quiz:leaderboard' }, ({ payload }) => {
        onEvent({ type: 'quiz:leaderboard', payload })
      })
      .on('broadcast', { event: 'quiz:ended' }, ({ payload }) => {
        onEvent({ type: 'quiz:ended', payload })
      })
      .on('broadcast', { event: 'quiz:participant_joined' }, ({ payload }) => {
        onEvent({ type: 'quiz:participant_joined', payload })
      })
      .on('broadcast', { event: 'quiz:answer_count' }, ({ payload }) => {
        onEvent({ type: 'quiz:answer_count', payload })
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [sessionId, enabled, onEvent])

  return { broadcast }
}
