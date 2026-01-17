'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Trophy, Lock } from 'lucide-react'
import Image from 'next/image'
import GameCard from '@/components/games/GameCard'
import GameProgress from '@/components/games/GameProgress'
import { GuestGate } from '@/components/GuestGate'
import type { Tables } from '@/lib/supabase/types'
import { isDevModeEnabled, enableDevMode } from '@/lib/utils/devMode'

type GameStation = Tables<'game_stations'>
type GameCompletion = Tables<'game_completions'>
type Party = Tables<'parties'>

export default function GamesPage() {
  const [devMode, setDevMode] = useState(false)
  const [devModeChecked, setDevModeChecked] = useState(false)

  // Check for dev mode on mount
  useEffect(() => {
    const wasDevModeEnabled = isDevModeEnabled()
    if (wasDevModeEnabled) {
      setDevMode(true)
    }
    setDevModeChecked(true)
  }, [])

  // Development bypass
  const handleDevBypass = () => {
    enableDevMode()
    setDevMode(true)
  }

  // Show loading until dev mode check is done
  if (!devModeChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
        <Loader2 className="w-12 h-12 animate-spin text-ocean-blue" />
      </div>
    )
  }

  // Dev mode bypass in development
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev && !devMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="rounded-2xl shadow-xl overflow-hidden max-w-md w-full" style={{ backgroundColor: '#FDFBF7' }}>
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <img src="/android-chrome-192x192.png" alt="C&D Logo" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="font-dancing text-4xl italic mb-2">Development Mode</h1>
          </div>
          <div className="p-8 text-center">
            <Button
              onClick={handleDevBypass}
              variant="outline"
              className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 mb-4"
            >
              Dev Mode Bypass
            </Button>
            <p className="text-xs text-deep-blue/60">
              Or the GuestGate will handle normal authentication below
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Dev mode active - show games directly
  if (devMode) {
    return <GamesContent party={null} devMode={true} />
  }

  // Production - use GuestGate
  return (
    <GuestGate pageName="the games" onPartyResolved={() => {}}>
      <GamesContentWithParty />
    </GuestGate>
  )
}

// Wrapper that fetches party from auth state
function GamesContentWithParty() {
  const [party, setParty] = useState<Party | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchParty = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data } = await supabase
          .from('parties')
          .select('*')
          .eq('google_user_id', session.user.id)
          .single()
        setParty(data)
      }
      setLoading(false)
    }
    fetchParty()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
        <Loader2 className="w-12 h-12 animate-spin text-ocean-blue" />
      </div>
    )
  }

  return <GamesContent party={party} devMode={false} />
}

