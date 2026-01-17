'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle, UserPlus } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/lib/supabase/types'

type Party = Tables<'parties'>

interface GuestGateProps {
  children: React.ReactNode
  onPartyResolved: (party: Party) => void
  pageName?: string // e.g., "games", "big day"
}

type GateStatus = 'loading' | 'not-authenticated' | 'checking-party' | 'not-on-list' | 'entering-name' | 'creating-walkin' | 'authenticated'

export function GuestGate({ children, onPartyResolved, pageName = 'this page' }: GuestGateProps) {
  const [status, setStatus] = useState<GateStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [party, setParty] = useState<Party | null>(null)
  const [walkInName, setWalkInName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  useEffect(() => {
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        checkParty(session.user)
      } else {
        setUser(null)
        setStatus('not-authenticated')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      await checkParty(session.user)
    } else {
      setStatus('not-authenticated')
    }
  }

  const checkParty = async (currentUser: User) => {
    setStatus('checking-party')

    try {
      // Check if user is linked to a party
      const { data: existingParty, error: partyError } = await supabase
        .from('parties')
        .select('*')
        .eq('google_user_id', currentUser.id)
        .single()

      if (existingParty && !partyError) {
        setParty(existingParty)
        onPartyResolved(existingParty)
        setStatus('authenticated')
        return
      }

      // Check if this is a walk-in party (created by this flow)
      const { data: walkInParty } = await supabase
        .from('parties')
        .select('*')
        .eq('google_user_id', currentUser.id)
        .eq('type', 'walk-in')
        .single()

      if (walkInParty) {
        setParty(walkInParty)
        onPartyResolved(walkInParty)
        setStatus('authenticated')
        return
      }

      // User not on guest list
      setStatus('not-on-list')
    } catch (err) {
      console.error('Error checking party:', err)
      setStatus('not-on-list')
    }
  }

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}`
        }
      })
      if (error) throw error
    } catch (err) {
      console.error('Error signing in:', err)
      setError('Failed to sign in. Please try again.')
      setSigningIn(false)
    }
  }

  const handleContinueAsWalkIn = () => {
    setStatus('entering-name')
  }

  const handleCreateWalkIn = async () => {
    if (!walkInName.trim() || !user) return

    setStatus('creating-walkin')
    setError(null)

    try {
      // Generate a unique code for the walk-in
      const code = `WALKIN-${Date.now().toString(36).toUpperCase()}`

      // Create a walk-in party
      const { data: newParty, error: createError } = await supabase
        .from('parties')
        .insert({
          name: walkInName.trim(),
          code,
          type: 'walk-in',
          status: 'completed',
          google_user_id: user.id,
          google_email: user.email,
        })
        .select()
        .single()

      if (createError) throw createError

      // Create a guest entry for them
      await supabase
        .from('guests')
        .insert({
          party_id: newParty.id,
          first_name: walkInName.trim(),
          rsvp_status: 'attending',
        })

      setParty(newParty)
      onPartyResolved(newParty)
      setStatus('authenticated')
    } catch (err) {
      console.error('Error creating walk-in:', err)
      setError('Failed to create your profile. Please try again.')
      setStatus('entering-name')
    }
  }

  const handleTryDifferentAccount = async () => {
    await supabase.auth.signOut()
    setStatus('not-authenticated')
  }

  // Loading state
  if (status === 'loading' || status === 'checking-party') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ocean-blue mx-auto mb-4" />
          <p className="text-deep-blue/70">
            {status === 'loading' ? 'Loading...' : 'Checking guest list...'}
          </p>
        </div>
      </div>
    )
  }

  // Not authenticated - show sign in
  if (status === 'not-authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="rounded-2xl shadow-xl overflow-hidden max-w-md w-full" style={{ backgroundColor: '#FDFBF7' }}>
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <img
              src="/android-chrome-192x192.png"
              alt="C&D Logo"
              className="w-20 h-20 mx-auto mb-4"
            />
            <h1 className="font-dancing text-4xl italic mb-2">Welcome!</h1>
            <p className="text-white/90">Chanika & David's Wedding</p>
          </div>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-deep-blue mb-2">
              Sign in to access {pageName}
            </h2>
            <p className="text-deep-blue/70 mb-8">
              Please sign in with the Google account you used for your RSVP.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-red-700 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 shadow-sm py-6 text-lg"
            >
              {signingIn ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5 mr-3" />
              )}
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Not on guest list - show options
  if (status === 'not-on-list') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="rounded-2xl shadow-xl overflow-hidden max-w-md w-full" style={{ backgroundColor: '#FDFBF7' }}>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-dancing text-3xl italic mb-2">Not on Guest List</h1>
            <p className="text-white/90">We couldn't find you</p>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <p className="text-deep-blue/80 mb-2">
                The account <strong>{user?.email}</strong> isn't linked to any RSVP.
              </p>
              <p className="text-deep-blue/60 text-sm">
                This might happen if you used a different Google account for your RSVP.
              </p>
            </div>

            {/* Recommended option */}
            <div className="bg-ocean-blue/10 border border-ocean-blue/30 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-ocean-blue mb-2">Recommended</p>
              <p className="text-deep-blue/70 text-sm mb-3">
                Sign in with the same Google account you used when completing your RSVP.
              </p>
              <Button
                onClick={handleTryDifferentAccount}
                className="w-full bg-ocean-blue hover:bg-navy-blue"
              >
                Try a Different Account
              </Button>
            </div>

            {/* Alternative option */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-deep-blue/70 mb-2">Or continue anyway</p>
              <p className="text-deep-blue/60 text-sm mb-3">
                Join as a walk-in guest. You can still participate in all activities!
              </p>
              <Button
                onClick={handleContinueAsWalkIn}
                variant="outline"
                className="w-full border-gray-300"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Continue as Walk-in Guest
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Entering name for walk-in
  if (status === 'entering-name' || status === 'creating-walkin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fcf6eb' }}>
        <div className="rounded-2xl shadow-xl overflow-hidden max-w-md w-full" style={{ backgroundColor: '#FDFBF7' }}>
          <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-8 text-white text-center">
            <UserPlus className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-dancing text-3xl italic mb-2">Welcome!</h1>
            <p className="text-white/90">Join as a walk-in guest</p>
          </div>
          <div className="p-8">
            <p className="text-deep-blue/70 text-center mb-6">
              Please enter your name so we know who you are!
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Your name"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                className="text-lg py-6"
                disabled={status === 'creating-walkin'}
              />

              <Button
                onClick={handleCreateWalkIn}
                disabled={!walkInName.trim() || status === 'creating-walkin'}
                className="w-full bg-ocean-blue hover:bg-navy-blue py-6 text-lg"
              >
                {status === 'creating-walkin' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating profile...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>

              <Button
                onClick={() => setStatus('not-on-list')}
                variant="ghost"
                className="w-full text-deep-blue/60"
                disabled={status === 'creating-walkin'}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated - render children
  return <>{children}</>
}
