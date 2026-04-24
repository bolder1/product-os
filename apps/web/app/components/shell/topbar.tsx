'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Bell, ChevronRight, GitBranch, Sparkles, Command, Coins, Network } from 'lucide-react'
import { useCommandPaletteStore } from '../../lib/command-palette-store'
import { useInspectorStore } from '../../lib/inspector-store'
import { useCopilotStore } from '../../lib/copilot-store'
import { useVersionStore } from '../../lib/version-store'
import { useNotificationStore } from '../../lib/notification-store'
import { useAuthStore } from '../../lib/auth-store'
import { useBudgetStore } from '../../lib/budget-store'
import { UserMenu } from './user-menu'
import { ModeSwitcher } from './mode-switcher'
import { RoleSelector } from './role-selector'
import { ThemeSwitcher } from './theme-switcher'

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface TopBarProps {
  extraRight?: React.ReactNode
}

export function TopBar({ extraRight }: TopBarProps = {}) {
  const pathname = usePathname()
  const openPalette = useCommandPaletteStore((s) => s.open)
  const openVersionPanel = useVersionStore((s) => s.openPanel)
  const notifications = useNotificationStore((s) => s.notifications)
  // unreadNotifs is memoized from the stable `notifications` array reference
  const unreadNotifs = useMemo(() => notifications.filter((n) => !n.read), [notifications])
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const inspectorOpen = useInspectorStore((s) => s.open)
  const toggleInspector = useInspectorStore((s) => s.toggleInspector)
  const copilotOpen = useCopilotStore((s) => s.open)
  const toggleCopilot = useCopilotStore((s) => s.togglePanel)
  const user = useAuthStore((s) => s.user)
  const capToday = useBudgetStore((s) => s.capToday)
  const budgetRuns = useBudgetStore((s) => s.runs)
  const usedToday = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    return budgetRuns.filter((r) => new Date(r.at).getTime() >= cutoff).reduce((a, r) => a + r.cost, 0)
  }, [budgetRuns])
  const budgetPct = Math.min(100, Math.round((usedToday / Math.max(capToday, 0.0001)) * 100))
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    if (showNotifs) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNotifs])

  const segments = pathname.split('/').filter(Boolean)
  const orgSlug = segments[0] ?? ''
  const productSlug = segments[1] ?? ''
  const studioSlug = segments[2] ?? ''

  const studioLabel = studioSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <header className="h-[var(--topbar-h)] flex items-center justify-between px-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)] z-30 flex-shrink-0 select-none">
      {/* Left: Breadcrumb + Mode + Role */}
      <div className="flex items-center gap-3 min-w-0">
        <nav className="flex items-center gap-1.5 text-[var(--font-size-label)] min-w-0">
          {orgSlug && (
            <span className="text-[var(--text-tertiary)] truncate max-w-[90px] hover:text-[var(--text-secondary)] cursor-default transition-colors">{orgSlug}</span>
          )}
          {productSlug && (
            <>
              <ChevronRight size={10} className="text-[var(--text-tertiary)] opacity-50 shrink-0" />
              <span className="text-[var(--text-secondary)] truncate max-w-[110px] hover:text-[var(--text-primary)] cursor-default transition-colors">{productSlug}</span>
            </>
          )}
        </nav>
        <div className="h-5 w-px bg-[var(--border-default)]" aria-hidden />
        <ModeSwitcher />
        <RoleSelector />
      </div>

      {/* Center: Search */}
      <button
        onClick={openPalette}
        className="flex items-center gap-2 h-[30px] px-3 rounded-md bg-[var(--bg-inset)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all cursor-pointer min-w-[200px] max-w-[320px]"
        aria-label="Search or open command palette"
      >
        <Search size={12} className="shrink-0 opacity-60" />
        <span className="flex-1 text-left">Search or jump to...</span>
        <div className="flex items-center gap-0.5">
          <kbd className="tool-kbd text-[9px]">&#8984;</kbd>
          <kbd className="tool-kbd text-[9px]">K</kbd>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {extraRight}
        {/* Budget pill */}
        <button
          type="button"
          className="flex items-center gap-1.5 h-[24px] px-2 rounded-[var(--radius-sm)] text-[11px] tabular-nums border border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title={`AI spend today: $${usedToday.toFixed(2)} of $${capToday.toFixed(2)} (${budgetPct}%)`}
          aria-label="AI budget"
        >
          <Coins size={11} className={budgetPct >= 80 ? 'text-[var(--color-error)]' : 'opacity-60'} />
          <span>
            ${usedToday < 1 ? usedToday.toFixed(3) : usedToday.toFixed(2)}
            <span className="text-[var(--text-tertiary)]"> / ${capToday.toFixed(0)}</span>
          </span>
        </button>
      <div className="flex items-center gap-0.5">
        {/* Version */}
        <button
          onClick={openVersionPanel}
          className="tool-btn-ghost tool-btn-icon"
          title="Version History"
          aria-label="Version History"
        >
          <GitBranch size={14} />
        </button>

        {/* Copilot */}
        <button
          onClick={toggleCopilot}
          className="tool-btn-ghost tool-btn-icon hover:text-[var(--accent-text)]"
          title="Copilot"
          aria-label="Toggle copilot"
          aria-pressed={copilotOpen}
          style={{ color: copilotOpen ? 'var(--accent-text)' : undefined }}
        >
          <Sparkles size={14} />
        </button>

        {/* Graph Inspector */}
        <button
          onClick={toggleInspector}
          className="tool-btn-ghost tool-btn-icon"
          title="Graph Inspector"
          aria-label="Toggle graph inspector"
          aria-pressed={inspectorOpen}
          style={{ color: inspectorOpen ? 'var(--accent-text)' : undefined }}
        >
          <Network size={14} />
        </button>

        {/* Theme (R19) */}
        <ThemeSwitcher />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="tool-btn-ghost tool-btn-icon relative"
            title="Notifications"
            aria-label={unreadNotifs.length > 0 ? `Notifications — ${unreadNotifs.length} unread` : 'Notifications'}
            aria-haspopup="true"
            aria-expanded={showNotifs}
          >
            <Bell size={14} />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1 right-1 w-[6px] h-[6px] rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-surface)]" />
            )}
          </button>

          {showNotifs && (
            <div className="tool-dropdown absolute right-0 top-full mt-1.5 w-[300px]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)]">
                <span className="text-[11px] font-semibold text-[var(--text-primary)]">Notifications</span>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    className="text-[11px] text-[var(--accent-text)] hover:text-[var(--accent-hover)] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {(() => {
                  const visible = notifications.slice(0, 12)
                  return visible.length === 0 ? (
                    <div className="tool-empty py-8">
                      <p className="text-[11px]">No notifications</p>
                    </div>
                  ) : (
                    visible.map((n) => (
                      <div
                        key={n.id}
                        className={`tool-dropdown-item py-2.5 px-3 border-b border-[var(--border-subtle)] ${
                          !n.read ? 'bg-[var(--accent-subtle)]' : ''
                        }`}
                        onClick={() => { if (!n.read) markRead(n.id) }}
                      >
                        <div className={`w-[5px] h-[5px] rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-[var(--accent)]'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-[var(--text-primary)] line-clamp-1">{n.title}</p>
                          {n.body && (
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">{n.body}</p>
                          )}
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{timeAgo(n.timestamp)}</p>
                        </div>
                      </div>
                    ))
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Separator */}
        <div className="w-px h-4 bg-[var(--border-default)] mx-1" />

        {/* User avatar + menu */}
        <UserMenu />
      </div>
    </header>
  )
}