// Main games content
function GamesContent({ party, devMode }: { party: Party | null; devMode: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState<GameStation[]>([])
  const [completions, setCompletions] = useState<GameCompletion[]>([])
  const [quizSessionActive, setQuizSessionActive] = useState(false)

  useEffect(() => {
    loadData()
  }, [party])

  const loadData = async () => {
    try {
      setLoading(true)

      // In dev mode without party, get any party for testing
      let partyData = party
      if (devMode && !party) {
        const { data: anyParty } = await supabase
          .from('parties')
          .select('*')
          .limit(1)
          .single()
        partyData = anyParty
      }

      // Get all game stations
      const { data: stationsData } = await supabase
        .from('game_stations')
        .select('*')
        .order('display_order')

      setStations(stationsData || [])

      // Get completions for this party
      if (partyData) {
        const { data: completionsData } = await supabase
          .from('game_completions')
          .select('*')
          .eq('party_id', partyData.id)

        setCompletions(completionsData || [])
      }

      // Check if there's an active quiz session
      const { data: activeSession } = await supabase
        .from('live_quiz_sessions')
        .select('id')
        .in('status', ['waiting', 'active', 'showing_answer'])
        .limit(1)
        .single()

      setQuizSessionActive(!!activeSession)

      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setLoading(false)
    }
  }

  const handleGameClick = (station: GameStation) => {
    if (station.station_id === 'sunset') {
      router.push('/games/sunset')
    } else if (station.station_id === 'portrait') {
      router.push('/games/portrait')
    } else if (station.station_id === 'selfie') {
      router.push('/games/selfie')
    } else {
      router.push(`/games/complete/${station.station_id}`)
    }
  }

  const handleQuizClick = () => {
    router.push('/quiz')
  }

  const handleLeaderboardClick = () => {
    router.push('/leaderboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">Loading games...</p>
        </div>
      </div>
    )
  }

  // Calculate progress
  const gameStations = stations.filter(s => s.station_id !== 'quiz')
  const activeStations = gameStations.filter(s => s.is_active === true)
  const completedStations = completions.map(c => c.station_id)
  const completedCount = completedStations.filter(id => id !== 'quiz').length
  const allActiveComplete = activeStations.every(s => completedStations.includes(s.station_id))
  const quizUnlocked = quizSessionActive || devMode

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#fcf6eb' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/android-chrome-192x192.png"
            alt="C&D Logo"
            className="w-24 h-24 mx-auto mb-4"
          />
          <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue mb-2">
            Wedding Games
          </h1>
          <p className="text-deep-blue/70">
            Complete games to earn bonus points for the Grand Prize Quiz!
          </p>
          {party && (
            <p className="text-sm text-deep-blue/50 mt-2">
              Playing as: {party.name}
            </p>
          )}
          {devMode && (
            <p className="text-xs text-orange-600 mt-2">Dev Mode Active</p>
          )}
        </div>

        {/* Progress */}
        <GameProgress
          completed={completedCount}
          total={gameStations.length}
          activeGamesCount={activeStations.length}
        />

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stations
            .filter(station => station.station_id !== 'quiz')
            .map((station) => {
              const isCompleted = completedStations.includes(station.station_id)
              return (
                <GameCard
                  key={station.id}
                  station={station}
                  isCompleted={isCompleted}
                  onClick={() => handleGameClick(station)}
                />
              )
            })}
        </div>

        {/* Grand Prize Quiz Section */}
        <div className="rounded-2xl shadow-2xl p-8 text-center" style={{ backgroundColor: '#FDFBF7', border: '3px solid #eee0d2' }}>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/games/quiz-icon.png?v=5"
              alt="Grand Prize Quiz"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <h2 className="font-dancing text-3xl italic text-ocean-blue mb-2">
            The Grand Prize Quiz
          </h2>
          <p className="text-sm text-deep-blue/50 mb-4">
            Win amazing prizes!
          </p>

          {quizSessionActive ? (
            <div className="mb-6">
              <p className="text-deep-blue/70 mb-2">
                The quiz is now open! Test your knowledge about David & Chanika.
              </p>
              {allActiveComplete && (
                <p className="text-green-600 text-sm font-medium">
                  +200 bonus points for completing all games!
                </p>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-4">
                <p className="text-gray-600 font-medium">
                  Available during dinner time
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  The host will announce when the quiz begins
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="text-amber-800">
                  <strong>Tip:</strong> Complete all {activeStations.length} games to earn
                  <span className="font-bold"> +200 bonus points</span> for the quiz!
                </p>
                <p className="text-amber-700 mt-1">
                  {allActiveComplete
                    ? "You've completed all games - bonus secured!"
                    : `${completedCount}/${activeStations.length} games completed`
                  }
                </p>
              </div>
            </div>
          )}

          {devMode && !quizSessionActive && (
            <p className="text-orange-600 text-sm mb-4">
              Dev Mode: Button enabled for testing
            </p>
          )}

          <div className="flex justify-center">
            {quizSessionActive ? (
              <Button
                onClick={handleQuizClick}
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Join the Quiz
              </Button>
            ) : devMode ? (
              <Button
                onClick={handleQuizClick}
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-orange-400 hover:bg-orange-500 text-white"
              >
                <Trophy className="w-5 h-5 mr-2" />
                Join Quiz (Dev)
              </Button>
            ) : (
              <Button
                disabled
                size="lg"
                className="px-8 py-6 text-lg font-semibold bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300"
              >
                <Lock className="w-5 h-5 mr-2" />
                Available at Dinner
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
