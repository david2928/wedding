'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2, Check, AlertCircle, Trophy } from 'lucide-react'
import Image from 'next/image'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/lib/supabase/types'
import { isDevModeEnabled, enableDevMode } from '@/lib/utils/devMode'

// Map station IDs to icon image paths (same as GameCard)
const getIconPath = (stationId: string): string => {
  const iconMap: Record<string, string> = {
    'sunset': '/games/sunset-icon.png',
    'golf': '/games/golf-icon.png',
    'portrait': '/games/portrait-icon.png',
    'audio': '/games/audio-icon.png',
    'selfie': '/games/selfie-icon.png',
  }
  return iconMap[stationId] || '/games/sunset-icon.png'
}

type GameStation = Tables<'game_stations'>
type Party = Tables<'parties'>

export default function CompleteGamePage() {
  const params = useParams()
  const router = useRouter()
  const stationId = params.stationId as string

  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [party, setParty] = useState<Party | null>(null)
  const [station, setStation] = useState<GameStation | null>(null)
  const [alreadyCompleted, setAlreadyCompleted] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [devMode, setDevMode] = useState(false)

  // Dev mode bypass
  const handleDevBypass = async () => {
    enableDevMode() // Persist in sessionStorage
    setDevMode(true)
    await loadDataAndComplete(null as any)
  }

  useEffect(() => {
    // Check if dev mode was previously enabled in this session
    const wasDevModeEnabled = isDevModeEnabled()
    if (wasDevModeEnabled) {
      setDevMode(true)
      loadDataAndComplete(null as any)
      return
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false) // Stop loading after auth check

      if (session?.user) {
        await loadDataAndComplete(session.user)
      }
    }
    checkAuth()
  }, [stationId])

  const loadDataAndComplete = async (currentUser: User | null) => {
    try {
      setLoading(true)
      setError(null)

      // Get party for this user
      let partyData: Party | null = null

      if (devMode || process.env.NODE_ENV === 'development') {
        // Dev mode: Use first party for testing
        const { data: anyParty } = await supabase
          .from('parties')
          .select('*')
          .limit(1)
          .single()

        if (anyParty) {
          partyData = anyParty
          setParty(anyParty)
        } else {
          setError('No parties found in database.')
          setLoading(false)
          return
        }
      } else if (currentUser) {
        // Production: Get party for authenticated user
        const { data: userParty, error: partyError } = await supabase
          .from('parties')
          .select('*')
          .eq('google_user_id', currentUser.id)
          .single()

        if (partyError || !userParty) {
          setError('Could not find your party. Please contact support.')
          setLoading(false)
          return
        }

        partyData = userParty
        setParty(userParty)
      }

      if (!partyData) {
        setError('Could not load party data.')
        setLoading(false)
        return
      }

      // Get the game station
      const { data: stationData, error: stationError } = await supabase
        .from('game_stations')
        .select('*')
        .eq('station_id', stationId)
        .single()

      if (stationError || !stationData) {
        setError('Invalid game station. Please check your QR code.')
        setLoading(false)
        return
      }

      // Check if station is active
      if (!stationData.is_active) {
        setError('This game is not active yet. Stay tuned!')
        setLoading(false)
        return
      }

      // Games that require photo upload should redirect to their upload page
      if (stationData.requires_upload) {
        router.push(`/games/${stationId}`)
        return
      }

      setStation(stationData)

      // Check if already completed
      const { data: existingCompletion, error: completionCheckError } = await supabase
        .from('game_completions')
        .select('*')
        .eq('party_id', partyData.id)
        .eq('station_id', stationId)
        .maybeSingle()

      if (completionCheckError) {
        console.error('Error checking completion:', completionCheckError)
      }

      if (existingCompletion) {
        setAlreadyCompleted(true)
        setLoading(false)
        return
      }

      // Don't auto-complete - show confirmation dialog instead
      setLoading(false)

    } catch (err) {
      console.error('Error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const completeGame = async (partyId: string, userId: string) => {
    try {
      setProcessing(true)

      const { error: insertError } = await supabase
        .from('game_completions')
        .insert({
          party_id: partyId,
          station_id: stationId,
          completed_by_google_id: userId
        })

      if (insertError) {
        // Check if it's a uniqueness violation (already completed)
        if (insertError.code === '23505') {
          setAlreadyCompleted(true)
        } else {
          throw insertError
        }
      } else {
        setCompleted(true)
      }

      setProcessing(false)
      setLoading(false)

    } catch (err) {
      console.error('Error completing game:', err)
      setError('Failed to mark game as complete. Please try again.')
      setProcessing(false)
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/games/complete/${stationId}`
        }
      })
      if (error) throw error
    } catch (err) {
      console.error('Error signing in:', err)
      setSigningIn(false)
    }
  }

  // Loading state
  if (loading || processing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">
            {processing ? 'Marking game as complete...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user && !devMode) {
    const isDev = process.env.NODE_ENV === 'development'

    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-pale-blue/30 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <h1 className="font-dancing text-4xl italic mb-2">Game Station</h1>
            <p className="text-white/90">Sign in to continue</p>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-deep-blue mb-2">
              Authentication Required
            </h2>
            <p className="text-deep-blue/70 mb-8">
              Please sign in with Google to complete this game.
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center" style={{ border: '2px solid #fca5a5' }}>
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-deep-blue mb-2">Oops!</h1>
          <p className="text-deep-blue/70 mb-6">{error}</p>
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

  // Already completed
  if (alreadyCompleted) {
    const iconPath = getIconPath(stationId)

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center" style={{ border: '2px solid #86efac' }}>
          {/* Game Icon with checkmark overlay */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <Image
              src={`${iconPath}?v=6`}
              alt={station?.name || 'Game'}
              fill
              className="object-contain"
              unoptimized
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-deep-blue mb-2">Already Completed!</h1>
          <p className="text-deep-blue/70 mb-2">
            You've already completed this game.
          </p>
          {station && (
            <p className="text-lg font-semibold text-ocean-blue mb-6">
              {station.name}
            </p>
          )}
          <Button
            onClick={() => router.push('/games')}
            className="bg-ocean-blue hover:bg-navy-blue"
          >
            Back to Games Hub
          </Button>
        </div>
      </div>
    )
  }

  // Success state
  if (completed) {
    const iconPath = getIconPath(stationId)

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center animate-fade-in-up" style={{ border: '2px solid #86efac' }}>
          {/* Game Icon */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <Image
              src={`${iconPath}?v=6`}
              alt={station?.name || 'Game'}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <h1 className="text-3xl font-bold text-deep-blue mb-2">Congratulations!</h1>
          <p className="text-deep-blue/70 mb-2">
            You've successfully completed:
          </p>
          {station && (
            <p className="text-2xl font-dancing italic text-ocean-blue mb-6">
              {station.name}
            </p>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 text-sm">
              <Check className="w-4 h-4 inline mr-1" />
              Progress saved! Your completion has been recorded.
            </p>
          </div>
          <Button
            onClick={() => router.push('/games')}
            variant="outline"
            className="border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white"
          >
            Go to Games Now
          </Button>
        </div>
      </div>
    )
  }

  // Confirmation dialog - show game details and ask for confirmation
  if (station && party && !alreadyCompleted && !completed) {
    const iconPath = getIconPath(stationId)

    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" style={{ border: '2px solid #eee0d2' }}>
          {/* Game Icon */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <Image
              src={`${iconPath}?v=6`}
              alt={station.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          <h1 className="text-3xl font-dancing italic text-ocean-blue mb-2">
            {station.name}
          </h1>

          <p className="text-deep-blue/70 mb-6">
            {station.description || 'Complete this game to earn points!'}
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm font-medium">
              Have you completed this activity?
            </p>
          </div>

          <div className="space-y-4 w-full">
            <button
              onClick={() => {
                setProcessing(true)
                completeGame(party.id, user?.id || 'dev-mode-user')
              }}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Marking Complete...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Yes, I Completed It!
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/games')}
              disabled={processing}
              className="w-full bg-white border-2 border-ocean-blue text-ocean-blue hover:bg-ocean-blue hover:text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Not Yet, Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
