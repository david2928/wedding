'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'
import Image from 'next/image'

interface GameCardProps {
  station: {
    station_id: string
    name: string
    description: string | null
    icon: string | null
    is_active: boolean | null
  }
  isCompleted: boolean
  onClick: () => void
}

// Map station IDs to icon image paths
const getIconPath = (stationId: string): string => {
  const iconMap: Record<string, string> = {
    'sunset': '/games/sunset-icon.png',
    'golf': '/games/golf-icon.png',
    'portrait': '/games/portrait-icon.png',
    'audio': '/games/audio-icon.png',
    'selfie': '/games/selfie-icon.png',
  }
  return iconMap[stationId] || '/games/sunset-icon.png' // fallback
}

const GameCard: React.FC<GameCardProps> = ({ station, isCompleted, onClick }) => {
  const isActive = station.is_active !== false
  const iconPath = getIconPath(station.station_id)

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-300 overflow-hidden shadow-2xl ${
        isCompleted
          ? 'hover:shadow-[0_25px_50px_-12px_rgba(34,197,94,0.4)]'
          : isActive
          ? 'hover:shadow-[0_30px_60px_-15px_rgba(29,168,205,0.4)] hover:-translate-y-2'
          : 'opacity-60 cursor-not-allowed'
      }`}
      style={{
        backgroundColor: isActive ? '#FDFBF7' : '#f3f4f6',
        border: isCompleted
          ? '2px solid #86efac'
          : isActive
          ? '2px solid #eee0d2'
          : '2px solid #d1d5db'
      }}
      onClick={() => {
        if (isActive && !isCompleted) {
          onClick()
        }
      }}
    >
      {/* Coming Soon badge */}
      {!isActive && (
        <div className="absolute top-4 right-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md z-10">
          COMING SOON
        </div>
      )}

      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center space-y-5">
          {/* Icon image */}
          <div className="relative w-32 h-32">
            <Image
              src={`${iconPath}?v=6`}
              alt={station.name}
              fill
              className={`object-contain transition-opacity ${
                isCompleted
                  ? 'opacity-100'
                  : isActive
                  ? 'opacity-100'
                  : 'opacity-40 grayscale'
              }`}
              unoptimized
            />
          </div>

          {/* Title */}
          <h3 className={`font-crimson text-2xl font-bold ${
            isCompleted
              ? 'text-green-700'
              : isActive
              ? 'text-ocean-blue'
              : 'text-gray-500'
          }`}>
            {station.name}
          </h3>

          {/* Description */}
          {station.description && (
            <p className={`text-sm leading-relaxed ${
              isCompleted
                ? 'text-green-700/80'
                : isActive
                ? 'text-deep-blue/70'
                : 'text-gray-400'
            }`}>
              {station.description}
            </p>
          )}

          {/* Status Badge */}
          <div className="mt-3">
            {isCompleted ? (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg">
                <Check className="w-5 h-5 stroke-[3]" />
                COMPLETED
              </div>
            ) : !isActive ? (
              <div className="inline-flex items-center text-gray-500 font-medium text-sm px-6 py-3 rounded-full bg-gray-200">
                Stay tuned!
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-blue to-sky-blue text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow">
                TAP TO START
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default GameCard
