'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Trophy, Users, Clock, Check, X, Award } from 'lucide-react'
import { useLiveQuizChannel } from '@/hooks/useLiveQuizChannel'
import { calculatePoints, GAMES_COMPLETION_BONUS } from '@/lib/live-quiz/scoring'
import { getPointsBreakdown } from '@/lib/live-quiz/scoring'
import { isDevModeEnabled, enableDevMode } from '@/lib/utils/devMode'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/lib/supabase/types'
import type {
  GuestQuizState,
  LiveQuizEvent,
  ParticipantRanking,
  QuizQuestionPayload,
} from '@/lib/live-quiz/types'

type Party = Tables<'parties'>

export default function QuizPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [party, setParty] = useState<Party | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)

  const questionStartTimeRef = useRef<number | null>(null)
  const timeTakenMsRef = useRef<number>(0)

  const [state, setState] = useState<GuestQuizState>({
    status: 'connecting',
    sessionId: null,
    currentQuestion: null,
    selectedAnswer: null,
    isCorrect: null,
    pointsEarned: 0,
    totalScore: 0,
    rankings: [],
    revealData: null,
    participantCount: 0,
    hasGamesBonus: false,
  })

  const handleEvent = useCallback(
    (event: LiveQuizEvent) => {
      switch (event.type) {
        case 'quiz:started':
          setState((prev) => ({
            ...prev,
            status: 'waiting',
          }))
          break

        case 'quiz:question':
          questionStartTimeRef.current = Date.now()
          setState((prev) => ({
            ...prev,
            status: 'question',
            currentQuestion: event.payload,
            selectedAnswer: null,
            isCorrect: null,
            pointsEarned: 0,
            revealData: null,
          }))
          break

        case 'quiz:reveal':
          setState((prev) => {
            const isCorrect = prev.selectedAnswer === event.payload.correctAnswer
            return {
              ...prev,
              status: 'reveal',
              revealData: event.payload,
              isCorrect,
            }
          })
          break

        case 'quiz:leaderboard':
          setState((prev) => ({
            ...prev,
            status: 'leaderboard',
            rankings: event.payload.rankings,
          }))
          break

        case 'quiz:ended':
          setState((prev) => ({
            ...prev,
            status: 'ended',
            rankings: event.payload.winners,
          }))
          loadFinalRankings()
          break

        case 'quiz:participant_joined':
          setParticipantCount(event.payload.participantCount)
          break

        case 'quiz:answer_count':
          break
      }
    },
    []
  )

  const { broadcast } = useLiveQuizChannel({
    sessionId: state.sessionId,
    onEvent: handleEvent,
    enabled: !!state.sessionId,
  })

  useEffect(() => {
    const checkAuth = async () => {
      const wasDevModeEnabled = isDevModeEnabled()
      if (wasDevModeEnabled) {
        setDevMode(true)
        await loadDevData()
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserData(session.user)
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const loadDevData = async () => {
    try {
      const { data: anyParty } = await supabase.from('parties').select('*').limit(1).single()

      if (anyParty) {
        setParty(anyParty)
        await checkAndJoinSession(anyParty, true)
      }
      setLoading(false)
    } catch (err) {
      console.error('Error in dev mode:', err)
      setLoading(false)
    }
  }

  const loadUserData = async (currentUser: User) => {
    try {
      const { data: userParty } = await supabase
        .from('parties')
        .select('*')
        .eq('google_user_id', currentUser.id)
        .single()

      if (!userParty) {
        setLoading(false)
        return
      }

      setParty(userParty)
      await checkAndJoinSession(userParty, false)
      setLoading(false)
    } catch (err) {
      console.error('Error loading user data:', err)
      setLoading(false)
    }
  }

  const checkAndJoinSession = async (partyData: Party, isDev: boolean) => {
    const { data: sessions } = await supabase
      .from('live_quiz_sessions')
      .select('*')
      .in('status', ['waiting', 'active', 'showing_answer'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (!sessions || sessions.length === 0) {
      setState((prev) => ({
        ...prev,
        status: 'connecting',
      }))
      return
    }

    const session = sessions[0]

    // Check if party completed all games (for bonus)
    const { data: activeStations } = await supabase
      .from('game_stations')
      .select('station_id')
      .eq('is_active', true)

    const { data: completions } = await supabase
      .from('game_completions')
      .select('station_id')
      .eq('party_id', partyData.id)

    const hasGamesBonus =
      activeStations &&
      completions &&
      activeStations.every((s) => completions.some((c) => c.station_id === s.station_id))

    // Check if already joined
    const { data: existingParticipant } = await supabase
      .from('live_quiz_participants')
      .select('*')
      .eq('session_id', session.id)
      .eq('party_id', partyData.id)
      .maybeSingle()

    let participantScore = 0
    let participantHasBonus = hasGamesBonus || false

    if (!existingParticipant) {
      const startingScore = hasGamesBonus ? GAMES_COMPLETION_BONUS : 0
      participantScore = startingScore

      await supabase.from('live_quiz_participants').insert({
        session_id: session.id,
        party_id: partyData.id,
        party_name: partyData.name,
        total_score: startingScore,
        has_games_bonus: hasGamesBonus,
      })

      const { count } = await supabase
        .from('live_quiz_participants')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)

      broadcast({
        type: 'quiz:participant_joined',
        payload: {
          participantCount: count || 1,
          partyName: partyData.name,
        },
      })
    } else {
      participantScore = existingParticipant.total_score || 0
      participantHasBonus = existingParticipant.has_games_bonus || false
    }

    // Recovery: If session is actively showing a question, recover the current state
    if (session.status === 'active' && session.current_question_id && session.question_started_at) {
      // Fetch the current question
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('id', session.current_question_id)
        .single()

      if (questionData) {
        // Check if user already answered this question
        const { data: existingAnswer } = await supabase
          .from('live_quiz_answers')
          .select('*')
          .eq('session_id', session.id)
          .eq('question_id', session.current_question_id)
          .eq('party_id', partyData.id)
          .maybeSingle()

        const currentQuestion: QuizQuestionPayload = {
          index: session.current_question_index || 0,
          questionId: questionData.id,
          question: questionData.question,
          options: {
            A: questionData.option_a,
            B: questionData.option_b,
            C: questionData.option_c,
            D: questionData.option_d,
          },
          startedAt: session.question_started_at,
          timeLimitSeconds: session.time_limit_seconds || 30,
          imageUrl: questionData.image_url || undefined,
        }

        if (existingAnswer) {
          // User already answered - show answered state
          setState((prev) => ({
            ...prev,
            sessionId: session.id,
            status: 'answered',
            currentQuestion,
            selectedAnswer: existingAnswer.answer,
            totalScore: participantScore,
            hasGamesBonus: participantHasBonus,
          }))
        } else {
          // User hasn't answered yet - show question
          setState((prev) => ({
            ...prev,
            sessionId: session.id,
            status: 'question',
            currentQuestion,
            totalScore: participantScore,
            hasGamesBonus: participantHasBonus,
          }))
        }

        const { count } = await supabase
          .from('live_quiz_participants')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id)

        setParticipantCount(count || 0)
        return
      }
    }

    // Default state for waiting or other statuses
    setState((prev) => ({
      ...prev,
      sessionId: session.id,
      status: session.status === 'waiting' ? 'waiting' : 'question',
      totalScore: participantScore,
      hasGamesBonus: participantHasBonus,
    }))

    const { count } = await supabase
      .from('live_quiz_participants')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', session.id)

    setParticipantCount(count || 0)
  }

  const loadFinalRankings = async () => {
    if (!state.sessionId) return

    const { data } = await supabase
      .from('live_quiz_participants')
      .select('*')
      .eq('session_id', state.sessionId)
      .order('total_score', { ascending: false })

    if (data) {
      setState((prev) => ({
        ...prev,
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

  const handleSelectAnswer = async (answer: string) => {
    if (!state.sessionId || !state.currentQuestion || !party || state.selectedAnswer) return

    const timeTaken = questionStartTimeRef.current
      ? Date.now() - questionStartTimeRef.current
      : 30000
    timeTakenMsRef.current = timeTaken

    setState((prev) => ({
      ...prev,
      status: 'answered',
      selectedAnswer: answer,
    }))

    try {
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('correct_answer')
        .eq('id', state.currentQuestion.questionId)
        .single()

      const isCorrect = questionData?.correct_answer === answer
      const points = calculatePoints(isCorrect, timeTaken, 30000)

      await supabase.from('live_quiz_answers').insert({
        session_id: state.sessionId,
        question_id: state.currentQuestion.questionId,
        party_id: party.id,
        answer,
        is_correct: isCorrect,
        time_taken_ms: timeTaken,
        points_earned: points,
      })

      if (points > 0) {
        await supabase.rpc('increment_participant_score', {
          p_session_id: state.sessionId,
          p_party_id: party.id,
          p_points: points,
          p_is_correct: isCorrect,
        })

        setState((prev) => ({
          ...prev,
          totalScore: prev.totalScore + points,
          pointsEarned: points,
        }))
      }

      const { count } = await supabase
        .from('live_quiz_answers')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', state.sessionId)
        .eq('question_id', state.currentQuestion.questionId)

      broadcast({
        type: 'quiz:answer_count',
        payload: {
          questionId: state.currentQuestion.questionId,
          answerCount: count || 0,
        },
      })
    } catch (err) {
      console.error('Error submitting answer:', err)
    }
  }

  const handleDevBypass = async () => {
    enableDevMode()
    setDevMode(true)
    setLoading(true)
    await loadDevData()
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/quiz`,
        },
      })
    } catch (err) {
      console.error('Error signing in:', err)
      setSigningIn(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">Connecting to quiz...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user && !devMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-dancing text-4xl italic mb-2">Live Quiz</h1>
            <p className="text-white/90">Sign in to participate</p>
          </div>
          <div className="p-8 text-center">
            <p className="text-deep-blue/70 mb-8">
              Sign in with Google to join the live quiz with other guests.
            </p>
            <Button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm py-6 text-lg"
            >
              {signingIn ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : 'Sign in with Google'}
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Button onClick={handleDevBypass} variant="outline" className="w-full mt-4">
                Dev Mode Bypass
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // No party found
  if (!party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-deep-blue mb-2">Party Not Found</h1>
          <p className="text-deep-blue/70 mb-6">
            We couldn&apos;t find your party information. Please make sure you&apos;ve RSVP&apos;d first.
          </p>
          <Button onClick={() => router.push('/games')} className="bg-ocean-blue hover:bg-navy-blue">
            Back to Games
          </Button>
        </div>
      </div>
    )
  }

  // No active session - waiting for host
  if (!state.sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <Trophy className="w-16 h-16 text-ocean-blue mx-auto mb-4" />
          <h1 className="font-dancing text-4xl italic text-ocean-blue mb-4">Live Quiz</h1>
          <p className="text-deep-blue/70 mb-6">
            The quiz hasn&apos;t started yet. Please wait for the host to begin the session.
          </p>
          <Button
            onClick={() => checkAndJoinSession(party, devMode)}
            variant="outline"
            className="border-ocean-blue text-ocean-blue"
          >
            Check Again
          </Button>
        </div>
      </div>
    )
  }

  // Waiting room
  if (state.status === 'waiting' || state.status === 'connecting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Trophy className="w-16 h-16 text-ocean-blue mx-auto mb-4" />
          <h1 className="font-dancing text-4xl italic text-ocean-blue mb-2">Live Quiz</h1>
          <p className="text-deep-blue/70 mb-6">Waiting for the host to start...</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-deep-blue/60 mb-1">Playing as</p>
            <p className="font-semibold text-deep-blue text-lg">{party.name}</p>
            {state.hasGamesBonus && (
              <p className="text-sm text-ocean-blue mt-2 font-medium">
                +200 Games Completion Bonus!
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-deep-blue/70 mb-4">
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

  // Question view
  if (state.status === 'question' || state.status === 'answered') {
    if (!state.currentQuestion) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue" />
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue mb-2">
              Live Quiz
            </h1>
          </div>

          {/* Progress & Timer */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-deep-blue/70">
                Question {state.currentQuestion.index + 1}
              </span>
              {state.selectedAnswer && (
                <span className="text-sm text-ocean-blue font-medium">Answer locked in!</span>
              )}
            </div>
            <TimerDisplay
              startedAt={state.currentQuestion.startedAt}
              timeLimitSeconds={state.currentQuestion.timeLimitSeconds}
            />
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardContent className="p-6 md:p-8">
              {/* Question Image */}
              {state.currentQuestion.imageUrl && (
                <div className="mb-6">
                  <img
                    src={state.currentQuestion.imageUrl}
                    alt="Question image"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                </div>
              )}

              <h2 className="text-xl md:text-2xl font-semibold text-deep-blue mb-6">
                {state.currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const optionText = state.currentQuestion!.options[option]
                  const isSelected = state.selectedAnswer === option

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={!!state.selectedAnswer}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-ocean-blue bg-ocean-blue/10'
                          : 'border-gray-200 hover:border-ocean-blue/50'
                      } ${state.selectedAnswer ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-ocean-blue bg-ocean-blue text-white'
                              : 'border-gray-300'
                          }`}
                        >
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

              {!state.selectedAnswer && (
                <p className="text-center text-sm text-deep-blue/60 mt-4">
                  Tap an answer to lock it in. You cannot change it!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Answer reveal
  if (state.status === 'reveal' && state.revealData) {
    const isCorrect = state.selectedAnswer === state.revealData.correctAnswer
    const didAnswer = state.selectedAnswer !== null
    const pointsBreakdown = getPointsBreakdown(isCorrect, timeTakenMsRef.current, 30000)

    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Question + Answers Recap */}
          {state.revealData.question && (
            <Card className="mb-4 bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-deep-blue/60 mb-2">Question {state.revealData.index + 1}:</p>
                <p className="text-deep-blue font-semibold mb-3">{state.revealData.question}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const isCorrect = opt === state.revealData!.correctAnswer
                    const isUserAnswer = opt === state.selectedAnswer
                    return (
                      <div
                        key={opt}
                        className={`p-2 rounded-lg border ${
                          isCorrect
                            ? 'bg-green-50 border-green-300 text-green-800'
                            : isUserAnswer && !isCorrect
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-white border-gray-200 text-deep-blue/70'
                        }`}
                      >
                        <span className="font-bold">{opt}.</span> {state.revealData!.options[opt]}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result Card */}
          <Card className="mb-6">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center mb-4">
                {isCorrect ? (
                  <div className="w-20 h-20 rounded-full bg-ocean-blue/10 flex items-center justify-center border-3 border-ocean-blue">
                    <Check className="w-12 h-12 text-ocean-blue" />
                  </div>
                ) : didAnswer ? (
                  <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center border-3 border-red-300">
                    <X className="w-12 h-12 text-red-400" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-3 border-gray-300">
                    <Clock className="w-12 h-12 text-gray-500" />
                  </div>
                )}
              </div>
              <h2 className="font-dancing text-4xl italic mb-2" style={{ color: isCorrect ? '#0284c7' : didAnswer ? '#b91c1c' : '#6b7280' }}>
                {isCorrect ? 'Correct!' : didAnswer ? 'Oops!' : "Time's up!"}
              </h2>
              {!didAnswer && (
                <p className="text-deep-blue/70 text-lg">
                  The correct answer was <span className="font-bold text-ocean-blue">{state.revealData.correctAnswer}</span>
                </p>
              )}
              {didAnswer && !isCorrect && (
                <p className="text-deep-blue/70 text-lg">
                  The correct answer was <span className="font-bold text-ocean-blue">{state.revealData.correctAnswer}</span>
                </p>
              )}
              {isCorrect && (
                <p className="text-lg font-semibold text-ocean-blue">+{pointsBreakdown.total} points</p>
              )}
            </CardContent>
          </Card>

          {/* Points Breakdown */}
          {isCorrect && (
            <Card className="mb-6">
              <CardContent className="p-6">
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
                  <div className="border-t pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-ocean-blue">+{pointsBreakdown.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Answer Distribution */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-deep-blue">How Everyone Answered</h3>
                <div className="flex items-center gap-1 text-sm text-deep-blue/60">
                  <Users className="w-4 h-4" />
                  <span>{state.revealData.stats.total}</span>
                </div>
              </div>
              <p className="text-sm text-deep-blue/60 mb-4">
                Correct answer: <span className="font-semibold text-ocean-blue">{state.revealData.correctAnswer}</span>
              </p>
              <div className="space-y-4">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const count = state.revealData!.stats[option] as number
                  const total = state.revealData!.stats.total
                  const percentage = total > 0 ? (count / total) * 100 : 0
                  const isCorrectAnswer = option === state.revealData!.correctAnswer
                  const isUserAnswer = option === state.selectedAnswer

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
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                              Correct
                            </span>
                          )}
                          {isUserAnswer && !isCorrect && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                              Your answer
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-deep-blue/70">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden bg-gray-200">
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
            </CardContent>
          </Card>

          {/* Score */}
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-deep-blue/70 mb-1">Your Total Score</p>
              <p className="text-4xl font-bold text-ocean-blue">{state.totalScore}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Leaderboard between questions
  if (state.status === 'leaderboard') {
    const currentRanking = state.rankings.find((r) => r.partyId === party.id)

    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="font-dancing text-4xl italic text-ocean-blue mb-2">Leaderboard</h1>
            <p className="text-deep-blue/70">Waiting for next question...</p>
          </div>

          {currentRanking && (
            <Card className="mb-6 bg-ocean-blue text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm">Your Rank</p>
                    <p className="text-3xl font-bold">#{currentRanking.rank}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/80 text-sm">Score</p>
                    <p className="text-3xl font-bold">{currentRanking.totalScore}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <LeaderboardList rankings={state.rankings} currentPartyId={party.id} maxItems={10} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Final results
  if (state.status === 'ended') {
    const currentRanking = state.rankings.find((r) => r.partyId === party.id)
    const topThree = state.rankings.slice(0, 3)

    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-4 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Award className="w-16 h-16 text-white" />
            </div>
            <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue mb-2">
              Quiz Complete!
            </h1>
            <p className="text-deep-blue/70">
              {state.rankings.length} participant{state.rankings.length !== 1 ? 's' : ''} competed
            </p>
          </div>

          {/* Podium */}
          {topThree.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-end justify-center gap-4 mb-4">
                  {/* 2nd Place */}
                  {topThree[1] && (
                    <div className="flex flex-col items-center flex-1 max-w-[110px]">
                      <Trophy className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="font-semibold text-deep-blue text-center text-xs leading-tight h-8 flex items-center justify-center">
                        {topThree[1].partyName}
                      </p>
                      <p className="text-lg font-bold text-gray-600">{topThree[1].totalScore}</p>
                      <div className="w-full h-16 bg-gray-200 rounded-t-lg flex items-center justify-center mt-2">
                        <span className="text-xl font-bold text-gray-500">2</span>
                      </div>
                    </div>
                  )}

                  {/* 1st Place */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center flex-1 max-w-[130px]">
                      <Trophy className="w-10 h-10 text-yellow-500 mb-2" />
                      <p className="font-semibold text-deep-blue text-center text-sm leading-tight h-10 flex items-center justify-center">
                        {topThree[0].partyName}
                      </p>
                      <p className="text-xl font-bold text-yellow-600">{topThree[0].totalScore}</p>
                      <div className="w-full h-24 bg-yellow-100 rounded-t-lg flex items-center justify-center mt-2">
                        <span className="text-2xl font-bold text-yellow-600">1</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <div className="flex flex-col items-center flex-1 max-w-[110px]">
                      <Trophy className="w-8 h-8 text-orange-400 mb-2" />
                      <p className="font-semibold text-deep-blue text-center text-xs leading-tight h-8 flex items-center justify-center">
                        {topThree[2].partyName}
                      </p>
                      <p className="text-lg font-bold text-orange-500">{topThree[2].totalScore}</p>
                      <div className="w-full h-12 bg-orange-100 rounded-t-lg flex items-center justify-center mt-2">
                        <span className="text-xl font-bold text-orange-400">3</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Your Result */}
          {currentRanking && (
            <Card className="mb-6 bg-ocean-blue text-white">
              <CardContent className="p-4">
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
                  <p className="mt-2 text-white/90 text-sm">Includes +200 Games Completion Bonus!</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Full Leaderboard */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-semibold text-deep-blue text-lg mb-4">Full Leaderboard</h2>
              <LeaderboardList rankings={state.rankings} currentPartyId={party.id} maxItems={20} />
            </CardContent>
          </Card>

          {/* Back to Games */}
          <div className="mt-6">
            <Button
              onClick={() => router.push('/games')}
              className="w-full bg-ocean-blue hover:bg-navy-blue"
            >
              Back to Games
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-ocean-blue" />
    </div>
  )
}

// Timer component
function TimerDisplay({ startedAt, timeLimitSeconds }: { startedAt: string; timeLimitSeconds: number }) {
  const [remaining, setRemaining] = useState(timeLimitSeconds)

  useEffect(() => {
    const startTime = new Date(startedAt).getTime()
    const endTime = startTime + timeLimitSeconds * 1000

    const updateTimer = () => {
      const now = Date.now()
      const remainingMs = Math.max(0, endTime - now)
      setRemaining(Math.ceil(remainingMs / 1000))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 100)
    return () => clearInterval(interval)
  }, [startedAt, timeLimitSeconds])

  const isLow = remaining <= 5
  const isMedium = remaining <= 10 && remaining > 5

  return (
    <div className="flex items-center justify-center gap-2">
      <Clock className={`w-5 h-5 ${isLow ? 'text-red-500' : isMedium ? 'text-orange-500' : 'text-ocean-blue'}`} />
      <span
        className={`text-3xl font-bold tabular-nums ${
          isLow ? 'text-red-500 animate-pulse' : isMedium ? 'text-orange-500' : 'text-ocean-blue'
        }`}
      >
        {remaining}
      </span>
    </div>
  )
}

// Leaderboard component
function LeaderboardList({
  rankings,
  currentPartyId,
  maxItems = 10,
}: {
  rankings: ParticipantRanking[]
  currentPartyId?: string
  maxItems?: number
}) {
  const displayRankings = rankings.slice(0, maxItems)

  if (rankings.length === 0) {
    return <div className="text-center py-8 text-deep-blue/60">No participants yet</div>
  }

  return (
    <div className="space-y-2">
      {displayRankings.map((entry) => {
        const isCurrentUser = entry.partyId === currentPartyId

        return (
          <div
            key={entry.partyId}
            className={`rounded-lg p-3 ${
              isCurrentUser
                ? 'bg-ocean-blue/10 border-2 border-ocean-blue'
                : entry.rank === 1
                ? 'bg-yellow-50 border-2 border-yellow-300'
                : entry.rank === 2
                ? 'bg-gray-50 border-2 border-gray-300'
                : entry.rank === 3
                ? 'bg-orange-50 border-2 border-orange-300'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 text-center">
                {entry.rank <= 3 ? (
                  <Trophy
                    className={`w-5 h-5 mx-auto ${
                      entry.rank === 1 ? 'text-yellow-500' : entry.rank === 2 ? 'text-gray-400' : 'text-orange-400'
                    }`}
                  />
                ) : (
                  <span className="text-deep-blue/50 font-bold">#{entry.rank}</span>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <span className={`font-semibold truncate ${isCurrentUser ? 'text-ocean-blue' : 'text-deep-blue'}`}>
                  {entry.partyName}
                  {isCurrentUser && ' (You)'}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-lg font-bold ${
                    isCurrentUser
                      ? 'text-ocean-blue'
                      : entry.rank === 1
                      ? 'text-yellow-600'
                      : entry.rank === 2
                      ? 'text-gray-600'
                      : entry.rank === 3
                      ? 'text-orange-500'
                      : 'text-deep-blue'
                  }`}
                >
                  {entry.totalScore}
                </span>
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
