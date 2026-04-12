'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../lib/auth-store'
import type { OrgRole } from '../lib/role-config'
import { hasStudioAccess } from '../lib/role-config'

interface ProtectedRouteProps {
  children: React.ReactNode
  /** Required roles — if empty, any authenticated user is allowed */
  allowedRoles?: OrgRole[]
  /** Studio key to check access against role-config */
  requiredStudio?: string
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#060918' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#64748B]">Loading...</p>
      </div>
    </div>
  )
}

function AccessDenied() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#060918' }}>
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#EF4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">Access Denied</h2>
          <p className="text-sm text-[#94A3B8]">
            You don&apos;t have permission to access this page. Contact your administrator
            if you believe this is an error.
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 rounded-lg bg-[#3B82F6] text-white text-sm font-medium hover:bg-[#2563EB] transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children, allowedRoles, requiredStudio }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, _hydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!_hydrated) return
    if (!isAuthenticated || !user) {
      router.push('/login')
    }
  }, [_hydrated, isAuthenticated, user, router])

  // Still loading / hydrating
  if (isLoading || !_hydrated) {
    return <LoadingSkeleton />
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <LoadingSkeleton />
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <AccessDenied />
  }

  // Check studio-level access
  if (requiredStudio && !hasStudioAccess(user.role, requiredStudio)) {
    return <AccessDenied />
  }

  return <>{children}</>
}
