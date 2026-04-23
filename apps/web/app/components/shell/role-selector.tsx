'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, UserCircle } from 'lucide-react'
import { useAuthStore } from '../../lib/auth-store'
import { roleConfigs, type OrgRole } from '../../lib/role-config'

/**
 * Topbar Role selector.
 *
 * Shows the current user's role and lets them simulate any other role.
 * Role change is in-memory only (via setRole). Sidebar re-renders automatically
 * because it reads `user.role` from the store.
 */
const roleOrder: OrgRole[] = [
  'admin',
  'manager',
  'business_analyst',
  'product_designer',
  'frontend_dev',
  'backend_dev',
  'qa',
  'viewer',
]

export function RoleSelector() {
  const user = useAuthStore((s) => s.user)
  const setRole = useAuthStore((s) => s.setRole)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  if (!user) return null

  const currentCfg = roleConfigs[user.role]

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-[32px] px-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--font-size-label)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-[background,border-color,color] duration-[var(--duration-fast)] ease-[var(--ease-out)]"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={`Role: ${currentCfg.label}`}
      >
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: currentCfg.color }}
          aria-hidden
        />
        <span className="font-medium">{currentCfg.label}</span>
        <ChevronDown size={12} className="opacity-50" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-[260px] rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-[var(--shadow-panel)] py-1.5 z-50"
          style={{ animation: 'slideInDown var(--duration-base) var(--ease-out)' }}
        >
          <div className="px-3 pt-1.5 pb-2 text-[var(--font-size-caption)] uppercase tracking-[0.08em] text-[var(--text-tertiary)] flex items-center gap-1.5">
            <UserCircle size={12} strokeWidth={1.75} />
            <span>Simulate role</span>
          </div>
          {roleOrder.map((r) => {
            const cfg = roleConfigs[r]
            const isActive = r === user.role
            return (
              <button
                key={r}
                onClick={() => {
                  setRole(r)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  isActive
                    ? 'bg-[var(--accent-subtle)]'
                    : 'hover:bg-[var(--surface-hover)]'
                }`}
                role="option"
                aria-selected={isActive}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--font-size-label)] font-medium text-[var(--text-primary)]">
                      {cfg.label}
                    </span>
                    {isActive && <Check size={12} className="text-[var(--accent-text)]" />}
                  </div>
                  <div className="text-[var(--font-size-caption)] text-[var(--text-tertiary)] leading-[var(--line-height-caption)] truncate">
                    {cfg.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
