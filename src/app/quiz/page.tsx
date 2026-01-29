'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
  const previousRankingsRef = useRef<ParticipantRanking[]>([])

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
          setState((prev) => {
            previousRankingsRef.current = prev.rankings
            return {
              ...prev,
              status: 'leaderboard',
              rankings: event.payload.rankings,
            }
          })
          break

        case 'quiz:ended':
          setState((prev) => {
            previousRankingsRef.current = prev.rankings
            return {
              ...prev,
              status: 'ended',
              rankings: event.payload.winners,
            }
          })
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

        // Check if timer has already expired
        const startTime = new Date(session.question_started_at).getTime()
        const timeLimitMs = (session.time_limit_seconds || 30) * 1000
        const now = Date.now()
        const timerExpired = now > startTime + timeLimitMs

        if (existingAnswer || timerExpired) {
          // User already answered OR timer expired - show answered/waiting state
          setState((prev) => ({
            ...prev,
            sessionId: session.id,
            status: 'answered',
            currentQuestion,
            selectedAnswer: existingAnswer?.answer || null,
            totalScore: participantScore,
            hasGamesBonus: participantHasBonus,
          }))
        } else {
          // User hasn't answered yet and timer still running - show question
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

    // Recovery: If session is showing answer, recover the reveal state
    if (session.status === 'showing_answer' && session.current_question_id) {
      // Fetch the current question
      const { data: questionData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('id', session.current_question_id)
        .single()

      if (questionData) {
        // Check if user answered this question
        const { data: existingAnswer } = await supabase
          .from('live_quiz_answers')
          .select('*')
          .eq('session_id', session.id)
          .eq('question_id', session.current_question_id)
          .eq('party_id', partyData.id)
          .maybeSingle()

        // Get answer stats
        const { data: allAnswers } = await supabase
          .from('live_quiz_answers')
          .select('*')
          .eq('session_id', session.id)
          .eq('question_id', session.current_question_id)

        const stats = {
          total: allAnswers?.length || 0,
          A: allAnswers?.filter((a) => a.answer === 'A').length || 0,
          B: allAnswers?.filter((a) => a.answer === 'B').length || 0,
          C: allAnswers?.filter((a) => a.answer === 'C').length || 0,
          D: allAnswers?.filter((a) => a.answer === 'D').length || 0,
          correctCount: allAnswers?.filter((a) => a.is_correct).length || 0,
          averageTimeMs: allAnswers && allAnswers.length > 0
            ? allAnswers.reduce((sum, a) => sum + (a.time_taken_ms || 0), 0) / allAnswers.length
            : 0,
        }

        setState((prev) => ({
          ...prev,
          sessionId: session.id,
          status: 'reveal',
          selectedAnswer: existingAnswer?.answer || null,
          totalScore: participantScore,
          hasGamesBonus: participantHasBonus,
          revealData: {
            questionId: questionData.id,
            question: questionData.question,
            index: session.current_question_index || 0,
            options: {
              A: questionData.option_a,
              B: questionData.option_b,
              C: questionData.option_c,
              D: questionData.option_d,
            },
            correctAnswer: questionData.correct_answer,
            stats,
          },
        }))

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="rounded-2xl shadow-xl overflow-hidden max-w-md w-full" style={{ backgroundColor: '#FDFBF7' }}>
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="rounded-2xl shadow-xl p-8 max-w-md text-center" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="rounded-2xl shadow-xl p-8 max-w-md text-center" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
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
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="rounded-2xl shadow-xl p-8 max-w-md w-full text-center" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
          <Trophy className="w-16 h-16 text-ocean-blue mx-auto mb-4" />
          <h1 className="font-dancing text-4xl italic text-ocean-blue mb-2">Live Quiz</h1>
          <p className="text-deep-blue/70 mb-6">Waiting for the host to start...</p>

          <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#fcf6eb' }}>
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

  // Question view - Compact mobile-first design
  if (state.status === 'question' || state.status === 'answered') {
    if (!state.currentQuestion) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue" />
        </div>
      )
    }

    return (
      <div className="min-h-screen py-4 px-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="max-w-lg mx-auto">
          {/* Compact Header: Question # + Timer */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-deep-blue">
              Question {state.currentQuestion.index + 1}
            </span>
            <div className="flex items-center gap-2">
              {state.selectedAnswer && (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                  Locked in
                </span>
              )}
              <TimerDisplay
                startedAt={state.currentQuestion.startedAt}
                timeLimitSeconds={state.currentQuestion.timeLimitSeconds}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
            {/* Question Image */}
            {state.currentQuestion.imageUrl && (
              <div className="p-4 pb-0">
                <img
                  src={state.currentQuestion.imageUrl}
                  alt="Question image"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
              </div>
            )}

            <div className="p-4">
              <h2 className="text-lg font-semibold text-deep-blue mb-4">
                {state.currentQuestion.question}
              </h2>

              <div className="space-y-2">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const optionText = state.currentQuestion!.options[option]
                  const isSelected = state.selectedAnswer === option

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={!!state.selectedAnswer}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-ocean-blue bg-ocean-blue/10'
                          : 'border-gray-200 bg-white hover:border-ocean-blue/50'
                      } ${state.selectedAnswer ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                            isSelected
                              ? 'border-ocean-blue bg-ocean-blue text-white'
                              : 'border-gray-300 text-gray-500'
                          }`}
                        >
                          {option}
                        </div>
                        <span className={`text-sm ${isSelected ? 'text-deep-blue font-medium' : 'text-deep-blue/80'}`}>
                          {optionText}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {!state.selectedAnswer && state.status === 'question' && (
                <p className="text-center text-xs text-deep-blue/50 mt-3">
                  Tap to lock in your answer
                </p>
              )}

              {/* Waiting for results */}
              {state.status === 'answered' && (
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-ocean-blue text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Waiting for results...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Answer reveal - Clean mobile-first design
  if (state.status === 'reveal' && state.revealData) {
    const isCorrect = state.selectedAnswer === state.revealData.correctAnswer
    const didAnswer = state.selectedAnswer !== null
    const pointsBreakdown = getPointsBreakdown(isCorrect, timeTakenMsRef.current, 30000)
    const pointsEarned = isCorrect ? pointsBreakdown.total : 0

    return (
      <div className="min-h-screen py-4 px-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="max-w-lg mx-auto">
          {/* Main Card */}
          <div className="rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
            {/* Header - Result & Points */}
            <div className={`px-4 py-3 flex items-center justify-between ${
              isCorrect ? 'bg-green-500' : didAnswer ? 'bg-red-400' : 'bg-gray-400'
            }`}>
              <div className="flex items-center gap-2 text-white">
                {isCorrect ? (
                  <Check className="w-5 h-5" />
                ) : didAnswer ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
                <span className="font-semibold">
                  {isCorrect ? 'Correct!' : didAnswer ? 'Incorrect' : 'No Answer'}
                </span>
              </div>
              <div className="text-white font-bold">
                {pointsEarned > 0 ? `+${pointsEarned}` : '0'} pts
              </div>
            </div>

            <div className="p-4">
              {/* Question */}
              <div className="mb-4">
                <p className="text-xs text-deep-blue/50 mb-1">Question {state.revealData.index + 1}</p>
                <h2 className="text-lg font-semibold text-deep-blue">
                  {state.revealData.question}
                </h2>
              </div>

              {/* Answer Options */}
              <div className="space-y-2">
                {(['A', 'B', 'C', 'D'] as const).map((option) => {
                  const optionText = state.revealData!.options[option]
                  const isCorrectAnswer = option === state.revealData!.correctAnswer
                  const isUserAnswer = option === state.selectedAnswer
                  const isUserWrong = isUserAnswer && !isCorrectAnswer
                  const count = state.revealData!.stats[option] as number
                  const total = state.revealData!.stats.total
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0

                  return (
                    <div
                      key={option}
                      className={`relative p-3 rounded-lg border-2 ${
                        isCorrectAnswer
                          ? 'bg-green-50 border-green-400'
                          : isUserWrong
                          ? 'bg-red-50 border-red-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Option indicator */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCorrectAnswer
                              ? 'bg-green-500 text-white'
                              : isUserWrong
                              ? 'bg-red-400 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {isCorrectAnswer ? (
                              <Check className="w-5 h-5" />
                            ) : isUserWrong ? (
                              <X className="w-5 h-5" />
                            ) : (
                              <span className="text-sm font-bold">{option}</span>
                            )}
                          </div>
                          {/* Answer Text */}
                          <span className={`text-sm ${
                            isCorrectAnswer
                              ? 'text-green-800 font-medium'
                              : isUserWrong
                              ? 'text-red-700'
                              : 'text-deep-blue/70'
                          }`}>
                            {optionText}
                          </span>
                        </div>
                        {/* Percentage */}
                        <span className={`text-sm font-medium ml-2 ${
                          isCorrectAnswer ? 'text-green-600' : 'text-deep-blue/50'
                        }`}>
                          {percentage}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isCorrectAnswer ? 'bg-green-400' : isUserWrong ? 'bg-red-300' : 'bg-gray-300'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Stats Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-deep-blue/60">
                  <Users className="w-4 h-4" />
                  <span>{state.revealData.stats.total} answered</span>
                </div>
                <div className="text-deep-blue/60">
                  {state.revealData.stats.correctCount} correct ({
                    state.revealData.stats.total > 0
                      ? Math.round((state.revealData.stats.correctCount / state.revealData.stats.total) * 100)
                      : 0
                  }%)
                </div>
              </div>
            </div>
          </div>

          {/* Total Score */}
          <div className="mt-4 text-center">
            <p className="text-sm text-deep-blue/60">Your Total Score</p>
            <p className="text-3xl font-bold text-ocean-blue">{state.totalScore}</p>
          </div>
        </div>
      </div>
    )
  }

  // Leaderboard between questions
  if (state.status === 'leaderboard') {
    const currentRanking = state.rankings.find((r) => r.partyId === party.id)

    return (
      <div className="min-h-screen py-4 px-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-4">
            <h1 className="font-crimson text-3xl italic text-ocean-blue mb-1">Leaderboard</h1>
            <p className="text-sm text-deep-blue/60">Waiting for next question...</p>
          </div>

          {/* Your Position Card */}
          {currentRanking && (
            <div className="mb-4 bg-gradient-to-r from-ocean-blue to-sky-blue rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs">Your Rank</p>
                  <p className="text-2xl font-bold">#{currentRanking.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-xs">Score</p>
                  <p className="text-2xl font-bold">{currentRanking.totalScore}</p>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
            <div className="p-4">
              <LeaderboardList rankings={state.rankings} previousRankings={previousRankingsRef.current} currentPartyId={party.id} maxItems={10} animate={true} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Final results
  if (state.status === 'ended') {
    const currentRanking = state.rankings.find((r) => r.partyId === party.id)
    const topThree = state.rankings.slice(0, 3)

    return (
      <div className="min-h-screen py-4 px-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-3 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-crimson text-3xl italic text-ocean-blue mb-1">
              Quiz Complete!
            </h1>
            <p className="text-sm text-deep-blue/60">
              {state.rankings.length} participant{state.rankings.length !== 1 ? 's' : ''} competed
            </p>
          </div>

          {/* Podium */}
          {topThree.length > 0 && (
            <div className="rounded-2xl shadow-lg overflow-hidden mb-4" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
              <div className="p-4">
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
              </div>
            </div>
          )}

          {/* Your Result */}
          {currentRanking && (
            <div className="mb-4 bg-gradient-to-r from-ocean-blue to-sky-blue rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs">Your Final Rank</p>
                  <p className="text-2xl font-bold">#{currentRanking.rank}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-xs">Final Score</p>
                  <p className="text-2xl font-bold">{currentRanking.totalScore}</p>
                </div>
              </div>
              {currentRanking.hasGamesBonus && (
                <p className="mt-2 text-white/90 text-sm">Includes +200 Games Completion Bonus!</p>
              )}
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor: '#FDFBF7', border: '2px solid #eee0d2' }}>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-4 py-3">
              <h2 className="font-semibold text-white text-lg">Full Leaderboard</h2>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <LeaderboardList rankings={state.rankings} previousRankings={previousRankingsRef.current} currentPartyId={party.id} maxItems={999} animate={true} />
            </div>
          </div>

        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
      <Loader2 className="w-12 h-12 animate-spin text-ocean-blue" />
    </div>
  )
}

// Timer component - Compact pill style
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
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
      isLow ? 'bg-red-100' : isMedium ? 'bg-orange-100' : 'bg-ocean-blue/10'
    }`}>
      <Clock className={`w-4 h-4 ${isLow ? 'text-red-500' : isMedium ? 'text-orange-500' : 'text-ocean-blue'}`} />
      <span
        className={`text-lg font-bold tabular-nums min-w-[1.5rem] text-center ${
          isLow ? 'text-red-500 animate-pulse' : isMedium ? 'text-orange-500' : 'text-ocean-blue'
        }`}
      >
        {remaining}
      </span>
    </div>
  )
}

// Animated number component
function AnimatedScore({ value, fromValue, className }: { value: number; fromValue?: number; className?: string }) {
  const startFrom = fromValue ?? value
  const [displayValue, setDisplayValue] = useState(startFrom)
  const animationStarted = useRef(false)

  useEffect(() => {
    // Only animate once when component mounts or value changes
    if (animationStarted.current && displayValue === value) return

    const startValue = animationStarted.current ? displayValue : startFrom
    const endValue = value

    if (startValue === endValue) {
      setDisplayValue(endValue)
      return
    }

    animationStarted.current = true
    const duration = 1200 // ms
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * eased)

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, startFrom])

  return <span className={className}>{displayValue}</span>
}

// Leaderboard item component with position animation
function LeaderboardItem({
  entry,
  index,
  previousIndex,
  previousScore,
  isCurrentUser,
  animate,
  animationKey,
}: {
  entry: ParticipantRanking
  index: number
  previousIndex: number
  previousScore: number
  isCurrentUser: boolean
  animate: boolean
  animationKey: number
}) {
  const initialOffset = animate ? (previousIndex - index) * 52 : 0 // 52px = item height + gap
  const [offset, setOffset] = useState(initialOffset)

  useEffect(() => {
    if (!animate) return

    // Set initial offset (start at previous position)
    setOffset((previousIndex - index) * 52)

    // Animate to final position after a brief delay
    const timer = setTimeout(() => setOffset(0), 100)
    return () => clearTimeout(timer)
  }, [animationKey]) // Only re-run when animationKey changes (new leaderboard data)

  const scoreColorClass = isCurrentUser
    ? 'text-ocean-blue'
    : entry.rank === 1
    ? 'text-yellow-600'
    : entry.rank === 2
    ? 'text-gray-600'
    : entry.rank === 3
    ? 'text-orange-500'
    : 'text-deep-blue'

  return (
    <div
      className={`rounded-lg p-3 transition-all duration-700 ease-out ${
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
      style={{ transform: `translateY(${offset}px)` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 flex-shrink-0 text-center">
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
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className={`font-semibold truncate ${isCurrentUser ? 'text-ocean-blue' : 'text-deep-blue'}`}>
            {entry.partyName}
            {isCurrentUser && ' (You)'}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          {animate ? (
            <AnimatedScore
              value={entry.totalScore}
              fromValue={previousScore}
              className={`text-lg font-bold ${scoreColorClass}`}
            />
          ) : (
            <span className={`text-lg font-bold ${scoreColorClass}`}>
              {entry.totalScore}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Leaderboard component
function LeaderboardList({
  rankings,
  previousRankings = [],
  currentPartyId,
  maxItems = 10,
  animate = false,
}: {
  rankings: ParticipantRanking[]
  previousRankings?: ParticipantRanking[]
  currentPartyId?: string
  maxItems?: number
  animate?: boolean
}) {
  const displayRankings = rankings.slice(0, maxItems)

  // Generate a key that changes when rankings change (triggers animation)
  const animationKey = rankings.map(r => `${r.partyId}:${r.totalScore}`).join(',').length + rankings.reduce((sum, r) => sum + r.totalScore, 0)

  // Create maps for quick lookup
  const previousScoreMap = new Map(previousRankings.map(r => [r.partyId, r.totalScore]))
  const previousIndexMap = new Map(previousRankings.slice(0, maxItems).map((r, i) => [r.partyId, i]))

  if (rankings.length === 0) {
    return <div className="text-center py-8 text-deep-blue/60">No participants yet</div>
  }

  return (
    <div className="space-y-2">
      {displayRankings.map((entry, index) => {
        const isCurrentUser = entry.partyId === currentPartyId
        const previousScore = previousScoreMap.get(entry.partyId) ?? 0
        const previousIndex = previousIndexMap.get(entry.partyId) ?? index

        return (
          <LeaderboardItem
            key={entry.partyId}
            entry={entry}
            index={index}
            previousIndex={previousIndex}
            previousScore={previousScore}
            isCurrentUser={isCurrentUser}
            animate={animate}
            animationKey={animationKey}
          />
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
