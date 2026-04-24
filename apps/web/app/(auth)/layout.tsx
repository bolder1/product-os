'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../lib/auth-store'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const onboarded = useAuthStore((s) => s.user?.onboarded)
  const hydrated = useAuthStore((s) => s._hydrated)

  // Only redirect fully-onboarded users away from auth pages.
  // Users who are authenticated but haven't completed onboarding (no org yet)
  // must be able to reach /onboarding, which lives in this route group.
  const fullyAuthenticated = isAuthenticated && onboarded

  useEffect(() => {
    if (hydrated && fullyAuthenticated) {
      router.replace('/')
    }
  }, [hydrated, fullyAuthenticated, router])

  if (!hydrated) {
    return <div className="min-h-screen bg-[var(--bg-base)]" />
  }

  if (fullyAuthenticated) {
    return <div className="min-h-screen bg-[var(--bg-base)]" />
  }

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)]">
      {children}
    </div>
  )
}
