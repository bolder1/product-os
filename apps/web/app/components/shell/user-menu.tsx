'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  LogOut,
  UserPlus,
  ChevronRight,
  Check,
  X,
  Settings,
  User,
  Building2,
  RefreshCw,
} from 'lucide-react'
import { useAuthStore } from '../../lib/auth-store'
import {
  getSavedAccounts,
  removeAccount,
  type SavedAccount,
} from '../../lib/accounts-store'

/* ─────────────────────────────────────────────────────────────
   Avatar helper
───────────────────────────────────────────────────────────── */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
    : (parts[0]?.[0] ?? '?').toUpperCase()
}

/** Deterministic color from a string so each account has its own hue */
function avatarColor(seed: string): string {
  const palette = [
    '#6398ff', '#3dd68c', '#f59e0b', '#ec4899',
    '#8b5cf6', '#06b6d4', '#ef5350', '#a78bfa',
  ]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return palette[h % palette.length]!
}

interface AvatarProps {
  name: string
  avatar?: string
  size?: number
  className?: string
}

function Avatar({ name, avatar, size = 28, className = '' }: AvatarProps) {
  const color = avatarColor(name)
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `${color}22`,
        color,
        fontSize: size * 0.38,
        border: `1.5px solid ${color}44`,
      }}
    >
      {initials(name)}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────── */

