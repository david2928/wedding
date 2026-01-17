'use client'

import React from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import type { ParticipantRanking } from '@/lib/live-quiz/types'

interface LiveLeaderboardProps {
  rankings: ParticipantRanking[]
  currentPartyId?: string
  maxItems?: number
  showBonus?: boolean
}

export function LiveLeaderboard({
  rankings,
  currentPartyId,
  maxItems = 10,
  showBonus = true,
}: LiveLeaderboardProps) {
  const displayRankings = rankings.slice(0, maxItems)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />
    return <span className="w-6 h-6 flex items-center justify-center text-lg font-bold text-deep-blue/50">#{rank}</span>
  }

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return {
        backgroundColor: '#e0f2fe',
        border: '2px solid #0ea5e9',
      }
    }
    if (rank === 1) {
      return {
        backgroundColor: '#fef9c3',
        border: '2px solid #facc15',
      }
    }
    if (rank === 2) {
      return {
        backgroundColor: '#f3f4f6',
        border: '2px solid #d1d5db',
      }
    }
    if (rank === 3) {
      return {
        backgroundColor: '#ffedd5',
        border: '2px solid #fdba74',
      }
    }
    return {
      backgroundColor: '#FDFBF7',
      border: '2px solid #eee0d2',
    }
  }

  if (rankings.length === 0) {
    return (
      <div className="text-center py-8 text-deep-blue/60">
        No participants yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {displayRankings.map((entry) => {
        const isCurrentUser = entry.partyId === currentPartyId

        return (
          <div
            key={entry.partyId}
            className="rounded-xl p-3 md:p-4 transition-all"
            style={getRankStyle(entry.rank, isCurrentUser)}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold truncate ${isCurrentUser ? 'text-ocean-blue' : 'text-deep-blue'}`}>
                    {entry.partyName}
                    {isCurrentUser && ' (You)'}
                  </span>
                  {showBonus && entry.hasGamesBonus && (
                    <span className="text-xs bg-ocean-blue/10 text-ocean-blue px-2 py-0.5 rounded-full font-medium">
                      +200
                    </span>
                  )}
                </div>
                <div className="text-sm text-deep-blue/60">
                  {entry.correctAnswers} correct
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <div className={`text-2xl font-bold ${
                  isCurrentUser ? 'text-ocean-blue' :
                  entry.rank === 1 ? 'text-yellow-600' :
                  entry.rank === 2 ? 'text-gray-600' :
                  entry.rank === 3 ? 'text-orange-500' :
                  'text-deep-blue'
                }`}>
                  {entry.totalScore}
                </div>
                <div className="text-xs text-deep-blue/50">points</div>
              </div>
            </div>
          </div>
        )
      })}

      {rankings.length > maxItems && (
        <div className="text-center text-sm text-deep-blue/60 py-2">
          +{rankings.length - maxItems} more participants
        </div>
      )}
    </div>
  )
}
