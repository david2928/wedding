'use client'

import React from 'react'
import { LiveTimer } from './LiveTimer'
import type { QuizQuestionPayload } from '@/lib/live-quiz/types'

interface QuestionViewProps {
  question: QuizQuestionPayload
  questionNumber: number
  totalQuestions: number
  selectedAnswer: string | null
  onSelectAnswer: (answer: string) => void
  disabled?: boolean
  onTimeUp?: () => void
}

export function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onSelectAnswer,
  disabled = false,
  onTimeUp,
}: QuestionViewProps) {
  const options = ['A', 'B', 'C', 'D'] as const

  return (
    <div className="min-h-screen py-6 px-4" style={{ backgroundColor: '#fcf6eb' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header with timer */}
        <div
          className="rounded-xl shadow-sm p-4 mb-4"
          style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-deep-blue/70">
              Question {questionNumber} of {totalQuestions}
            </span>
            {selectedAnswer && (
              <span className="text-sm text-ocean-blue font-medium">
                Answer locked in!
              </span>
            )}
          </div>
          <LiveTimer
            startedAt={question.startedAt}
            timeLimitSeconds={question.timeLimitSeconds}
            onTimeUp={onTimeUp}
            size="md"
          />
        </div>

        {/* Question */}
        <div
          className="rounded-xl shadow-lg p-6 mb-6"
          style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}
        >
          <h2 className="text-xl md:text-2xl font-semibold text-deep-blue text-center">
            {question.question}
          </h2>
        </div>

        {/* Answer options - matching quiz page style */}
        <div className="space-y-3">
          {options.map((option) => {
            const optionText = question.options[option]
            const isSelected = selectedAnswer === option

            return (
              <button
                key={option}
                onClick={() => !disabled && !selectedAnswer && onSelectAnswer(option)}
                disabled={disabled || !!selectedAnswer}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-ocean-blue bg-ocean-blue/10'
                    : 'border-gray-200 hover:border-ocean-blue/50'
                } ${disabled || selectedAnswer ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
                style={{ backgroundColor: isSelected ? undefined : '#FDFBF7' }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-lg ${
                    isSelected
                      ? 'border-ocean-blue bg-ocean-blue text-white'
                      : 'border-gray-300 text-deep-blue/70'
                  }`}>
                    {option}
                  </div>
                  <span className={`text-lg ${isSelected ? 'text-deep-blue font-medium' : 'text-deep-blue/80'}`}>
                    {optionText}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {!selectedAnswer && !disabled && (
          <p className="text-center text-sm text-deep-blue/60 mt-4">
            Tap an answer to lock it in. You cannot change it!
          </p>
        )}
      </div>
    </div>
  )
}
