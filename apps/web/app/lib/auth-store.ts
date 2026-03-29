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

interface StoredAccount {
  user: AuthUser
  passwordHash: string // base64 of password (demo only)
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
// Helpers — mock user database in localStorage
// ---------------------------------------------------------------------------

const USERS_DB_KEY = 'product-os-users-db'
const AUTH_COOKIE_NAME = 'product-os-token'

function getStoredAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(USERS_DB_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(accounts))
}

function findAccount(email: string): StoredAccount | undefined {
  return getStoredAccounts().find((a) => a.user.email === email)
}

function upsertAccount(user: AuthUser, password: string) {
  const accounts = getStoredAccounts().filter((a) => a.user.email !== user.email)
  accounts.push({ user, passwordHash: btoa(password) })
  saveAccounts(accounts)
}

function updateAccountUser(email: string, partial: Partial<AuthUser>) {
  const accounts = getStoredAccounts()
  const idx = accounts.findIndex((a) => a.user.email === email)
  if (idx !== -1) {
    accounts[idx].user = { ...accounts[idx].user, ...partial }
    saveAccounts(accounts)
  }
}

/** Generate a base64 demo token containing user data */
function generateToken(user: AuthUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  return btoa(JSON.stringify(payload))
}

function setAuthCookie(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

// ---------------------------------------------------------------------------
// Seed demo admin account so "Demo Login" always works
// ---------------------------------------------------------------------------

function ensureDemoAccount() {
  if (typeof window === 'undefined') return
  const existing = findAccount('admin@productOS.dev')
  if (!existing) {
    const demoUser: AuthUser = {
      id: 'user_demo_admin',
      name: 'Demo Admin',
      email: 'admin@productOS.dev',
      role: 'admin',
      orgId: 'org_demo',
      orgName: 'Product OS Demo',
      orgSlug: 'product-os-demo',
      onboarded: true,
    }
    upsertAccount(demoUser, 'admin123')
  }
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
        ensureDemoAccount()

        const account = findAccount(email)
        if (!account) {
          throw new Error('No account found with this email address')
        }
        if (account.passwordHash !== btoa(password)) {
          throw new Error('Invalid password')
        }

        const token = generateToken(account.user)
        setAuthCookie(token)

        set({
          user: account.user,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      signup: async (data: { name: string; email: string; password: string }) => {
        ensureDemoAccount()

        const existing = findAccount(data.email)
        if (existing) {
          throw new Error('An account with this email already exists')
        }

        const newUser: AuthUser = {
          id: `user_${crypto.randomUUID().slice(0, 12)}`,
          name: data.name,
          email: data.email,
          role: 'manager',
          orgId: '',
          orgName: '',
          orgSlug: '',
          onboarded: false,
        }

        upsertAccount(newUser, data.password)

        const token = generateToken(newUser)
        setAuthCookie(token)

        set({
          user: newUser,
          isAuthenticated: true,
          isLoading: false,
        })
      },

      logout: () => {
        clearAuthCookie()
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      updateProfile: (partial: Partial<AuthUser>) => {
        const current = get().user
        if (!current) return
        const updated = { ...current, ...partial }
        set({ user: updated })
        updateAccountUser(current.email, partial)

        // Refresh cookie with updated data
        const token = generateToken(updated)
        setAuthCookie(token)
      },

      setRole: (role: OrgRole) => {
        const current = get().user
        if (!current) return
        const updated = { ...current, role }
        set({ user: updated })
        updateAccountUser(current.email, { role })

        const token = generateToken(updated)
        setAuthCookie(token)
      },
    }),
    {
      name: 'product-os-auth',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          // SSR-safe no-op storage
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
        // Defer to avoid state update during useSyncExternalStore subscription
        queueMicrotask(() => state?.setHydrated())
      },
    },
  ),
)
