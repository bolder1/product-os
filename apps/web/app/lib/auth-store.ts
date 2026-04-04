'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { OrgRole } from './role-config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string
  name: string
  email: string
  role: OrgRole
  avatar?: string
  orgId: string
  orgName: string
  orgSlug: string
  onboarded?: boolean
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  _hydrated: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  signup: (data: { name: string; email: string; password: string }) => Promise<void>
  logout: () => void
  updateProfile: (partial: Partial<AuthUser>) => void
  setRole: (role: OrgRole) => void
  setHydrated: () => void
}

// ---------------------------------------------------------------------------
// API helpers — call tRPC endpoints directly via fetch
// (We can't use the trpc hooks here since this is outside the React tree)
// ---------------------------------------------------------------------------

async function apiCall<T>(procedure: string, input: unknown): Promise<T> {
  const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3006'
  const res = await fetch(`${baseUrl}/api/trpc/${procedure}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(typeof window !== 'undefined' && localStorage.getItem('product-os-session-token')
        ? { authorization: `Bearer ${localStorage.getItem('product-os-session-token')}` }
        : {}),
      ...(typeof window !== 'undefined' && localStorage.getItem('product-os-org-id')
        ? { 'x-org-id': localStorage.getItem('product-os-org-id')! }
        : {}),
    },
    body: JSON.stringify(input),
  })

  const json = await res.json()

  if (json.error) {
    const msg = json.error.json?.message ?? json.error.message ?? 'Request failed'
    throw new Error(msg)
  }

  // tRPC + superjson wraps the payload: result.data.json holds the actual data
  const data = json.result?.data
  return (data?.json ?? data) as T
}

/** Map DB membership roles to frontend OrgRole values */
function mapDbRole(dbRole: string): OrgRole {
  const mapping: Record<string, OrgRole> = {
    owner: 'admin',
    admin: 'admin',
    editor: 'manager',
    viewer: 'viewer',
    guest: 'viewer',
  }
  return mapping[dbRole] ?? 'viewer'
}

function setSessionTokens(token: string, orgId: string) {
  localStorage.setItem('product-os-session-token', token)
  localStorage.setItem('product-os-org-id', orgId)
}

function clearSessionTokens() {
  localStorage.removeItem('product-os-session-token')
  localStorage.removeItem('product-os-org-id')
}

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      _hydrated: false,

      setHydrated: () => set({ _hydrated: true, isLoading: false }),

      login: async (email: string, password: string) => {
        const result = await apiCall<{
          token: string
          user: { id: string; name: string; email: string; avatarUrl: string | null }
          org: { id: string; name: string; slug: string; role: string } | null
        }>('auth.login', { json: { email, password } })

        if (!result.org) {
          throw new Error('User has no organization membership')
        }

        setSessionTokens(result.token, result.org.id)

        const authUser: AuthUser = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatar: result.user.avatarUrl ?? undefined,
          role: mapDbRole(result.org.role),
          orgId: result.org.id,
          orgName: result.org.name,
          orgSlug: result.org.slug,
          onboarded: true,
        }

        set({
          user: authUser,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      signup: async (data: { name: string; email: string; password: string }) => {
        const result = await apiCall<{
          token: string
          user: { id: string; name: string; email: string; avatarUrl: string | null }
          org: null
        }>('auth.signup', { json: data })

        localStorage.setItem('product-os-session-token', result.token)

        const authUser: AuthUser = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: 'admin',
          orgId: '',
          orgName: '',
          orgSlug: '',
          onboarded: false,
        }

        set({
          user: authUser,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        // Fire-and-forget API call to delete server session
        apiCall('auth.logout', { json: {} }).catch(() => {})
        clearSessionTokens()
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      updateProfile: (partial: Partial<AuthUser>) => {
        const current = get().user
        if (!current) return
        set({ user: { ...current, ...partial } })
      },

      setRole: (role: OrgRole) => {
        const current = get().user
        if (!current) return
        set({ user: { ...current, role } })
      },
    }),
    {
      name: 'product-os-auth',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return localStorage
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        queueMicrotask(() => state?.setHydrated())
      },
    },
  ),
)
