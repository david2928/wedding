'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Lock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { isTimeUnlocked, formatThailandTime } from '@/lib/utils/timezone'
import type { Tables } from '@/lib/supabase/types'

type Guest = Tables<'guests'>

interface SeatingSectionProps {
  partyId: string | null
}

const UNLOCK_HOUR = 18 // 6:00 PM
const UNLOCK_MINUTE = 0

const SeatingSection: React.FC<SeatingSectionProps> = ({ partyId }) => {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  // Check unlock time
  useEffect(() => {
    setIsUnlocked(isTimeUnlocked(UNLOCK_HOUR, UNLOCK_MINUTE))

    const interval = setInterval(() => {
      setIsUnlocked(isTimeUnlocked(UNLOCK_HOUR, UNLOCK_MINUTE))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Fetch guests when unlocked and partyId is available
  useEffect(() => {
    if (!isUnlocked || !partyId) {
      setLoading(false)
      return
    }

    const fetchGuests = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('party_id', partyId)
        .eq('rsvp_status', 'attending')

      if (!error && data) {
        setGuests(data)
      }
      setLoading(false)
    }

    fetchGuests()
  }, [isUnlocked, partyId])

  const unlockTimeString = formatThailandTime(UNLOCK_HOUR, UNLOCK_MINUTE)

  return (
    <div className="w-full mt-8">
      {/* Section heading */}
      <div className="text-center mb-6">
        <h2 className="font-dancing text-3xl md:text-4xl italic text-ocean-blue">
          Your Seating
        </h2>
        <p className="text-deep-blue/70 mt-2 text-sm">
          {isUnlocked ? 'Find your table for dinner' : `Revealed at ${unlockTimeString} (Thailand time)`}
        </p>
      </div>

      <Card
        className={`relative transition-all duration-300 overflow-hidden shadow-2xl max-w-2xl mx-auto ${
          isUnlocked ? '' : 'opacity-60'
        }`}
        style={{
          backgroundColor: isUnlocked ? '#FDFBF7' : '#f3f4f6',
          border: isUnlocked ? '2px solid #eee0d2' : '2px solid #d1d5db',
        }}
      >
        <CardContent className="p-6">
          {!isUnlocked ? (
            // Locked state
            <div className="flex flex-col items-center text-center py-8">
              <div className="relative w-20 h-20 mb-4">
                <div className="w-full h-full rounded-full flex items-center justify-center bg-gray-300">
                  <Users className="w-10 h-10 text-gray-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-1.5 shadow-md">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="font-dancing text-2xl font-bold text-gray-500 mb-2">
                Table Assignment
              </h3>
              <div className="inline-flex items-center gap-2 text-gray-500 font-medium text-sm px-5 py-2.5 rounded-full bg-gray-200">
                <Lock className="w-4 h-4" />
                Available at {unlockTimeString}
              </div>
            </div>
          ) : loading ? (
            // Loading state
            <div className="flex flex-col items-center text-center py-8">
              <Loader2 className="w-10 h-10 animate-spin text-ocean-blue mb-4" />
              <p className="text-deep-blue/70">Loading your seating...</p>
            </div>
          ) : guests.length === 0 ? (
            // No guests found
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-ocean-blue to-sky-blue mb-4">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-dancing text-2xl font-bold text-ocean-blue mb-2">
                Table Assignment
              </h3>
              <p className="text-deep-blue/70">
                No seating information available yet.
              </p>
            </div>
          ) : (
            // Show guests and their tables
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-ocean-blue to-sky-blue">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-dancing text-2xl font-bold text-ocean-blue">
                  Your Party
                </h3>
              </div>

              <div className="space-y-3">
                {guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm"
                  >
                    <span className="font-medium text-deep-blue">
                      {guest.first_name || 'Guest'}
                    </span>
                    {guest.table_number ? (
                      <span className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-blue to-sky-blue text-white font-bold text-sm px-4 py-2 rounded-full">
                        Table {guest.table_number}
                      </span>
                    ) : (
                      <span className="text-deep-blue/50 text-sm">
                        Table TBD
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SeatingSection
