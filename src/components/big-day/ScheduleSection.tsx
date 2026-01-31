'use client'

import React from 'react'
import { Clock, Heart, Wine, UtensilsCrossed, Music, Moon, PartyPopper } from 'lucide-react'

interface ScheduleItem {
  time: string
  title: string
  description: string
  icon: typeof Clock
}

const schedule: ScheduleItem[] = [
  {
    time: '15:00',
    title: 'Guest Arrival',
    description: 'Arrive, settle in, explore & take photos',
    icon: Clock,
  },
  {
    time: '16:00',
    title: 'Vow Ceremony',
    description: 'Please be seated by this time',
    icon: Heart,
  },
  {
    time: '16:30',
    title: 'Cocktails & Canapes',
    description: 'Sip, snack & mingle',
    icon: Wine,
  },
  {
    time: '18:45',
    title: 'Reception',
    description: 'Dinner & celebrations begin',
    icon: UtensilsCrossed,
  },
  {
    time: '21:00',
    title: 'After Party',
    description: 'Music up, fun guaranteed',
    icon: Music,
  },
  {
    time: '23:00',
    title: 'Late Night Party',
    description: 'Villa 1005 for night owls',
    icon: Moon,
  },
]

const ScheduleSection: React.FC = () => {
  return (
    <div className="w-full mb-8">
      {/* Section heading */}
      <div className="text-center mb-6">
        <h2 className="font-dancing text-3xl md:text-4xl italic text-ocean-blue">
          The Day's Schedule
        </h2>
        <p className="text-deep-blue/70 mt-2 text-sm">
          January 31, 2026
        </p>
      </div>

      {/* Schedule timeline */}
      <div
        className="floating-card p-6 max-w-md mx-auto"
        style={{
          backgroundColor: '#FDFBF7',
          border: '2px solid #eee0d2',
        }}
      >
        <div className="space-y-4">
          {schedule.map((item, index) => {
            const Icon = item.icon
            return (
              <div key={index} className="flex items-start gap-4">
                {/* Time column */}
                <div className="flex-shrink-0 w-14 text-right">
                  <span className="text-ocean-blue font-semibold text-sm">
                    {item.time}
                  </span>
                </div>

                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-ocean-blue/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-ocean-blue" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-4 border-b border-dashed border-ocean-blue/20 last:border-0 last:pb-0">
                  <h3 className="font-crimson text-base text-deep-blue font-medium">
                    {item.title}
                  </h3>
                  <p className="text-deep-blue/60 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ScheduleSection
