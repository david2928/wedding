'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Trophy, Lock } from 'lucide-react'
import Image from 'next/image'
import GameCard from '@/components/games/GameCard'
import GameProgress from '@/components/games/GameProgress'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/lib/supabase/types'
import { isDevModeEnabled, enableDevMode } from '@/lib/utils/devMode'

type GameStation = Tables<'game_stations'>
type GameCompletion = Tables<'game_completions'>
type Party = Tables<'parties'>

export default function GamesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [party, setParty] = useState<Party | null>(null)
  const [stations, setStations] = useState<GameStation[]>([])
  const [completions, setCompletions] = useState<GameCompletion[]>([])
  const [signingIn, setSigningIn] = useState(false)
  const [devMode, setDevMode] = useState(false)

  // Development bypass
  const handleDevBypass = async () => {
    enableDevMode() // Persist in sessionStorage
    setDevMode(true)
    // In dev mode, we'll skip auth and just load data
    await loadData(null as any)
  }

  // Check authentication and dev mode on mount
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
      setLoading(false) // Stop loading after auth check
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load party data when user is authenticated
  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async (currentUser?: User | null) => {
    const activeUser = currentUser ?? user

    try {
      setLoading(true)

      // In dev mode, use first party or skip party requirement
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

      // Get all game stations
      const { data: stationsData, error: stationsError } = await supabase
        .from('game_stations')
        .select('*')
        .order('display_order')

      if (stationsError) {
        console.error('Error loading stations:', stationsError)
      } else {
        setStations(stationsData || [])
      }

      // Get completions for this party (if we have one)
      if (partyData) {
        const { data: completionsData, error: completionsError } = await supabase
          .from('game_completions')
          .select('*')
          .eq('party_id', partyData.id)

        if (completionsError) {
          console.error('Error loading completions:', completionsError)
        } else {
          setCompletions(completionsData || [])
        }
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
          redirectTo: `${window.location.origin}/auth/callback?next=/games`
        }
      })
      if (error) throw error
    } catch (err) {
      console.error('Error signing in:', err)
      setSigningIn(false)
    }
  }

  const handleGameClick = (station: GameStation) => {
    if (station.station_id === 'sunset') {
      // Redirect to sunset upload page
      router.push('/games/sunset')
    } else if (station.station_id === 'portrait') {
      // Redirect to portrait upload page
      router.push('/games/portrait')
    } else if (station.station_id === 'selfie') {
      // Redirect to selfie upload page
      router.push('/games/selfie')
    } else {
      // Redirect to QR completion page
      router.push(`/games/complete/${station.station_id}`)
    }
  }

  const handleQuizClick = () => {
    router.push('/quiz')
  }

  const handleLeaderboardClick = () => {
    router.push('/leaderboard')
  }

  // Loading state
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

  // Not authenticated
  if (!user && !devMode) {
    const isDev = process.env.NODE_ENV === 'development'

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div
          className="rounded-2xl shadow-xl overflow-hidden max-w-md w-full"
          style={{ backgroundColor: '#FDFBF7' }}
          autoComplete="off"
          data-form="false"
        >
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <img
              src="/android-chrome-192x192.png"
              alt="C❤️D Logo"
              className="w-20 h-20 mx-auto mb-4"
            />
            <h1 className="font-dancing text-4xl italic mb-2">Wedding Games</h1>
            <p className="text-white/90">Chanika & David</p>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-deep-blue mb-2">
              Join the Fun!
            </h2>
            <p className="text-deep-blue/70 mb-8">
              Sign in with Google to play games and unlock the final quiz.
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm py-6 text-lg"
              >
                {signingIn ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : 'Sign in with Google'}
              </Button>

              {isDev && (
                <Button
                  onClick={handleDevBypass}
                  variant="outline"
                  className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  🔧 Dev Mode Bypass
                </Button>
              )}
            </div>
            {isDev && (
              <p className="text-xs text-orange-600 mt-4">
                Development mode active - bypass available
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Calculate progress - exclude quiz from game stations
  const gameStations = stations.filter(s => s.station_id !== 'quiz')
  const activeStations = gameStations.filter(s => s.is_active === true)
  const completedStations = completions.map(c => c.station_id)
  const completedCount = completedStations.filter(id => id !== 'quiz').length
  const allActiveComplete = activeStations.every(s => completedStations.includes(s.station_id))

  // Dev mode: bypass completion requirement
  const isDev = process.env.NODE_ENV === 'development'
  const quizUnlocked = allActiveComplete || (isDev && devMode)

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: '#fcf6eb' }}>
      <div
        className="max-w-5xl mx-auto"
        autoComplete="off"
        data-form="false"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/android-chrome-192x192.png"
            alt="C❤️D Logo"
            className="w-24 h-24 mx-auto mb-4"
          />
          <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue mb-2">
            Wedding Games
          </h1>
          <p className="text-deep-blue/70">
            Complete all active games to unlock the final quiz!
          </p>
          {party && (
            <p className="text-sm text-deep-blue/50 mt-2">
              Playing as: {party.name}
            </p>
          )}
        </div>

        {/* Progress */}
        <GameProgress
          completed={completedCount}
          total={gameStations.length}
          activeGamesCount={activeStations.length}
        />

        {/* Games Grid - exclude quiz station */}
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

        {/* Quiz Button */}
        <div className="rounded-2xl shadow-2xl p-8 text-center" style={{ backgroundColor: '#FDFBF7', border: '3px solid #eee0d2' }}>
          {/* Quiz Icon */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/games/quiz-icon.png?v=5"
              alt="Final Quiz"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <h2 className="font-dancing text-3xl italic text-ocean-blue mb-4">
            Final Quiz
          </h2>
          <p className="text-deep-blue/70 mb-6">
            {quizUnlocked
              ? 'Test your knowledge about David & Chanika!'
              : `Complete ${activeStations.length - completedCount} more ${activeStations.length - completedCount === 1 ? 'game' : 'games'} to unlock the quiz`
            }
            {isDev && devMode && !allActiveComplete && (
              <span className="block text-orange-600 text-sm mt-2">
                🔧 Dev Mode: Quiz unlocked for testing
              </span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleQuizClick}
              disabled={!quizUnlocked}
              size="lg"
              className={`px-8 py-6 text-lg font-semibold ${
                quizUnlocked
                  ? 'bg-ocean-blue hover:bg-navy-blue text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {quizUnlocked ? (
                <>
                  <Trophy className="w-5 h-5 mr-2" />
                  Take the Quiz
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Quiz Locked
                </>
              )}
            </Button>
            <Button
              onClick={handleLeaderboardClick}
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg font-semibold border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
