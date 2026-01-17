'use client'

import React from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { LiveLeaderboard } from './LiveLeaderboard'
import type { ParticipantRanking } from '@/lib/live-quiz/types'
import { Button } from '@/components/ui/button'

interface FinalResultsProps {
  rankings: ParticipantRanking[]
  currentPartyId?: string
  totalParticipants: number
  onClose?: () => void
}

export function FinalResults({
  rankings,
  currentPartyId,
  totalParticipants,
  onClose,
}: FinalResultsProps) {
  const currentRanking = rankings.find((r) => r.partyId === currentPartyId)
  const topThree = rankings.slice(0, 3)

  const getPodiumIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-12 h-12 text-yellow-500" />
    if (rank === 2) return <Medal className="w-10 h-10 text-gray-400" />
    if (rank === 3) return <Award className="w-10 h-10 text-orange-500" />
    return null
  }

  const getPodiumStyle = (rank: number) => {
    if (rank === 1) return { backgroundColor: '#fef9c3', height: '8rem' }
    if (rank === 2) return { backgroundColor: '#f3f4f6', height: '6rem' }
    if (rank === 3) return { backgroundColor: '#ffedd5', height: '5rem' }
    return { backgroundColor: '#e5e7eb', height: '4rem' }
  }

  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: '#fcf6eb' }}>
      <div className="max-w-2xl mx-auto">
        {/* Celebration Header */}
        <div className="text-center mb-8">
          <img
            src="/android-chrome-192x192.png"
            alt="C❤️D Logo"
            className="w-20 h-20 mx-auto mb-4"
          />
          <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue mb-2">
            Quiz Complete!
          </h1>
          <p className="text-deep-blue/70">
            {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''} competed
          </p>
        </div>

        {/* Podium */}
        {topThree.length > 0 && (
          <div
            className="rounded-2xl shadow-lg p-6 mb-6"
            style={{ backgroundColor: '#FDFBF7', border: '3px solid #eee0d2' }}
          >
            <div className="flex items-end justify-center gap-4 mb-6">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center flex-1 max-w-[120px]">
                  <div className="mb-2">{getPodiumIcon(2)}</div>
                  <p className="font-semibold text-deep-blue text-center text-sm truncate w-full">
                    {topThree[1].partyName}
                  </p>
                  <p className="text-xl font-bold text-gray-600 mb-2">
                    {topThree[1].totalScore}
                  </p>
                  <div
                    className="w-full rounded-t-lg flex items-center justify-center"
                    style={getPodiumStyle(2)}
                  >
                    <span className="text-2xl font-bold text-gray-500">2</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center flex-1 max-w-[140px]">
                  <div className="mb-2">{getPodiumIcon(1)}</div>
                  <p className="font-semibold text-deep-blue text-center truncate w-full">
                    {topThree[0].partyName}
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 mb-2">
                    {topThree[0].totalScore}
                  </p>
                  <div
                    className="w-full rounded-t-lg flex items-center justify-center"
                    style={getPodiumStyle(1)}
                  >
                    <span className="text-3xl font-bold text-yellow-600">1</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center flex-1 max-w-[120px]">
                  <div className="mb-2">{getPodiumIcon(3)}</div>
                  <p className="font-semibold text-deep-blue text-center text-sm truncate w-full">
                    {topThree[2].partyName}
                  </p>
                  <p className="text-xl font-bold text-orange-500 mb-2">
                    {topThree[2].totalScore}
                  </p>
                  <div
                    className="w-full rounded-t-lg flex items-center justify-center"
                    style={getPodiumStyle(3)}
                  >
                    <span className="text-2xl font-bold text-orange-400">3</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Your Result */}
        {currentRanking && (
          <div className="bg-ocean-blue text-white rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Your Final Rank</p>
                <p className="text-3xl font-bold">#{currentRanking.rank}</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">Final Score</p>
                <p className="text-3xl font-bold">{currentRanking.totalScore}</p>
              </div>
            </div>
            {currentRanking.hasGamesBonus && (
              <div className="mt-3 text-white/90 text-sm">
                Includes +200 Games Completion Bonus!
              </div>
            )}
          </div>
        )}

        {/* Full Leaderboard */}
        <div
          className="rounded-2xl shadow-lg p-6"
          style={{ backgroundColor: '#FDFBF7', border: '3px solid #eee0d2' }}
        >
          <h2 className="font-semibold text-deep-blue text-lg mb-4">Full Leaderboard</h2>
          <LiveLeaderboard
            rankings={rankings}
            currentPartyId={currentPartyId}
            maxItems={20}
          />
        </div>

        {onClose && (
          <div className="mt-6">
            <Button
              onClick={onClose}
              className="w-full bg-ocean-blue hover:bg-ocean-blue/90"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
