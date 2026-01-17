'use client'

import React from 'react'
import Image from 'next/image'

const HeroWelcome: React.FC = () => {
  return (
    <div className="w-full flex justify-center mb-8">
      <div className="relative w-full max-w-2xl">
        <div className="rounded-2xl overflow-hidden shadow-2xl">
          <Image
            src="/welcome.png"
            alt="Welcome to Chanika & David's Wedding"
            width={800}
            height={600}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  )
}

export default HeroWelcome
