'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Trophy, Lock, Check, X, Award } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/lib/supabase/types'
import { isDevModeEnabled, enableDevMode } from '@/lib/utils/devMode'

type Party = Tables<'parties'>
type QuizQuestion = Tables<'quiz_questions'>
type QuizSubmission = Tables<'quiz_submissions'>
type GameStation = Tables<'game_stations'>

export default function QuizPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [party, setParty] = useState<Party | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [quizSubmission, setQuizSubmission] = useState<QuizSubmission | null>(null)
  const [gamesUnlocked, setGamesUnlocked] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [devMode, setDevMode] = useState(false)

  // Development bypass
  const handleDevBypass = async () => {
    enableDevMode() // Persist in sessionStorage
    setDevMode(true)
    // In dev mode, we'll skip auth and just load data
    await loadData(null as any)
  }

  useEffect(() => {
    // Check if dev mode was previously enabled in this session
    const wasDevModeEnabled = isDevModeEnabled()
    if (wasDevModeEnabled) {
      setDevMode(true)
      loadData(null as any)
      return
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadData(session.user)
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const loadData = async (currentUser?: User | null) => {
    const activeUser = currentUser ?? user

    try {
      setLoading(true)

      // Get party
      let partyData: Party | null = null

      if (devMode || process.env.NODE_ENV === 'development') {
        // Dev mode: Get any party for testing
        const { data: anyParty } = await supabase
          .from('parties')
          .select('*')
          .limit(1)
          .single()

        if (anyParty) {
          partyData = anyParty
          setParty(anyParty)
        }
      } else if (activeUser) {
        // Production: Get party for authenticated user
        const { data: userParty, error: partyError } = await supabase
          .from('parties')
          .select('*')
          .eq('google_user_id', activeUser.id)
          .single()

        if (partyError || !userParty) {
          console.error('Error loading party:', partyError)
          setLoading(false)
          return
        }

        partyData = userParty
        setParty(userParty)
      }

      if (!partyData) {
        setLoading(false)
        return
      }

      // Check if all active games are completed
      const { data: stations } = await supabase
        .from('game_stations')
        .select('*')
        .eq('is_active', true)

      const { data: completions } = await supabase
        .from('game_completions')
        .select('*')
        .eq('party_id', partyData.id)

      const activeStations = stations || []
      const completedStationIds = (completions || []).map(c => c.station_id)
      const allComplete = activeStations.every(s => completedStationIds.includes(s.station_id))

      setGamesUnlocked(allComplete)

      if (!allComplete) {
        setLoading(false)
        return
      }

      // Check if quiz already submitted
      const { data: submission } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('party_id', partyData.id)
        .maybeSingle()

      if (submission) {
        setQuizSubmission(submission)
        setShowResults(true)
        setLoading(false)
        return
      }

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (questionsError) {
        console.error('Error loading questions:', questionsError)
      } else {
        setQuestions(questionsData || [])
        setStartTime(new Date())
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/quiz`
        }
      })
      if (error) throw error
    } catch (err) {
      console.error('Error signing in:', err)
      setSigningIn(false)
    }
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!party || !startTime) return

    try {
      setSubmitting(true)

      // Calculate score
      let totalScore = 0
      const answersData: Record<string, string> = {}

      questions.forEach(q => {
        const userAnswer = answers[q.id]
        answersData[q.id] = userAnswer || ''
        if (userAnswer === q.correct_answer) {
          totalScore += q.points || 10
        }
      })

      // Calculate time taken
      const endTime = new Date()
      const timeTakenSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      // Submit to database
      const { data: submissionData, error: submitError } = await supabase
        .from('quiz_submissions')
        .insert({
          party_id: party.id,
          total_score: totalScore,
          total_questions: questions.length,
          time_taken_seconds: timeTakenSeconds,
          answers: answersData,
          completed_at: new Date().toISOString(),
          submitted_by_google_id: user?.id || 'dev-mode-user'
        })
        .select()
        .single()

      if (submitError) {
        throw submitError
      }

      setQuizSubmission(submissionData)
      setShowResults(true)
      setSubmitting(false)

    } catch (err) {
      console.error('Error submitting quiz:', err)
      alert('Failed to submit quiz. Please try again.')
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-dancing text-4xl italic mb-2">Final Quiz</h1>
            <p className="text-white/90">Sign in to continue</p>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-deep-blue mb-2">
              Authentication Required
            </h2>
            <p className="text-deep-blue/70 mb-8">
              Please sign in with Google to take the quiz.
            </p>
            <Button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm py-6 text-lg"
            >
              {signingIn ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : 'Sign in with Google'}
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={handleDevBypass}
                variant="outline"
                className="w-full mt-4"
              >
                Dev Mode Bypass (Testing)
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Games not complete
  if (!gamesUnlocked && !devMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="bg-gray-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-12 h-12 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-deep-blue mb-2">Quiz Locked</h1>
          <p className="text-deep-blue/70 mb-6">
            Complete all active games first to unlock the final quiz!
          </p>
          <Button
            onClick={() => router.push('/games')}
            className="bg-ocean-blue hover:bg-navy-blue"
          >
            Go to Games
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={handleDevBypass}
              variant="outline"
              className="w-full mt-4"
            >
              Dev Mode Bypass (Testing)
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Show results
  if (showResults && quizSubmission) {
    const percentage = questions.length > 0 ? (quizSubmission.total_score / (questions.length * 10)) * 100 : 0
    const minutes = Math.floor((quizSubmission.time_taken_seconds || 0) / 60)
    const seconds = (quizSubmission.time_taken_seconds || 0) % 60

    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-4 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Award className="w-16 h-16 text-white" />
            </div>

            <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue mb-4">
              Quiz Complete!
            </h1>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="text-6xl font-bold text-ocean-blue mb-2">
                {quizSubmission.total_score}
              </div>
              <div className="text-deep-blue/70">
                out of {quizSubmission.total_questions ? quizSubmission.total_questions * 10 : 100} points ({percentage.toFixed(0)}%)
              </div>
              <div className="text-sm text-deep-blue/50 mt-2">
                Time: {minutes}m {seconds}s
              </div>
            </div>

            <p className="text-deep-blue/70 mb-6">
              Great job! Check the leaderboard to see how you rank against other guests.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => router.push('/leaderboard')}
                className="flex-1 bg-ocean-blue hover:bg-navy-blue"
              >
                <Trophy className="w-4 h-4 mr-2" />
                View Leaderboard
              </Button>
              <Button
                onClick={() => router.push('/games')}
                variant="outline"
                className="flex-1 border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white"
              >
                Back to Games
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Quiz questions
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-deep-blue mb-2">No Questions Available</h1>
          <p className="text-deep-blue/70 mb-6">
            The quiz questions haven't been set up yet. Please check back later.
          </p>
          <Button
            onClick={() => router.push('/games')}
            className="bg-ocean-blue hover:bg-navy-blue"
          >
            Back to Games
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const allQuestionsAnswered = questions.every(q => answers[q.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue mb-2">
            Final Quiz
          </h1>
          <p className="text-deep-blue/70">
            Test your knowledge about David & Chanika
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between text-sm text-deep-blue/70 mb-2">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{questions.filter(q => answers[q.id]).length} answered</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-ocean-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-deep-blue mb-6">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((option) => {
                const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof QuizQuestion] as string
                const isSelected = answers[currentQuestion.id] === option

                return (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-ocean-blue bg-ocean-blue/10'
                        : 'border-gray-200 hover:border-ocean-blue/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-ocean-blue bg-ocean-blue text-white'
                          : 'border-gray-300'
                      }`}>
                        {option}
                      </div>
                      <span className={`${isSelected ? 'text-deep-blue font-medium' : 'text-deep-blue/70'}`}>
                        {optionText}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex-1 border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white disabled:opacity-50"
          >
            Previous
          </Button>
          {isLastQuestion ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!allQuestionsAnswered || submitting}
              className="flex-1 bg-ocean-blue hover:bg-navy-blue disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Submit Quiz
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              className="flex-1 bg-ocean-blue hover:bg-navy-blue"
            >
              Next Question
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
