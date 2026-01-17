'use client'

import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import HeroWelcome from '@/components/big-day/HeroWelcome'
import QuickLinks from '@/components/big-day/QuickLinks'
import MenuSection from '@/components/big-day/MenuSection'
import SeatingSection from '@/components/big-day/SeatingSection'
import { GuestGate } from '@/components/GuestGate'
import { isDevModeEnabled, enableDevMode } from '@/lib/utils/devMode'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/lib/supabase/types'

type Party = Tables<'parties'>

export default function BigDayPage() {
  const [devMode, setDevMode] = useState(false)
  const [devModeChecked, setDevModeChecked] = useState(false)
  const [party, setParty] = useState<Party | null>(null)

  useEffect(() => {
    const wasDevModeEnabled = isDevModeEnabled()
    if (wasDevModeEnabled) {
      setDevMode(true)
      // In dev mode, fetch a test party
      fetchTestParty()
    }
    setDevModeChecked(true)
  }, [])

  const fetchTestParty = async () => {
    const { data } = await supabase
      .from('parties')
      .select('*')
      .limit(1)
      .single()
    if (data) {
      setParty(data)
    }
  }

  const handleDevBypass = () => {
    enableDevMode()
    setDevMode(true)
    fetchTestParty()
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

  // Dev mode active - show content directly
  if (devMode) {
    return <BigDayContent partyId={party?.id || null} />
  }

  // Production - use GuestGate
  return (
    <GuestGate pageName="the big day info" onPartyResolved={handlePartyResolved}>
      <BigDayContent partyId={party?.id || null} />
    </GuestGate>
  )
}

interface BigDayContentProps {
  partyId: string | null
}

function BigDayContent({ partyId }: BigDayContentProps) {
  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: '#fcf6eb' }}
    >
      <div className="max-w-5xl mx-auto">
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

        {/* Seating Section */}
        <SeatingSection partyId={partyId} />

        {/* Menu Section */}
        <MenuSection />
      </div>
    </div>
  )
}
