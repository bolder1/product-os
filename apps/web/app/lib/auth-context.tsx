'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import type { OrgRole } from './role-config'

export interface User {
  id: string
  name: string
  email: string
  role: OrgRole
  avatar?: string
  orgId: string
  orgName: string
  orgSlug: string
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  updateUser: (partial: Partial<User>) => void
}

const AUTH_STORAGE_KEY = 'product-os-auth-user'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoading(false)
    }
  }, [])

  const persistUser = useCallback((u: User | null) => {
    setUser(u)
    if (u) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [])

  const login = useCallback(
    async (email: string, _password: string) => {
      // Mock login — in production this calls an API
      const mockUser: User = {
        id: crypto.randomUUID(),
        name: email.split('@')[0],
        email,
        role: 'manager',
        orgId: 'org_default',
        orgName: 'My Organization',
        orgSlug: 'my-org',
      }
      persistUser(mockUser)
      router.push('/')
    },
    [persistUser, router],
  )

  const signup = useCallback(
    async (name: string, email: string, _password: string) => {
      const mockUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        role: 'manager',
        orgId: '',
        orgName: '',
        orgSlug: '',
      }
      persistUser(mockUser)
      router.push('/onboarding')
    },
    [persistUser, router],
  )

  const logout = useCallback(() => {
    persistUser(null)
    router.push('/login')
  }, [persistUser, router])

  const updateUser = useCallback(
    (partial: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev
        const updated = { ...prev, ...partial }
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated))
        return updated
      })
    },
    [],
  )

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
