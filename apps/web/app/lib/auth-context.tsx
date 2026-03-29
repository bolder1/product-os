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
import { useAuthStore, type AuthUser } from './auth-store'
import type { OrgRole } from './role-config'

// Re-export the User type so existing imports keep working
export type User = AuthUser

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  updateUser: (partial: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const storeLogin = useAuthStore((s) => s.login)
  const storeSignup = useAuthStore((s) => s.signup)
  const storeLogout = useAuthStore((s) => s.logout)
  const storeUpdateProfile = useAuthStore((s) => s.updateProfile)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch: render children only after client mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      await storeLogin(email, password)
      // Check if user needs onboarding
      const currentUser = useAuthStore.getState().user
      if (currentUser && !currentUser.onboarded) {
        router.push('/onboarding')
      } else {
        router.push('/')
      }
    },
    [storeLogin, router],
  )

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      await storeSignup({ name, email, password })
      router.push('/onboarding')
    },
    [storeSignup, router],
  )

  const logout = useCallback(() => {
    storeLogout()
    router.push('/login')
  }, [storeLogout, router])

  const updateUser = useCallback(
    (partial: Partial<User>) => {
      storeUpdateProfile(partial)
    },
    [storeUpdateProfile],
  )

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading: !mounted || isLoading,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
