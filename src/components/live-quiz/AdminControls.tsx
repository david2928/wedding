'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Play,
  SkipForward,
  Trophy,
  StopCircle,
  Users,
  Loader2,
} from 'lucide-react'
import type { AdminQuizState } from '@/lib/live-quiz/types'

interface AdminControlsProps {
  state: AdminQuizState
  onStart: () => void
  onNextQuestion: () => void
  onRevealAnswer: () => void
  onShowLeaderboard: () => void
  onEndQuiz: () => void
  loading?: boolean
}

export function AdminControls({
  state,
  onStart,
  onNextQuestion,
  onRevealAnswer,
  onShowLeaderboard,
  onEndQuiz,
  loading = false,
}: AdminControlsProps) {
  const isLastQuestion = state.currentQuestionIndex >= state.questions.length - 1

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      {/* Status */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <p className="text-sm text-deep-blue/60">Status</p>
          <p className="font-semibold text-deep-blue capitalize">{state.status}</p>
        </div>
        <div className="flex items-center gap-2 text-deep-blue/70">
          <Users className="w-5 h-5" />
          <span className="font-medium">{state.participants.length}</span>
          <span className="text-sm">participants</span>
        </div>
      </div>

      {/* Question Progress */}
      {state.status !== 'idle' && state.status !== 'waiting' && (
        <div className="border-b pb-4">
          <p className="text-sm text-deep-blue/60 mb-2">Progress</p>
          <p className="font-semibold text-deep-blue">
            Question {state.currentQuestionIndex + 1} of {state.questions.length}
          </p>
        </div>
      )}

      {/* Control Buttons */}
      <div className="space-y-3">
        {state.status === 'waiting' && (
          <Button
            onClick={onStart}
            disabled={loading || state.participants.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Play className="w-5 h-5 mr-2" />
            )}
            Start Quiz
          </Button>
        )}

        {state.status === 'question' && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-deep-blue mb-2">
              {state.answerCount} / {state.participants.length} answered
            </p>
            {state.answerCount >= state.participants.length && state.participants.length > 0 ? (
              <p className="text-sm text-green-600 font-medium">
                Everyone answered! Revealing...
              </p>
            ) : (
              <p className="text-xs text-deep-blue/50">
                Auto-reveals when timer ends or everyone answers
              </p>
            )}
          </div>
        )}

        {state.status === 'revealing' && !isLastQuestion && (
          <Button
            onClick={onShowLeaderboard}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Trophy className="w-5 h-5 mr-2" />
            )}
            Show Leaderboard
          </Button>
        )}

        {state.status === 'revealing' && isLastQuestion && (
          <Button
            onClick={onEndQuiz}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-lg py-6 text-white"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Trophy className="w-5 h-5 mr-2" />
            )}
            Reveal Winners!
          </Button>
        )}

        {state.status === 'leaderboard' && !isLastQuestion && (
          <Button
            onClick={onNextQuestion}
            disabled={loading}
            className="w-full bg-ocean-blue hover:bg-navy-blue text-lg py-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <SkipForward className="w-5 h-5 mr-2" />
            )}
            Next Question
          </Button>
        )}

        {state.status === 'leaderboard' && isLastQuestion && (
          <Button
            onClick={onEndQuiz}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-lg py-6"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <StopCircle className="w-5 h-5 mr-2" />
            )}
            End Quiz & Show Winners
          </Button>
        )}

        {state.status === 'ended' && (
          <div className="text-center py-4">
            <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <p className="font-semibold text-deep-blue">Quiz Completed!</p>
            <p className="text-sm text-deep-blue/60">Winners have been announced</p>
          </div>
        )}
      </div>

      {/* Stats */}
      {state.stats && state.status === 'revealing' && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-deep-blue mb-2">Answer Stats</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <div key={option} className="bg-gray-50 rounded-lg p-2">
                <p className="font-bold text-deep-blue">{option}</p>
                <p className="text-sm text-deep-blue/70">{state.stats![option]}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-deep-blue/60 mt-2">
            {state.stats.correctCount} correct ({((state.stats.correctCount / state.stats.total) * 100).toFixed(0)}%)
          </p>
        </div>
      )}
    </div>
  )
}
