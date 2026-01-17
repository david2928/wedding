'use client'

import React from 'react'
import Link from 'next/link'
import { Trophy, Camera } from 'lucide-react'

const PHOTO_ALBUM_URL = 'https://photos.app.goo.gl/TRjQuhfqExxq76cF6'

const QuickLinks: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
      {/* Guest Activities Link */}
      <Link
        href="/games"
        className="floating-card p-6 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-2"
        style={{
          backgroundColor: '#FDFBF7',
          border: '2px solid #eee0d2',
        }}
      >
        <Trophy className="w-8 h-8 text-ocean-blue" />
        <span className="font-dancing text-2xl text-ocean-blue">Win Prizes</span>
      </Link>

      {/* Photo Album Link */}
      <a
        href={PHOTO_ALBUM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-card p-6 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 hover:-translate-y-2"
        style={{
          backgroundColor: '#FDFBF7',
          border: '2px solid #eee0d2',
        }}
      >
        <Camera className="w-8 h-8 text-ocean-blue" />
        <span className="font-dancing text-2xl text-ocean-blue">Photo Album</span>
      </a>
    </div>
  )
}

export default QuickLinks
