'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LiveQuizRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/quiz')
  }, [router])

  return null
}
