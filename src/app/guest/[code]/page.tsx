'use client'

import { useParams } from 'next/navigation'
import GuestInfoForm from '@/components/GuestInfoForm'

export default function GuestPage() {
  const params = useParams()
  const code = params.code as string

  return <GuestInfoForm code={code} />
}
