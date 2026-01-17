'use client'

import React from 'react'
import { Check, X, Clock, Users } from 'lucide-react'
import type { QuizRevealPayload } from '@/lib/live-quiz/types'
import { getPointsBreakdown } from '@/lib/live-quiz/scoring'

interface AnswerFeedbackProps {
  revealData: QuizRevealPayload
  selectedAnswer: string | null
  timeTakenMs: number
  timeLimitMs: number
  totalScore: number
}

export function AnswerFeedback({
  revealData,
  selectedAnswer,
  timeTakenMs,
  timeLimitMs,
  totalScore,
}: AnswerFeedbackProps) {
  const isCorrect = selectedAnswer === revealData.correctAnswer
  const didAnswer = selectedAnswer !== null

  const pointsBreakdown = getPointsBreakdown(isCorrect, timeTakenMs, timeLimitMs)

  const getOptionBarWidth = (option: string) => {
    const count = revealData.stats[option as keyof typeof revealData.stats] as number
    const total = revealData.stats.total
    return total > 0 ? (count / total) * 100 : 0
  }

  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: '#fcf6eb' }}>
      <div className="max-w-md mx-auto">
        {/* Result Banner */}
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{
            backgroundColor: '#FDFBF7',
            border: '3px solid #eee0d2',
          }}
        >
          <div className="flex items-center justify-center mb-4">
            {isCorrect ? (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#e0f2fe', border: '3px solid #0ea5e9' }}
              >
                <Check className="w-12 h-12" style={{ color: '#0284c7' }} />
              </div>
            ) : didAnswer ? (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#fef2f2', border: '3px solid #fca5a5' }}
              >
                <X className="w-12 h-12" style={{ color: '#b91c1c' }} />
              </div>
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#f3f4f6', border: '3px solid #d1d5db' }}
              >
                <Clock className="w-12 h-12" style={{ color: '#6b7280' }} />
              </div>
            )}
          </div>
          <h2
            className="font-dancing text-4xl italic mb-2"
            style={{ color: isCorrect ? '#0284c7' : didAnswer ? '#b91c1c' : '#6b7280' }}
          >
            {isCorrect ? 'Correct!' : didAnswer ? 'Oops!' : "Time's up!"}
          </h2>
          {didAnswer && !isCorrect && (
            <p className="text-deep-blue/70 text-lg">
              The correct answer was <span className="font-bold text-ocean-blue">{revealData.correctAnswer}</span>
            </p>
          )}
          {isCorrect && (
            <p className="text-lg font-semibold text-ocean-blue">
              +{pointsBreakdown.total} points
            </p>
          )}
        </div>

        {/* Points Breakdown */}
        {isCorrect && (
          <div
            className="rounded-2xl shadow-sm p-5 mb-4"
            style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}
          >
            <h3 className="font-semibold text-deep-blue mb-4">Points Earned</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-deep-blue/70">Base points</span>
                <span className="font-semibold">+{pointsBreakdown.base}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-deep-blue/70">Speed bonus</span>
                <span className="font-semibold text-ocean-blue">+{pointsBreakdown.timeBonus}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg" style={{ borderColor: '#eee0d2' }}>
                <span>Total</span>
                <span className="text-ocean-blue">+{pointsBreakdown.total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Answer Distribution */}
        <div
          className="rounded-2xl shadow-sm p-5 mb-4"
          style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-deep-blue">How Everyone Answered</h3>
            <div className="flex items-center gap-1 text-sm text-deep-blue/60">
              <Users className="w-4 h-4" />
              <span>{revealData.stats.total}</span>
            </div>
          </div>
          <p className="text-sm text-deep-blue/60 mb-4">
            Correct answer: <span className="font-semibold text-ocean-blue">{revealData.correctAnswer}</span>
          </p>
          <div className="space-y-5">
            {(['A', 'B', 'C', 'D'] as const).map((option) => {
              const count = revealData.stats[option] as number
              const percentage = getOptionBarWidth(option)
              const isCorrectAnswer = option === revealData.correctAnswer
              const isUserAnswer = option === selectedAnswer

              return (
                <div key={option}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: isCorrectAnswer ? '#e0f2fe' : isUserAnswer && !isCorrect ? '#fef2f2' : '#f3f4f6',
                          color: isCorrectAnswer ? '#0284c7' : isUserAnswer && !isCorrect ? '#b91c1c' : '#6b7280',
                          border: isCorrectAnswer ? '2px solid #0ea5e9' : isUserAnswer && !isCorrect ? '2px solid #f87171' : '2px solid #d1d5db'
                        }}
                      >
                        {option}
                      </span>
                      {isCorrectAnswer && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                          Correct
                        </span>
                      )}
                      {isUserAnswer && !isCorrect && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef2f2', color: '#b91c1c' }}>
                          Your answer
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-deep-blue/70">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: '#eee0d2' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(percentage, 2)}%`,
                        backgroundColor: isCorrectAnswer ? '#0ea5e9' : isUserAnswer && !isCorrect ? '#f87171' : '#d1d5db'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Score */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}
        >
          <p className="text-sm text-deep-blue/70 mb-1">Your Total Score</p>
          <p className="text-4xl font-bold text-ocean-blue">{totalScore}</p>
        </div>
      </div>
    </div>
  )
}
