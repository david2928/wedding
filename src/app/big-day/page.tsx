'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import HeroWelcome from '@/components/big-day/HeroWelcome'
import QuickLinks from '@/components/big-day/QuickLinks'
import MenuSection from '@/components/big-day/MenuSection'
import SeatingSection from '@/components/big-day/SeatingSection'
import GiftUploadSection from '@/components/big-day/GiftUploadSection'
import { GuestGate } from '@/components/GuestGate'
import { isDevModeEnabled, enableDevMode } from '@/lib/utils/devMode'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'
import { useRouter } from 'next/navigation'

type Party = Tables<'parties'>
type Guest = Tables<'guests'>

interface GuestWithParty extends Guest {
  party_name?: string
}

export default function BigDayPage() {
  const [devMode, setDevMode] = useState(false)
  const [devModeChecked, setDevModeChecked] = useState(false)
  const [party, setParty] = useState<Party | null>(null)
  const [allGuests, setAllGuests] = useState<GuestWithParty[]>([])
  const [selectedGuestId, setSelectedGuestId] = useState<string>('')

  useEffect(() => {
    const wasDevModeEnabled = isDevModeEnabled()
    if (wasDevModeEnabled) {
      setDevMode(true)
      fetchGuestsForSelector()
    }
    setDevModeChecked(true)
  }, [])

  const fetchGuestsForSelector = async () => {
    // Fetch all attending guests with their party info
    const { data: guests } = await supabase
      .from('guests')
      .select('*, parties(name)')
      .eq('rsvp_status', 'Attending')
      .not('table_number', 'is', null)
      .order('first_name')

    if (guests) {
      const guestsWithParty = guests.map(g => ({
        ...g,
        party_name: (g.parties as { name: string } | null)?.name || 'Unknown'
      }))
      setAllGuests(guestsWithParty)
    }
  }

  const handleGuestSelect = async (guestId: string) => {
    setSelectedGuestId(guestId)
    if (!guestId) {
      setParty(null)
      return
    }

    const guest = allGuests.find(g => g.id === guestId)
    if (guest?.party_id) {
      const { data } = await supabase
        .from('parties')
        .select('*')
        .eq('id', guest.party_id)
        .single()
      if (data) {
        setParty(data)
      }
    }
  }

  const handleDevBypass = () => {
    enableDevMode()
    setDevMode(true)
    fetchGuestsForSelector()
  }

  const handlePartyResolved = (resolvedParty: Party) => {
    setParty(resolvedParty)
  }

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

  // Dev mode active - show content with guest selector
  if (devMode) {
    const selectedGuest = allGuests.find(g => g.id === selectedGuestId)
    return (
      <div>
        {/* Guest Selector Bar */}
        <div className="sticky top-0 z-50 bg-orange-100 border-b border-orange-300 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-orange-800">Dev Mode - View as guest:</span>
            <select
              value={selectedGuestId}
              onChange={(e) => handleGuestSelect(e.target.value)}
              className="flex-1 max-w-md border border-orange-300 rounded-md px-3 py-2 text-sm bg-white"
            >
              <option value="">Select a guest...</option>
              {allGuests.map(guest => {
                // Parse seat code (e.g., "A-L5" or just "A")
                const match = guest.table_number?.match(/^([A-E])(?:-([LR])(\d+))?$/)
                const tableDisplay = match
                  ? `Table ${match[1]}${match[2] ? ` (${match[2] === 'L' ? 'Left' : 'Right'} ${match[3]})` : ''}`
                  : guest.table_number
                return (
                  <option key={guest.id} value={guest.id}>
                    {guest.first_name} - {tableDisplay} ({guest.party_name})
                  </option>
                )
              })}
            </select>
            {selectedGuest && (
              <span className="text-sm text-orange-700">
                Viewing as: <strong>{selectedGuest.first_name}</strong> (Table {selectedGuest.table_number})
              </span>
            )}
          </div>
        </div>
        <BigDayContent partyId={party?.id || null} partyName={party?.name} isWalkIn={party?.type === 'walk-in'} forceUnlock={true} />
      </div>
    )
  }

  // Production - use GuestGate
  return (
    <GuestGate pageName="the big day info" onPartyResolved={handlePartyResolved}>
      <BigDayContent partyId={party?.id || null} partyName={party?.name} isWalkIn={party?.type === 'walk-in'} />
    </GuestGate>
  )
}

interface BigDayContentProps {
  partyId: string | null
  partyName?: string
  isWalkIn?: boolean
  forceUnlock?: boolean
}

function BigDayContent({ partyId, partyName, isWalkIn = false, forceUnlock = false }: BigDayContentProps) {
  const router = useRouter()
  const [quizSessionActive, setQuizSessionActive] = useState(false)

  useEffect(() => {
    // Check for active quiz session
    const checkQuizSession = async () => {
      const { data } = await supabase
        .from('live_quiz_sessions')
        .select('id')
        .in('status', ['waiting', 'active', 'showing_question', 'showing_answer'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setQuizSessionActive(!!data)
    }

    checkQuizSession()

    // Subscribe to session changes
    const channel = supabase
      .channel('big-day-quiz-check')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_quiz_sessions' },
        () => checkQuizSession()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: '#fcf6eb' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Live Quiz Banner */}
        {quizSessionActive && (
          <div className="mb-6 rounded-2xl shadow-lg overflow-hidden" style={{ backgroundColor: '#FDFBF7', border: '2px solid #0ea5e9' }}>
            <div className="bg-gradient-to-r from-ocean-blue to-sky-blue p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3 text-white">
                  <Trophy className="w-8 h-8" />
                  <div>
                    <h3 className="font-crimson text-xl italic">Quiz is Live!</h3>
                    <p className="text-white/90 text-sm">Join now to win prizes</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/quiz')}
                  className="px-6 py-2 bg-white text-ocean-blue font-semibold rounded-lg hover:bg-sky-50 transition-colors shadow"
                >
                  Join Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/android-chrome-192x192.png"
            alt="C & D Logo"
            className="w-20 h-20 mx-auto mb-4"
          />
          <h1 className="font-dancing text-4xl md:text-5xl italic text-ocean-blue mb-2">
            The Big Day
          </h1>
          <p className="text-deep-blue/70">
            January 31, 2026 | COMO Point Yamu, Phuket
          </p>
        </div>

        {/* Welcome Image */}
        <HeroWelcome />

        {/* Quick Links */}
        <QuickLinks />

        {/* Seating Section - show for all guests including walk-ins (they can search) */}
        <SeatingSection partyId={partyId} forceUnlock={true} />

        {/* Menu Section */}
        <MenuSection forceUnlock={true} />

        {/* Subtle gift upload link at the bottom */}
        <GiftUploadSection partyId={partyId} partyName={partyName} />
      </div>
    </div>
  )
}
