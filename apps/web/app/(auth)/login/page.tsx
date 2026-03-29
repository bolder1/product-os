'use client'

import { useState, Suspense, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate() {
    const e: typeof errors = {}
    if (!email) {
      e.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Invalid email format'
    }
    if (!password) {
      e.password = 'Password is required'
    } else if (password.length < 6) {
      e.password = 'Password must be at least 6 characters'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    setErrors((p) => ({ ...p, form: undefined }))
    try {
      await login(email, password)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setErrors((p) => ({ ...p, form: message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDemoLogin() {
    setIsSubmitting(true)
    setErrors({})
    try {
      await login('admin@productOS.dev', 'admin123')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Demo login failed.'
      setErrors({ form: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8">
        {/* Logo + Tagline */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-14 h-14 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center"
            style={{ boxShadow: '0 0 32px rgba(59,130,246,0.15)' }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="8" r="3" fill="#3B82F6" />
              <circle cx="8" cy="22" r="3" fill="#8B5CF6" />
              <circle cx="24" cy="22" r="3" fill="#06B6D4" />
              <line x1="16" y1="11" x2="8" y2="19" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />
              <line x1="16" y1="11" x2="24" y2="19" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
              <line x1="11" y1="22" x2="21" y2="22" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#F1F5F9]">Sign in to Product OS</h1>
          <p className="text-sm text-[#94A3B8]">Enter your credentials to continue</p>
        </div>

        {/* Form-level error */}
        {errors.form && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <p className="text-sm text-red-400">{errors.form}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, form: undefined })) }}
                className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-1 transition ${
                  errors.email
                    ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                    : 'border-white/[0.08] focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/30'
                }`}
              />
            </div>
            {errors.email && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 mt-1.5 ml-1">
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined, form: undefined })) }}
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/[0.03] border text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:ring-1 transition ${
                  errors.password
                    ? 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/30'
                    : 'border-white/[0.08] focus:border-[#3B82F6]/50 focus:ring-[#3B82F6]/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-400 mt-1.5 ml-1">
                {errors.password}
              </motion.p>
            )}
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <Link href="/login" className="text-xs text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-2.5 rounded-lg bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-xs text-[#64748B]">or</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Demo Login */}
        <motion.button
          type="button"
          onClick={handleDemoLogin}
          disabled={isSubmitting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#C4B5FD] font-medium hover:bg-[#8B5CF6]/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mb-2.5"
        >
          <Zap size={16} />
          Demo Login (Admin)
        </motion.button>

        {/* OAuth buttons */}
        <div className="flex flex-col gap-2.5">
          <button className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#94A3B8] font-medium hover:bg-white/[0.05] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <button className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[#94A3B8] font-medium hover:bg-white/[0.05] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Sign up link */}
        <p className="text-center text-sm text-[#94A3B8] mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#3B82F6] hover:text-[#60A5FA] font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
