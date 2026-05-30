'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { hasApiKeys } from '@/lib/storage'

export default function ApiGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hasApiKeys()) {
      router.replace('/settings')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) return null

  return <>{children}</>
}
