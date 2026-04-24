'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../lib/auth-store'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hydrated = useAuthStore((s) => s._hydrated)
  const orgId = useAuthStore((s) => s.user?.orgId)

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    // If user has no orgId at all, they need to complete onboarding to create an org
    if (!orgId) {
      router.replace('/onboarding')
    }
  }, [hydrated, isAuthenticated, orgId, router])

  // While the store is rehydrating from localStorage, render nothing to avoid flash
  if (!hydrated) {
    return <div className="min-h-screen bg-[var(--bg-base)]" />
  }

  // Not authenticated — redirect is in-flight, render nothing
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-[var(--bg-base)]" />
  }

  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
