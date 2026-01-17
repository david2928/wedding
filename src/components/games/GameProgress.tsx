'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Check } from 'lucide-react'

interface GameProgressProps {
  completed: number
  total: number
  activeGamesCount: number
}

const GameProgress: React.FC<GameProgressProps> = ({ completed, total, activeGamesCount }) => {
  const percentage = activeGamesCount > 0 ? (completed / activeGamesCount) * 100 : 0
  const allActiveGamesComplete = completed >= activeGamesCount

  return (
    <div className="rounded-2xl shadow-2xl p-8 mb-8" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
      <div className="text-center mb-6">
        <h2 className="font-dancing text-3xl italic text-ocean-blue mb-3">
          Your Progress
        </h2>
        <div className="font-poppins text-4xl font-semibold text-ocean-blue">
          {completed} / {activeGamesCount}
        </div>
      </div>

      <Progress value={percentage} className="h-3 mb-6" />

      <p className="text-center text-base text-deep-blue/70">
        {allActiveGamesComplete ? (
          <span className="text-green-600 font-medium">
            All games completed! +200 bonus points for the Grand Prize Quiz!
          </span>
        ) : (
          <span>
            Complete <strong className="text-ocean-blue">{activeGamesCount - completed} more</strong> {activeGamesCount - completed === 1 ? 'game' : 'games'} to earn bonus points
          </span>
        )}
      </p>
    </div>
  )
}

export default GameProgress
