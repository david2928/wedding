'use client'

import React from 'react'
import { Loader2, Users } from 'lucide-react'

interface WaitingRoomProps {
  participantCount: number
  partyName?: string
  hasGamesBonus?: boolean
}

export function WaitingRoom({
  participantCount,
  partyName,
  hasGamesBonus,
}: WaitingRoomProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
      <div
        className="rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        style={{ backgroundColor: '#FDFBF7', border: '3px solid #eee0d2' }}
      >
        <div className="mb-6">
          <img
            src="/android-chrome-192x192.png"
            alt="C❤️D Logo"
            className="w-20 h-20 mx-auto mb-4"
          />
          <h1 className="font-dancing text-4xl italic text-ocean-blue mb-2">
            Live Quiz
          </h1>
          <p className="text-deep-blue/70">
            Waiting for the host to start...
          </p>
        </div>

        {partyName && (
          <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#fcf6eb' }}>
            <p className="text-sm text-deep-blue/60 mb-1">Playing as</p>
            <p className="font-semibold text-deep-blue text-lg">{partyName}</p>
            {hasGamesBonus && (
              <p className="text-sm text-ocean-blue mt-2 font-medium">
                +200 Games Completion Bonus!
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-deep-blue/70 mb-6">
          <Users className="w-5 h-5 text-ocean-blue" />
          <span className="font-medium text-ocean-blue">{participantCount}</span>
          <span>participant{participantCount !== 1 ? 's' : ''} ready</span>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-deep-blue/50">
          <Loader2 className="w-4 h-4 animate-spin text-ocean-blue" />
          <span>Get ready...</span>
        </div>
      </div>
    </div>
  )
}
