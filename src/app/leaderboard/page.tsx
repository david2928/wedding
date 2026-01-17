'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Trophy, Medal, Award, ArrowLeft, RefreshCw } from 'lucide-react'
import type { Tables } from '@/lib/supabase/types'

type Party = Tables<'parties'>
type QuizSubmission = Tables<'quiz_submissions'>

interface LeaderboardEntry {
  party_id: string
  party_name: string
  from_side: string | null
  total_score: number
  total_questions: number
  time_taken_seconds: number
  completed_at: string
  games_completed: number
  rank: number
}

export default function LeaderboardPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    loadLeaderboard()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadLeaderboard(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadLeaderboard = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true)
      if (isRefresh) setRefreshing(true)

      // Query the leaderboard view we created
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')

      if (error) {
        console.error('Error loading leaderboard:', error)
      } else {
        setLeaderboard((data as LeaderboardEntry[]) || [])
      }

      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      console.error('Error:', err)
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />
    return <span className="text-lg font-semibold text-deep-blue/50">#{rank}</span>
  }

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300'
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300'
    return 'bg-white border-gray-200'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-12 h-12 text-ocean-blue" />
            <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue">
              Leaderboard
            </h1>
          </div>
          <p className="text-deep-blue/70">
            Top scores from the wedding quiz
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => router.push('/games')}
            variant="outline"
            className="border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
          <Button
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing}
            variant="outline"
            className="border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-deep-blue mb-2">
              No Submissions Yet
            </h2>
            <p className="text-deep-blue/70">
              Be the first to complete the quiz and claim the top spot!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.party_id}
                className={`rounded-xl border-2 p-4 md:p-6 ${getRankBgColor(entry.rank)} transition-all hover:shadow-lg`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Party Info */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg text-deep-blue">
                        {entry.party_name}
                      </h3>
                      {entry.from_side && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          entry.from_side === 'David'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {entry.from_side === 'David' ? "Groom's Side" : "Bride's Side"}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-deep-blue/60">
                      <span>
                        <strong className="text-deep-blue">{entry.total_score}</strong> points
                      </span>
                      <span>•</span>
                      <span>
                        {entry.total_questions > 0
                          ? Math.round((entry.total_score / (entry.total_questions * 10)) * 100)
                          : 0}% correct
                      </span>
                      <span>•</span>
                      <span>
                        Time: {formatTime(entry.time_taken_seconds)}
                      </span>
                    </div>
                  </div>

                  {/* Score Badge */}
                  <div className="hidden sm:flex flex-shrink-0 flex-col items-center">
                    <div className={`text-3xl font-bold ${
                      entry.rank === 1
                        ? 'text-yellow-600'
                        : entry.rank === 2
                        ? 'text-gray-600'
                        : entry.rank === 3
                        ? 'text-orange-600'
                        : 'text-ocean-blue'
                    }`}>
                      {entry.total_score}
                    </div>
                    <div className="text-xs text-deep-blue/50">points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        {leaderboard.length > 0 && (
          <div className="mt-6 text-center text-sm text-deep-blue/60">
            Showing {leaderboard.length} {leaderboard.length === 1 ? 'entry' : 'entries'} • Rankings update automatically every 30 seconds
          </div>
        )}
      </div>
    </div>
  )
}
