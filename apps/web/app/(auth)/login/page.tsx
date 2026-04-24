'use client'

import { useState, Suspense, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Zap, UserPlus } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

/** Floating product-graph SVG illustration — right side of screen on desktop */
function ProductGraphIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:block absolute right-[6%] top-1/2 -translate-y-1/2 pointer-events-none select-none"
      style={{ animation: 'float 6s ease-in-out infinite' }}
    >
      <svg width="380" height="420" viewBox="0 0 380 420" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Connection paths */}
        <motion.path
          d="M190 80 C 160 140, 120 160, 90 200"
          stroke="rgba(99,152,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
        />
        <motion.path
          d="M190 80 C 220 140, 260 160, 290 200"
          stroke="rgba(139,92,246,0.25)" strokeWidth="1.5" strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.7, ease: 'easeOut' }}
        />
        <motion.path
          d="M90 200 C 120 260, 150 280, 190 310"
          stroke="rgba(6,182,212,0.25)" strokeWidth="1.5" strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.9, ease: 'easeOut' }}
        />
        <motion.path
          d="M290 200 C 260 260, 230 280, 190 310"
          stroke="rgba(99,152,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.1, ease: 'easeOut' }}
        />
        <motion.path
          d="M90 200 C 140 220, 160 220, 195 200"
          stroke="rgba(139,92,246,0.18)" strokeWidth="1" strokeDasharray="3 6"
          fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 1.3, ease: 'easeOut' }}
        />
        <motion.path
          d="M290 200 C 240 220, 220 220, 185 200"
          stroke="rgba(6,182,212,0.18)" strokeWidth="1" strokeDasharray="3 6"
          fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 1.5, ease: 'easeOut' }}
        />
        <motion.path
          d="M190 310 C 190 340, 190 355, 190 370"
          stroke="rgba(99,152,255,0.2)" strokeWidth="1.5" strokeDasharray="4 4"
          fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 1.7, ease: 'easeOut' }}
        />

        {/* Outer pulse rings */}
        <motion.circle cx="190" cy="80" r="28" fill="rgba(99,152,255,0.04)"
          animate={{ r: [28, 44], opacity: [0.4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0 }}
        />
        <motion.circle cx="90" cy="200" r="22" fill="rgba(139,92,246,0.04)"
          animate={{ r: [22, 38], opacity: [0.4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 0.8 }}
        />
        <motion.circle cx="290" cy="200" r="22" fill="rgba(6,182,212,0.04)"
          animate={{ r: [22, 38], opacity: [0.4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut', delay: 1.2 }}
        />

        {/* Main nodes */}
        {/* Top centre — blue */}
        <motion.circle cx="190" cy="80" r="14"
          fill="rgba(99,152,255,0.12)" stroke="rgba(99,152,255,0.5)" strokeWidth="1.5"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 260 }}
          style={{ transformOrigin: '190px 80px' }}
        />
        <circle cx="190" cy="80" r="5" fill="var(--accent)" />

        {/* Left — purple */}
        <motion.circle cx="90" cy="200" r="12"
          fill="rgba(139,92,246,0.12)" stroke="rgba(139,92,246,0.5)" strokeWidth="1.5"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4, type: 'spring', stiffness: 260 }}
          style={{ transformOrigin: '90px 200px' }}
        />
        <circle cx="90" cy="200" r="4.5" fill="var(--accent)" />

        {/* Right — cyan */}
        <motion.circle cx="290" cy="200" r="12"
          fill="rgba(6,182,212,0.12)" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, type: 'spring', stiffness: 260 }}
          style={{ transformOrigin: '290px 200px' }}
        />
        <circle cx="290" cy="200" r="4.5" fill="var(--accent)" />

        {/* Bottom centre — blue */}
        <motion.circle cx="190" cy="310" r="14"
          fill="rgba(99,152,255,0.12)" stroke="rgba(99,152,255,0.4)" strokeWidth="1.5"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8, type: 'spring', stiffness: 260 }}
          style={{ transformOrigin: '190px 310px' }}
        />
        <circle cx="190" cy="310" r="5" fill="var(--accent)" />

        {/* Small satellite nodes */}
        <motion.circle cx="145" cy="135" r="7"
          fill="rgba(99,152,255,0.08)" stroke="rgba(99,152,255,0.35)" strokeWidth="1"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1.0, type: 'spring' }}
          style={{ transformOrigin: '145px 135px' }}
        />
        <circle cx="145" cy="135" r="2.5" fill="rgba(99,152,255,0.7)" />

        <motion.circle cx="235" cy="135" r="7"
          fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.35)" strokeWidth="1"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1.2, type: 'spring' }}
          style={{ transformOrigin: '235px 135px' }}
        />
        <circle cx="235" cy="135" r="2.5" fill="rgba(139,92,246,0.7)" />

        <motion.circle cx="190" cy="370" r="6"
          fill="rgba(6,182,212,0.08)" stroke="rgba(6,182,212,0.3)" strokeWidth="1"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 1.4, type: 'spring' }}
          style={{ transformOrigin: '190px 370px' }}
        />
        <circle cx="190" cy="370" r="2" fill="rgba(6,182,212,0.6)" />
      </svg>
    </motion.div>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const searchParams = useSearchParams()
  const isAddAccount = searchParams.get('mode') === 'add'

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
      await login('demo@productos.dev', 'demo123')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Demo login failed.'
      setErrors({ form: message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating graph illustration — desktop only */}
      <ProductGraphIllustration />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] backdrop-blur-2xl p-8 shadow-[var(--shadow-panel)]"
        >
          {/* Add-account banner */}
          {isAddAccount && (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-xl bg-[var(--accent-muted)] border border-[var(--border-accent)] text-[var(--accent-text)]">
              <UserPlus size={15} className="flex-shrink-0" />
              <p className="text-[12px] leading-snug">
                Sign in with a different account. Your current session stays active.
              </p>
            </div>
          )}

          {/* Logo + Tagline */}
          <div className="flex flex-col items-center gap-3 mb-8">
            {/* Product OS badge */}
            <div className="px-3 py-1 rounded-full border border-[var(--border-accent)] bg-[var(--accent-subtle)] mb-1">
              <span className="text-[11px] font-medium tracking-wider uppercase text-[var(--accent-text)]">
                Product OS
              </span>
            </div>

            <motion.div
              className="w-14 h-14 rounded-xl border border-[var(--border-default)] bg-[var(--bg-inset)] flex items-center justify-center"
              style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="8" r="3" fill="var(--accent)" />
                <circle cx="8" cy="22" r="3" fill="var(--accent)" fillOpacity="0.7" />
                <circle cx="24" cy="22" r="3" fill="var(--accent)" fillOpacity="0.85" />
                <line x1="16" y1="11" x2="8" y2="19" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1.5" />
                <line x1="16" y1="11" x2="24" y2="19" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1.5" />
                <line x1="11" y1="22" x2="21" y2="22" stroke="var(--accent)" strokeOpacity="0.4" strokeWidth="1.5" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              {isAddAccount ? 'Add another account' : 'Sign in to Product OS'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {isAddAccount ? 'Enter the credentials for the new account' : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* Form-level error */}
          {errors.form && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-[var(--color-error-muted)] border border-[var(--color-error-border)]"
            >
              <p className="text-sm text-[var(--color-error)]">{errors.form}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, form: undefined })) }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--bg-inset)] border text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none transition ${
                    errors.email
                      ? 'border-[var(--color-error-border)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_3px_var(--color-error-muted)]'
                      : 'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]'
                  }`}
                />
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-[var(--color-error)] mt-1.5 ml-1">
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined, form: undefined })) }}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--bg-inset)] border text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none transition ${
                    errors.password
                      ? 'border-[var(--color-error-border)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_3px_var(--color-error-muted)]'
                      : 'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-[var(--color-error)] mt-1.5 ml-1">
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-[var(--accent-text)] hover:text-[var(--accent-hover)] transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-[var(--color-white)] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--border-default)]" />
            <span className="text-xs text-[var(--text-tertiary)]">or</span>
            <div className="flex-1 h-px bg-[var(--border-default)]" />
          </div>

          {/* Demo Login */}
          <motion.button
            type="button"
            onClick={handleDemoLogin}
            disabled={isSubmitting}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-[var(--border-accent)] bg-[var(--accent-subtle)] text-[var(--accent-text)] font-medium hover:bg-[var(--accent-muted)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors mb-2.5"
          >
            <Zap size={16} />
            Demo Login (Admin)
          </motion.button>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => setErrors({ form: 'Google sign-in is coming soon. Use email/password or Demo Login.' })}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface-hover)] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => setErrors({ form: 'GitHub sign-in is coming soon. Use email/password or Demo Login.' })}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface-hover)] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[var(--accent-text)] hover:text-[var(--accent-hover)] font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </>
  )
}
