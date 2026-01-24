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
  forceUnlock?: boolean
}

const UNLOCK_HOUR = 18 // 6:00 PM
const UNLOCK_MINUTE = 0

// Helper to parse seat code like "A-L5" into { table: 'A', side: 'L', seatNum: 5 }
const parseSeatCode = (seatCode: string | null) => {
  if (!seatCode) return null
  // Handle old format (just letter like "A") or new format ("A-L5")
  const match = seatCode.match(/^([A-E])(?:-([LR])(\d+))?$/)
  if (!match) return null
  return {
    table: match[1],
    side: match[2] as 'L' | 'R' | undefined,
    seatNum: match[3] ? parseInt(match[3], 10) : undefined
  }
}

// Format seat info for display
const formatSeatInfo = (seatCode: string | null) => {
  const parsed = parseSeatCode(seatCode)
  if (!parsed) return null
  if (parsed.side && parsed.seatNum) {
    const sideLabel = parsed.side === 'L' ? 'Left' : 'Right'
    return { table: parsed.table, detail: `${sideLabel} side, Seat ${parsed.seatNum}` }
  }
  return { table: parsed.table, detail: null }
}

// Mini floor plan component showing the 5 long tables layout
interface MiniFloorPlanProps {
  highlightedTable: string | null
  seatDetail?: string | null
  seatSide?: 'L' | 'R' | null
  seatNum?: number | null
}

const MiniFloorPlan: React.FC<MiniFloorPlanProps> = ({ highlightedTable, seatDetail, seatSide, seatNum }) => {
  // Tables with seats per side (12, 9, 6, 9, 12)
  const tables = [
    { letter: 'A', height: 96, seatsPerSide: 12 },
    { letter: 'B', height: 72, seatsPerSide: 9 },
    { letter: 'C', height: 48, seatsPerSide: 6 },
    { letter: 'D', height: 72, seatsPerSide: 9 },
    { letter: 'E', height: 96, seatsPerSide: 12 },
  ]

  return (
    <div className="mt-6 p-5 bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl border border-gray-200">
      <p className="text-xs text-center text-deep-blue/60 mb-4 font-medium uppercase tracking-wide">
        Find Your Seat
      </p>

      <div className="relative w-full max-w-md mx-auto bg-white border border-gray-300 p-4">
        {/* Stage at top center */}
        <div className="flex justify-center mb-3">
          <div className="bg-purple-200 border border-purple-400 px-8 py-2">
            <span className="text-xs text-purple-700 font-medium">Stage</span>
          </div>
        </div>

        {/* B&G positioned above Table C */}
        <div className="flex justify-center mb-3">
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 px-3 py-1">
            <span className="text-sm">👰</span>
            <span className="text-[10px] text-gray-600 font-medium">B&G</span>
            <span className="text-sm">🤵</span>
          </div>
        </div>

        {/* Tables aligned at bottom */}
        <div className="flex justify-center items-end gap-3">
          {tables.map(({ letter, height, seatsPerSide }) => {
            const isHighlighted = highlightedTable === letter
            const tableWidth = 28

            // Calculate seat dot position if this is the highlighted table
            let seatDotStyle: React.CSSProperties | null = null
            if (isHighlighted && seatSide && seatNum) {
              const seatPosition = ((seatNum - 0.5) / seatsPerSide) * 100
              seatDotStyle = {
                position: 'absolute',
                top: `${seatPosition}%`,
                [seatSide === 'L' ? 'left' : 'right']: -5,
                transform: 'translateY(-50%)',
              }
            }

            return (
              <div
                key={letter}
                className="flex flex-col items-center"
              >
                {/* Long Table with seat indicator */}
                <div
                  className={`relative flex items-center justify-center ${
                    isHighlighted
                      ? 'bg-ocean-blue z-10'
                      : 'bg-gray-500'
                  }`}
                  style={{
                    width: tableWidth,
                    height,
                    border: isHighlighted ? '2px solid #0ea5e9' : '2px solid #4b5563'
                  }}
                >
                  <span className={`font-bold text-white text-xs`}>
                    {letter}
                  </span>

                  {/* Seat position dot */}
                  {seatDotStyle && (
                    <div
                      style={seatDotStyle}
                      className="w-3 h-3 bg-yellow-400 border-2 border-yellow-600 rounded-full shadow-lg animate-pulse"
                      title={`Your seat: ${seatSide === 'L' ? 'Left' : 'Right'} side, Seat ${seatNum}`}
                    />
                  )}
                </div>

                {/* Table label below */}
                <span className={`text-[10px] mt-1 ${isHighlighted ? 'font-bold text-ocean-blue' : 'text-gray-500'}`}>
                  {letter}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend for seat dot */}
        {seatSide && seatNum && (
          <div className="mt-2 flex justify-center items-center gap-1 text-[10px] text-gray-500">
            <div className="w-2 h-2 bg-yellow-400 border border-yellow-600 rounded-full" />
            <span>= Your seat</span>
          </div>
        )}
      </div>

      {highlightedTable && (
        <div className="mt-4 text-center">
          <p className="text-lg font-bold text-ocean-blue">
            Table {highlightedTable}
          </p>
          {seatDetail && (
            <p className="text-sm text-deep-blue/70 mt-1">
              {seatDetail}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const SeatingSection: React.FC<SeatingSectionProps> = ({ partyId, forceUnlock = false }) => {
  const [isUnlocked, setIsUnlocked] = useState(forceUnlock)
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  // Check unlock time
  useEffect(() => {
    if (forceUnlock) {
      setIsUnlocked(true)
      return
    }

    setIsUnlocked(isTimeUnlocked(UNLOCK_HOUR, UNLOCK_MINUTE))

    const interval = setInterval(() => {
      setIsUnlocked(isTimeUnlocked(UNLOCK_HOUR, UNLOCK_MINUTE))
    }, 30000)

    return () => clearInterval(interval)
  }, [forceUnlock])

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
        .eq('rsvp_status', 'Attending')

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
                {guests.map((guest) => {
                  const seatInfo = formatSeatInfo(guest.table_number)
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm"
                    >
                      <span className="font-medium text-deep-blue">
                        {guest.first_name || 'Guest'}
                      </span>
                      {seatInfo ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-blue to-sky-blue text-white font-bold text-sm px-4 py-2 rounded-full">
                            Table {seatInfo.table}
                          </span>
                          {seatInfo.detail && (
                            <p className="text-xs text-deep-blue/60 mt-1">
                              {seatInfo.detail}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-deep-blue/50 text-sm">
                          Table TBD
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Show floor plan if any guest has a table assigned */}
              {(() => {
                const guestWithTable = guests.find(g => g.table_number)
                if (!guestWithTable) return null
                const parsed = parseSeatCode(guestWithTable.table_number)
                const seatInfo = formatSeatInfo(guestWithTable.table_number)
                return (
                  <MiniFloorPlan
                    highlightedTable={parsed?.table || null}
                    seatDetail={seatInfo?.detail}
                    seatSide={parsed?.side || null}
                    seatNum={parsed?.seatNum || null}
                  />
                )
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SeatingSection