export function UserMenu() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const storeLogout = useAuthStore((s) => s.logout)
  const storeLogoutAndForget = useAuthStore((s) => s.logoutAndForget)
  const storeLogin = useAuthStore((s) => s.login)
  const updateProfile = useAuthStore((s) => s.updateProfile)

  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'main' | 'accounts'>('main')
  const [switching, setSwitching] = useState<string | null>(null) // userId being switched to
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([])

  const menuRef = useRef<HTMLDivElement>(null)

  /* Refresh account list whenever menu opens */
  useEffect(() => {
    if (open) {
      setSavedAccounts(getSavedAccounts())
      setView('main')
    }
  }, [open])

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  /* ── Actions ── */

  const handleLogout = useCallback(() => {
    setOpen(false)
    storeLogout()
    router.push('/login')
  }, [storeLogout, router])

  const handleSwitchTo = useCallback(
    async (account: SavedAccount) => {
      if (account.user.id === user?.id) { setOpen(false); return }
      setSwitching(account.user.id)

      // Load the saved session into localStorage
      localStorage.setItem('product-os-session-token', account.token)
      localStorage.setItem('product-os-org-id', account.orgId)

      // Update the auth store directly (no API round-trip needed)
      updateProfile({
        id: account.user.id,
        name: account.user.name,
        email: account.user.email,
        role: account.user.role as any,
        orgId: account.user.orgId,
        orgName: account.user.orgName,
        orgSlug: account.user.orgSlug,
        avatar: account.user.avatar,
        onboarded: true,
      })

      // Also set isAuthenticated in case a different account was previously signed out
      useAuthStore.setState({ isAuthenticated: true })

      await new Promise((r) => setTimeout(r, 300)) // let store settle
      setSwitching(null)
      setOpen(false)

      // Navigate to the new account's dashboard
      router.push(`/${account.user.orgSlug}`)
      router.refresh()
    },
    [user?.id, updateProfile, router],
  )

  const handleRemoveAccount = useCallback(
    (e: React.MouseEvent, userId: string) => {
      e.stopPropagation()
      removeAccount(userId)
      setSavedAccounts(getSavedAccounts())
      // If removing the active account, log out
      if (userId === user?.id) {
        storeLogoutAndForget()
        router.push('/login')
      }
    },
    [user?.id, storeLogoutAndForget, router],
  )

  const handleAddAccount = useCallback(() => {
    setOpen(false)
    // Navigate to login without logging the current user out
    router.push('/login?mode=add')
  }, [router])

  if (!user) return null

  /* Other saved accounts (exclude the currently active one) */
  const otherAccounts = savedAccounts.filter((a) => a.user.id !== user.id)

  /* ── Render ── */
  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger — avatar button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-[var(--accent)]/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-label="User menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Avatar name={user.name} avatar={user.avatar} size={26} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[280px] z-[100] rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-panel)] overflow-hidden"
          style={{ animation: 'slideInDown 150ms cubic-bezier(0.16,1,0.3,1)' }}
          role="menu"
        >
          {view === 'main' ? (
            <>
              {/* Current account header */}
              <div className="px-4 pt-4 pb-3 border-b border-[var(--border-default)]">
                <div className="flex items-start gap-3">
                  <Avatar name={user.name} avatar={user.avatar} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Building2 size={10} className="text-[var(--text-tertiary)]" />
                      <span className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {user.orgName || user.orgSlug}
                      </span>
                      <span className="tool-badge text-[9px] py-0 px-1.5 ml-auto capitalize flex-shrink-0">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkmark for active */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <Check size={11} className="text-[var(--color-success)]" />
                  <span className="text-[10px] text-[var(--color-success)]">Active account</span>
                </div>
              </div>

              {/* Other saved accounts (quick switch) */}
              {otherAccounts.length > 0 && (
                <div className="border-b border-[var(--border-default)]">
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                    Other accounts
                  </p>
                  {otherAccounts.map((acct) => (
                    <button
                      key={acct.user.id}
                      role="menuitem"
                      onClick={() => handleSwitchTo(acct)}
                      disabled={!!switching}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[var(--surface-hover)] transition-colors text-left group"
                    >
                      <Avatar name={acct.user.name} avatar={acct.user.avatar} size={28} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[var(--text-primary)] truncate leading-tight">
                          {acct.user.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">
                          {acct.user.email}
                        </p>
                      </div>
                      {switching === acct.user.id ? (
                        <RefreshCw size={12} className="text-[var(--accent)] animate-spin flex-shrink-0" />
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={12} className="text-[var(--text-tertiary)]" />
                          <button
                            onClick={(e) => handleRemoveAccount(e, acct.user.id)}
                            className="p-0.5 rounded hover:text-[var(--color-error)] text-[var(--text-tertiary)] transition-colors"
                            aria-label={`Remove ${acct.user.name}`}
                            title="Remove account"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="py-1.5">
                {/* Switch / add account */}
                <button
                  role="menuitem"
                  onClick={handleAddAccount}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="w-[28px] h-[28px] rounded-full border border-dashed border-[var(--border-strong)] flex items-center justify-center flex-shrink-0">
                    <UserPlus size={13} className="text-[var(--text-tertiary)]" />
                  </div>
                  <span>Add another account</span>
                </button>

                {/* Manage all accounts (if there are saved ones) */}
                {savedAccounts.length > 1 && (
                  <button
                    role="menuitem"
                    onClick={() => setView('accounts')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div className="w-[28px] h-[28px] rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0">
                      <User size={13} className="text-[var(--text-tertiary)]" />
                    </div>
                    <span>Manage accounts</span>
                    <ChevronRight size={12} className="ml-auto text-[var(--text-tertiary)]" />
                  </button>
                )}
              </div>

              {/* Divider + Log out */}
              <div className="border-t border-[var(--border-default)] py-1.5">
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--color-error)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <LogOut size={14} className="flex-shrink-0" />
                  <span>Log out of {user.name.split(' ')[0]}</span>
                </button>
              </div>
            </>
          ) : (
            /* ── Manage accounts view ── */
            <>
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border-default)]">
                <button
                  onClick={() => setView('main')}
                  className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Back"
                >
                  <ChevronRight size={14} className="rotate-180" />
                </button>
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                  All accounts
                </span>
              </div>

              <div className="py-1.5 max-h-[320px] overflow-y-auto">
                {savedAccounts.map((acct) => {
                  const isActive = acct.user.id === user.id
                  return (
                    <button
                      key={acct.user.id}
                      role="menuitem"
                      onClick={() => !isActive && handleSwitchTo(acct)}
                      disabled={isActive || !!switching}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-left group ${
                        isActive
                          ? 'cursor-default'
                          : 'hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar name={acct.user.name} avatar={acct.user.avatar} size={34} />
                        {isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full bg-[var(--color-success)] border-2 border-[var(--bg-elevated)] flex items-center justify-center">
                            <Check size={7} className="text-white" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] font-medium truncate leading-tight ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                          {acct.user.name}
                          {isActive && (
                            <span className="ml-2 text-[10px] font-normal text-[var(--color-success)]">
                              Active
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                          {acct.user.email}
                        </p>
                        <p className="text-[10px] text-[var(--text-tertiary)] truncate opacity-70">
                          {acct.user.orgName || acct.user.orgSlug}
                        </p>
                      </div>
                      {switching === acct.user.id ? (
                        <RefreshCw size={12} className="text-[var(--accent)] animate-spin flex-shrink-0" />
                      ) : (
                        <button
                          onClick={(e) => handleRemoveAccount(e, acct.user.id)}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-overlay)] hover:text-[var(--color-error)] text-[var(--text-tertiary)] transition-all flex-shrink-0"
                          aria-label={`Remove ${acct.user.name}`}
                          title={isActive ? 'Log out and remove' : 'Remove account'}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="border-t border-[var(--border-default)] py-1.5">
                <button
                  role="menuitem"
                  onClick={handleAddAccount}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <UserPlus size={14} className="flex-shrink-0" />
                  <span>Add another account</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
