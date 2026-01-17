'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Lock, LucideIcon } from 'lucide-react'
import Image from 'next/image'
import { isTimeUnlocked, formatThailandTime } from '@/lib/utils/timezone'

interface MenuCardProps {
  title: string
  subtitle?: string
  imagePath: string
  unlockHour: number
  unlockMinute: number
  icon: LucideIcon
  onClick: () => void
}

const MenuCard: React.FC<MenuCardProps> = ({
  title,
  subtitle,
  imagePath,
  unlockHour,
  unlockMinute,
  icon: Icon,
  onClick,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false)

  useEffect(() => {
    // Check immediately
    setIsUnlocked(isTimeUnlocked(unlockHour, unlockMinute))

    // Check every 30 seconds for updates
    const interval = setInterval(() => {
      setIsUnlocked(isTimeUnlocked(unlockHour, unlockMinute))
    }, 30000)

    return () => clearInterval(interval)
  }, [unlockHour, unlockMinute])

  const unlockTimeString = formatThailandTime(unlockHour, unlockMinute)

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-300 overflow-hidden shadow-2xl ${
        isUnlocked
          ? 'hover:shadow-[0_30px_60px_-15px_rgba(29,168,205,0.4)] hover:-translate-y-2'
          : 'opacity-60 cursor-not-allowed'
      }`}
      style={{
        backgroundColor: isUnlocked ? '#FDFBF7' : '#f3f4f6',
        border: isUnlocked ? '2px solid #eee0d2' : '2px solid #d1d5db',
      }}
      onClick={() => {
        if (isUnlocked) {
          onClick()
        }
      }}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Menu icon/preview */}
          <div className="relative w-24 h-24">
            <div
              className={`w-full h-full rounded-full flex items-center justify-center ${
                isUnlocked
                  ? 'bg-gradient-to-br from-ocean-blue to-sky-blue'
                  : 'bg-gray-300'
              }`}
            >
              <Icon
                className={`w-12 h-12 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}
              />
            </div>
            {/* Lock badge for locked state */}
            {!isUnlocked && (
              <div className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-1.5 shadow-md">
                <Lock className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="text-center">
            <h3
              className={`font-dancing text-2xl font-bold ${
                isUnlocked ? 'text-ocean-blue' : 'text-gray-500'
              }`}
            >
              {title}
            </h3>
            {subtitle && (
              <p className={`text-xs mt-1 ${isUnlocked ? 'text-deep-blue/60' : 'text-gray-400'}`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Action button/status */}
          <div className="mt-2">
            {isUnlocked ? (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-ocean-blue to-sky-blue text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-shadow">
                TAP TO VIEW
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-gray-500 font-medium text-sm px-5 py-2.5 rounded-full bg-gray-200">
                <Lock className="w-4 h-4" />
                Available at {unlockTimeString}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MenuCard
