'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="8" r="3" fill="var(--color-white)" />
          <circle cx="8" cy="22" r="3" fill="var(--color-white)" fillOpacity="0.85" />
          <circle cx="24" cy="22" r="3" fill="var(--color-white)" fillOpacity="0.95" />
          <line x1="16" y1="11" x2="8" y2="19" stroke="var(--color-white)" strokeOpacity="0.7" strokeWidth="1.5" />
          <line x1="16" y1="11" x2="24" y2="19" stroke="var(--color-white)" strokeOpacity="0.7" strokeWidth="1.5" />
          <line x1="11" y1="22" x2="21" y2="22" stroke="var(--color-white)" strokeOpacity="0.7" strokeWidth="1.5" />
        </svg>
      </div>
      <span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Product OS</span>
    </div>
  )
}

export default function SignupPage() {
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Full name is required'
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
    if (!confirmPassword) {
      e.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      e.confirmPassword = 'Passwords do not match'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    setErrors((p) => {
      const n = { ...p }
      delete n.form
      return n
    })
    try {
      await signup(name, email, password)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed. Please try again.'
      setErrors((p) => ({ ...p, form: message }))
    } finally {
      setIsSubmitting(false)
    }
  }

  function clearError(key: string) {
    setErrors((p) => {
      const n = { ...p }
      delete n[key]
      delete n.form
      return n
    })
  }

  const inputBase =
    'w-full h-11 px-3.5 rounded-lg bg-[var(--bg-inset)] border text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none transition'
  const inputOk =
    'border-[var(--border-default)] focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--accent-subtle)]'
  const inputErr =
    'border-[var(--color-error-border)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_3px_var(--color-error-muted)]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-[420px]"
    >
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-panel)] backdrop-blur-xl">
        {/* Brand mark */}
        <div className="mb-8">
          <BrandMark />
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Create your account</h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Get started with Product OS in under a minute.</p>
        </div>

        {/* Form-level error */}
        {errors.form && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-muted)] p-3"
          >
            <p className="text-xs text-[var(--color-error)]">{errors.form}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Full name<span className="ml-0.5 text-[var(--accent)]">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                clearError('name')
              }}
              className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
            />
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-xs text-[var(--color-error)]"
              >
                {errors.name}
              </motion.p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Email<span className="ml-0.5 text-[var(--accent)]">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError('email')
              }}
              className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-xs text-[var(--color-error)]"
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Password<span className="ml-0.5 text-[var(--accent)]">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError('password')
                }}
                className={`${inputBase} pr-10 ${errors.password ? inputErr : inputOk}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-xs text-[var(--color-error)]"
              >
                {errors.password}
              </motion.p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Confirm password<span className="ml-0.5 text-[var(--accent)]">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  clearError('confirmPassword')
                }}
                className={`${inputBase} pr-10 ${errors.confirmPassword ? inputErr : inputOk}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-xs text-[var(--color-error)]"
              >
                {errors.confirmPassword}
              </motion.p>
            )}
          </div>

          {/* Terms disclaimer */}
          <p className="text-[11px] leading-relaxed text-[var(--text-tertiary)]">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-[var(--accent-text)] hover:text-[var(--accent-hover)]">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[var(--accent-text)] hover:text-[var(--accent-hover)]">
              Privacy Policy
            </Link>
            .
          </p>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.005 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.995 }}
            className="mt-1 w-full rounded-lg py-2.5 text-sm font-medium text-[var(--color-white)] shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            }}
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border-default)]" />
          <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">or</span>
          <div className="h-px flex-1 bg-[var(--border-default)]" />
        </div>

        {/* OAuth */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() =>
              setErrors((p) => ({ ...p, form: 'Google sign-up is coming soon. Use email/password above.' }))
            }
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              {/* eslint-disable-next-line no-hardcoded-hex */}
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              {/* eslint-disable-next-line no-hardcoded-hex */}
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              {/* eslint-disable-next-line no-hardcoded-hex */}
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              {/* eslint-disable-next-line no-hardcoded-hex */}
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() =>
              setErrors((p) => ({ ...p, form: 'GitHub sign-up is coming soon. Use email/password above.' }))
            }
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Sign in link */}
        <p className="mt-6 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[var(--accent-text)] transition-colors hover:text-[var(--accent-hover)]"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-[11px] tracking-wide text-[var(--text-tertiary)]">
        Powered by <span className="font-medium text-[var(--text-secondary)]">Product OS</span>
      </p>
    </motion.div>
  )
}
