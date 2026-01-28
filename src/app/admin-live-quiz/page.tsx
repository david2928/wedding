'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Eye, EyeOff, Plus, Trash2, Users } from 'lucide-react'
import { useLiveQuizChannel } from '@/hooks/useLiveQuizChannel'
import { AdminControls } from '@/components/live-quiz/AdminControls'
import { LiveLeaderboard } from '@/components/live-quiz/LiveLeaderboard'
import type { Tables } from '@/lib/supabase/types'
import type {
  AdminQuizState,
  QuestionWithOptions,
  LiveQuizEvent,
  ParticipantRanking,
  AnswerStats,
} from '@/lib/live-quiz/types'

type QuizQuestion = Tables<'quiz_questions'>
type LiveQuizSession = Tables<'live_quiz_sessions'>
type LiveQuizParticipant = Tables<'live_quiz_participants'>

const ADMIN_PASSWORD = 'wedding2026'
const TIME_LIMIT_SECONDS = 30
const AUTO_REVEAL_BUFFER_MS = 1000 // 1 second buffer after timer expires

export default function AdminLiveQuizPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const autoRevealTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const questionStartTimeRef = useRef<string | null>(null)
  const stateRef = useRef<AdminQuizState | null>(null)

  const [selectedQuestionSet, setSelectedQuestionSet] = useState<'test' | 'production'>('test')

  const [state, setState] = useState<AdminQuizState>({
    status: 'idle',
    session: null,
    questions: [],
    currentQuestionIndex: 0,
    participants: [],
    answerCount: 0,
    stats: null,
    rankings: [],
  })

  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const handleEvent = useCallback((event: LiveQuizEvent) => {
    if (event.type === 'quiz:participant_joined') {
      loadParticipants()
    } else if (event.type === 'quiz:answer_count') {
      setState((prev) => ({
        ...prev,
        answerCount: event.payload.answerCount,
      }))
    }
  }, [])

  const { broadcast } = useLiveQuizChannel({
    sessionId: state.session?.id || null,
    onEvent: handleEvent,
    enabled: isAuthenticated && !!state.session,
  })

  const loadParticipants = async (sessionId?: string) => {
    const id = sessionId || state.session?.id
    if (!id) return

    const { data } = await supabase
      .from('live_quiz_participants')
      .select('*')
      .eq('session_id', id)
      .order('total_score', { ascending: false })

    if (data) {
      setState((prev) => ({
        ...prev,
        participants: data,
        rankings: data.map((p, i) => ({
          partyId: p.party_id,
          partyName: p.party_name,
          totalScore: p.total_score || 0,
          correctAnswers: p.correct_answers || 0,
          hasGamesBonus: p.has_games_bonus || false,
          rank: i + 1,
        })),
      }))
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadActiveSession()
      loadQuestions()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!state.session) return

    // Poll for participants every 3 seconds when waiting
    const interval = setInterval(() => {
      loadParticipants()
    }, 3000)

    return () => clearInterval(interval)
  }, [state.session?.id])

  // Auto-reveal when timer expires
  useEffect(() => {
    // Clear any existing timeout
    if (autoRevealTimeoutRef.current) {
      clearTimeout(autoRevealTimeoutRef.current)
      autoRevealTimeoutRef.current = null
    }

    // Only set auto-reveal when in question status
    if (state.status !== 'question' || !questionStartTimeRef.current) {
      return
    }

    const startTime = new Date(questionStartTimeRef.current).getTime()
    const timeLimitMs = TIME_LIMIT_SECONDS * 1000
    const elapsed = Date.now() - startTime
    const remaining = timeLimitMs - elapsed + AUTO_REVEAL_BUFFER_MS

    if (remaining > 0) {
      autoRevealTimeoutRef.current = setTimeout(() => {
        // Trigger auto-reveal
        handleAutoReveal()
      }, remaining)
    } else {
      // Time already expired, reveal immediately
      handleAutoReveal()
    }

    return () => {
      if (autoRevealTimeoutRef.current) {
        clearTimeout(autoRevealTimeoutRef.current)
        autoRevealTimeoutRef.current = null
      }
    }
  }, [state.status, state.currentQuestionIndex])

  // Note: Removed early reveal - questions now always run for full duration

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setError(null)
    } else {
      setError('Incorrect password')
    }
  }

  const loadActiveSession = async () => {
    setLoading(true)
    const { data: sessions } = await supabase
      .from('live_quiz_sessions')
      .select('*')
      .in('status', ['waiting', 'active', 'showing_answer'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (sessions && sessions.length > 0) {
      const session = sessions[0]
      setState((prev) => ({
        ...prev,
        session,
        status:
          session.status === 'waiting'
            ? 'waiting'
            : session.status === 'showing_answer'
            ? 'revealing'
            : 'question',
        currentQuestionIndex: session.current_question_index || 0,
      }))
      loadParticipants(session.id)
    }
    setLoading(false)
  }

  const loadQuestions = async (questionSet?: 'test' | 'production') => {
    const setToLoad = questionSet || selectedQuestionSet
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('is_active', true)
      .eq('question_set', setToLoad)
      .order('display_order')

    if (data) {
      const questions: QuestionWithOptions[] = data.map((q) => ({
        id: q.id,
        question: q.question,
        options: {
          A: q.option_a,
          B: q.option_b,
          C: q.option_c,
          D: q.option_d,
        },
        correctAnswer: q.correct_answer,
        displayOrder: q.display_order,
        imageUrl: q.image_url || undefined,
      }))
      setState((prev) => ({ ...prev, questions }))
    }
  }

  const handleCreateSession = async () => {
    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('live_quiz_sessions')
        .insert({
          status: 'waiting',
          current_question_index: 0,
          time_limit_seconds: 30,
          question_set: selectedQuestionSet,
        })
        .select()
        .single()

      if (error) throw error

      setState((prev) => ({
        ...prev,
        session: data,
        status: 'waiting',
        participants: [],
        answerCount: 0,
        rankings: [],
      }))
    } catch (err) {
      console.error('Error creating session:', err)
      setError('Failed to create session')
    }
    setActionLoading(false)
  }

  const handleDeleteSession = async () => {
    if (!state.session) return
    if (!confirm('Are you sure you want to delete this session?')) return

    setActionLoading(true)
    try {
      await supabase.from('live_quiz_sessions').delete().eq('id', state.session.id)
      setState((prev) => ({
        ...prev,
        session: null,
        status: 'idle',
        participants: [],
        answerCount: 0,
        rankings: [],
      }))
    } catch (err) {
      console.error('Error deleting session:', err)
    }
    setActionLoading(false)
  }

  const handleStart = async () => {
    if (!state.session || state.questions.length === 0) return

    setActionLoading(true)
    try {
      const firstQuestion = state.questions[0]
      const now = new Date().toISOString()

      // Store the question start time for auto-reveal
      questionStartTimeRef.current = now

      await supabase
        .from('live_quiz_sessions')
        .update({
          status: 'active',
          started_at: now,
          current_question_index: 0,
          current_question_id: firstQuestion.id,
          question_started_at: now,
        })
        .eq('id', state.session.id)

      setState((prev) => ({
        ...prev,
        status: 'question',
        currentQuestionIndex: 0,
        answerCount: 0,
      }))

      broadcast({
        type: 'quiz:started',
        payload: {
          sessionId: state.session.id,
          totalQuestions: state.questions.length,
        },
      })

      broadcast({
        type: 'quiz:question',
        payload: {
          index: 0,
          questionId: firstQuestion.id,
          question: firstQuestion.question,
          options: firstQuestion.options,
          startedAt: now,
          timeLimitSeconds: TIME_LIMIT_SECONDS,
          imageUrl: firstQuestion.imageUrl,
        },
      })
    } catch (err) {
      console.error('Error starting quiz:', err)
    }
    setActionLoading(false)
  }

  // Auto-reveal function (called by timer)
  const handleAutoReveal = async () => {
    // Use stateRef to get current state values since this is called from a timeout
    const currentState = stateRef.current
    if (!currentState) return

    const session = currentState.session
    const questions = currentState.questions
    const currentIndex = currentState.currentQuestionIndex

    if (!session || currentState.status !== 'question') return

    try {
      const currentQuestion = questions[currentIndex]
      if (!currentQuestion) return

      // Get answer stats
      const { data: answers } = await supabase
        .from('live_quiz_answers')
        .select('*')
        .eq('session_id', session.id)
        .eq('question_id', currentQuestion.id)

      const stats: AnswerStats = {
        total: answers?.length || 0,
        A: answers?.filter((a) => a.answer === 'A').length || 0,
        B: answers?.filter((a) => a.answer === 'B').length || 0,
        C: answers?.filter((a) => a.answer === 'C').length || 0,
        D: answers?.filter((a) => a.answer === 'D').length || 0,
        correctCount: answers?.filter((a) => a.is_correct).length || 0,
        averageTimeMs:
          answers && answers.length > 0
            ? answers.reduce((sum, a) => sum + (a.time_taken_ms || 0), 0) / answers.length
            : 0,
      }

      await supabase
        .from('live_quiz_sessions')
        .update({ status: 'showing_answer' })
        .eq('id', session.id)

      setState((prev) => ({
        ...prev,
        status: 'revealing',
        stats,
      }))

      broadcast({
        type: 'quiz:reveal',
        payload: {
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          index: state.currentQuestionIndex,
          correctAnswer: currentQuestion.correctAnswer,
          stats,
        },
      })
    } catch (err) {
      console.error('Error auto-revealing answer:', err)
    }
  }

  const handleRevealAnswer = async () => {
    if (!state.session) return

    // Clear auto-reveal timer since we're manually revealing
    if (autoRevealTimeoutRef.current) {
      clearTimeout(autoRevealTimeoutRef.current)
      autoRevealTimeoutRef.current = null
    }

    setActionLoading(true)
    try {
      const currentQuestion = state.questions[state.currentQuestionIndex]

      // Get answer stats
      const { data: answers } = await supabase
        .from('live_quiz_answers')
        .select('*')
        .eq('session_id', state.session.id)
        .eq('question_id', currentQuestion.id)

      const stats: AnswerStats = {
        total: answers?.length || 0,
        A: answers?.filter((a) => a.answer === 'A').length || 0,
        B: answers?.filter((a) => a.answer === 'B').length || 0,
        C: answers?.filter((a) => a.answer === 'C').length || 0,
        D: answers?.filter((a) => a.answer === 'D').length || 0,
        correctCount: answers?.filter((a) => a.is_correct).length || 0,
        averageTimeMs:
          answers && answers.length > 0
            ? answers.reduce((sum, a) => sum + (a.time_taken_ms || 0), 0) / answers.length
            : 0,
      }

      await supabase
        .from('live_quiz_sessions')
        .update({ status: 'showing_answer' })
        .eq('id', state.session.id)

      setState((prev) => ({
        ...prev,
        status: 'revealing',
        stats,
      }))

      broadcast({
        type: 'quiz:reveal',
        payload: {
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          index: state.currentQuestionIndex,
          correctAnswer: currentQuestion.correctAnswer,
          stats,
        },
      })
    } catch (err) {
      console.error('Error revealing answer:', err)
    }
    setActionLoading(false)
  }

  const handleShowLeaderboard = async () => {
    if (!state.session) return

    setActionLoading(true)
    try {
      await loadParticipants()

      setState((prev) => ({
        ...prev,
        status: 'leaderboard',
      }))

      broadcast({
        type: 'quiz:leaderboard',
        payload: {
          rankings: state.rankings,
        },
      })
    } catch (err) {
      console.error('Error showing leaderboard:', err)
    }
    setActionLoading(false)
  }

  const handleNextQuestion = async () => {
    if (!state.session) return

    const nextIndex = state.currentQuestionIndex + 1
    if (nextIndex >= state.questions.length) return

    setActionLoading(true)
    try {
      const nextQuestion = state.questions[nextIndex]
      const now = new Date().toISOString()

      // Store the question start time for auto-reveal
      questionStartTimeRef.current = now

      await supabase
        .from('live_quiz_sessions')
        .update({
          status: 'active',
          current_question_index: nextIndex,
          current_question_id: nextQuestion.id,
          question_started_at: now,
        })
        .eq('id', state.session.id)

      setState((prev) => ({
        ...prev,
        status: 'question',
        currentQuestionIndex: nextIndex,
        answerCount: 0,
        stats: null,
      }))

      broadcast({
        type: 'quiz:question',
        payload: {
          index: nextIndex,
          questionId: nextQuestion.id,
          question: nextQuestion.question,
          options: nextQuestion.options,
          startedAt: now,
          timeLimitSeconds: TIME_LIMIT_SECONDS,
          imageUrl: nextQuestion.imageUrl,
        },
      })
    } catch (err) {
      console.error('Error moving to next question:', err)
    }
    setActionLoading(false)
  }

  const handleEndQuiz = async () => {
    if (!state.session) return

    setActionLoading(true)
    try {
      await loadParticipants()

      await supabase
        .from('live_quiz_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', state.session.id)

      setState((prev) => ({
        ...prev,
        status: 'ended',
      }))

      broadcast({
        type: 'quiz:ended',
        payload: {
          winners: state.rankings.slice(0, 3),
          totalParticipants: state.participants.length,
        },
      })
    } catch (err) {
      console.error('Error ending quiz:', err)
    }
    setActionLoading(false)
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <h1 className="font-dancing text-3xl text-ocean-blue mb-2">Live Quiz Admin</h1>
              <p className="text-sm text-deep-blue/60 font-normal">Control the live quiz session</p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Enter admin password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-deep-blue/50 hover:text-deep-blue"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={!password}
                className="w-full bg-ocean-blue hover:bg-navy-blue"
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-dancing text-4xl text-ocean-blue mb-2">Live Quiz Admin</h1>
            <p className="text-deep-blue/60">Control the live quiz session</p>
          </div>
          <Button
            onClick={() => setIsAuthenticated(false)}
            variant="outline"
            className="border-ocean-blue text-ocean-blue"
          >
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Session Management */}
            {!state.session ? (
              <Card>
                <CardHeader>
                  <CardTitle>Create Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-deep-blue/70 mb-4">
                    No active session. Create a new session to start accepting participants.
                  </p>

                  {/* Question Set Selector */}
                  <div className="mb-4">
                    <Label className="text-sm text-deep-blue/70 mb-2 block">Question Set</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={selectedQuestionSet === 'test' ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedQuestionSet('test')
                          loadQuestions('test')
                        }}
                        className={selectedQuestionSet === 'test' ? 'bg-ocean-blue hover:bg-navy-blue' : ''}
                      >
                        Test
                      </Button>
                      <Button
                        type="button"
                        variant={selectedQuestionSet === 'production' ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedQuestionSet('production')
                          loadQuestions('production')
                        }}
                        className={selectedQuestionSet === 'production' ? 'bg-ocean-blue hover:bg-navy-blue' : ''}
                      >
                        Big Night
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-deep-blue/60 mb-4">
                    {state.questions.length} questions loaded ({selectedQuestionSet})
                  </p>
                  <Button
                    onClick={handleCreateSession}
                    disabled={actionLoading || state.questions.length === 0}
                    className="w-full bg-ocean-blue hover:bg-navy-blue"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create New Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Session Info */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Session Active</CardTitle>
                    <Button
                      onClick={handleDeleteSession}
                      disabled={actionLoading}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-deep-blue/60 mb-1">Session ID</p>
                      <p className="font-mono text-sm text-deep-blue break-all">{state.session.id}</p>
                    </div>
                    <div className="flex items-center gap-2 text-deep-blue">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold">{state.participants.length}</span>
                      <span className="text-deep-blue/60">participants joined</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Controls */}
                <AdminControls
                  state={state}
                  onStart={handleStart}
                  onNextQuestion={handleNextQuestion}
                  onRevealAnswer={handleRevealAnswer}
                  onShowLeaderboard={handleShowLeaderboard}
                  onEndQuiz={handleEndQuiz}
                  loading={actionLoading}
                />
              </>
            )}

            {/* Current Question Preview */}
            {state.session && state.status !== 'idle' && state.status !== 'waiting' && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Question</CardTitle>
                </CardHeader>
                <CardContent>
                  {state.questions[state.currentQuestionIndex] && (
                    <div>
                      <p className="font-medium text-deep-blue mb-3">
                        {state.questions[state.currentQuestionIndex].question}
                      </p>
                      <div className="space-y-2">
                        {(['A', 'B', 'C', 'D'] as const).map((option) => {
                          const isCorrect =
                            option === state.questions[state.currentQuestionIndex].correctAnswer
                          return (
                            <div
                              key={option}
                              className={`p-2 rounded-lg text-sm ${
                                isCorrect ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-deep-blue/70'
                              }`}
                            >
                              <span className="font-medium">{option}:</span>{' '}
                              {state.questions[state.currentQuestionIndex].options[option]}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Leaderboard */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Live Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <LiveLeaderboard rankings={state.rankings} maxItems={15} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
