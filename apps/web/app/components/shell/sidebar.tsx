'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Settings, LogOut, ChevronsLeft, ChevronsRight, Compass, Layers, Rocket, Activity, Sparkles } from 'lucide-react'
import { StudioIcon } from './studio-icon'
import { useAuth } from '../../lib/auth-context'
import { hasStudioAccess } from '../../lib/role-config'
import { useNotificationStore } from '../../lib/notification-store'
import { useApprovalStore } from '../../lib/approval-store'
import { useTaskStore } from '../../lib/task-store'
import { modes, persistentRails, modeForStudio, type ModeKey, type ModeDefinition } from '../../lib/mode-config'
import { useModeStore } from '../../lib/mode-store'

// ---------------------------------------------------------------------------
// R3: Mode-based shell.
// 5 Modes (Plan / Build / Ship / Operate / Intelligence) replace the
// 8-workspace activity rail. Studios within a Mode fill the expanded panel.
// Persistent rails (Memory, Graph, Extensions, Decisions, Work) are pinned
// below the Modes.
// ---------------------------------------------------------------------------

const modeIconMap: Record<ModeKey, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  plan: Compass,
  build: Layers,
  ship: Rocket,
  operate: Activity,
  intelligence: Sparkles,
}

export function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const segments = pathname.split('/')
  const productBasePath = segments.length >= 3 ? `/${segments[1]}/${segments[2]}` : ''
  const activeStudio = segments[3] ?? ''

  const derivedMode: ModeKey = useMemo(() => modeForStudio(activeStudio), [activeStudio])
  const persistedMode = useModeStore((s) => s.currentMode)
  const setPersistedMode = useModeStore((s) => s.setCurrentMode)
  const activeMode: ModeKey = activeStudio ? derivedMode : persistedMode
  const [pinnedMode, setPinnedMode] = useState<ModeKey | null>(null)
  const panelMode: ModeKey = pinnedMode ?? activeMode

  useEffect(() => {
    setPersistedMode(activeMode)
  }, [activeMode, setPersistedMode])

  // Role-based studio filtering (respects existing role-config).
  const accessibleStudios = useMemo<Set<string>>(() => {
    const allKeys = new Set<string>()
    for (const m of modes) for (const s of m.studios) allKeys.add(s.key)
    for (const r of persistentRails) allKeys.add(r.key)
    if (!user) return allKeys
    const filtered = new Set<string>()
    for (const k of allKeys) {
      if (hasStudioAccess(user.role, k)) filtered.add(k)
      else if (hasStudioAccess(user.role, legacyKeyFor(k))) filtered.add(k)
    }
    return filtered
  }, [user?.role])

  const visibleModes = useMemo<ModeDefinition[]>(() =>
    modes
      .map((m) => ({ ...m, studios: m.studios.filter((s) => accessibleStudios.has(s.key)) }))
      .filter((m) => m.studios.length > 0),
    [accessibleStudios]
  )

  const visibleRails = useMemo(() =>
    persistentRails.filter((r) => accessibleStudios.has(r.key)),
    [accessibleStudios]
  )

  // Badge counts
  const unreadNotifs = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length)
  const pendingApprovals = useApprovalStore((s) => s.requests.filter((r) => r.status === 'pending').length)
  const openTasks = useTaskStore((s) => s.tasks.filter((t) => t.status !== 'done').length)

  const badgeCounts = useMemo<Record<string, number>>(() => ({
    notifications: unreadNotifs,
    approvals: pendingApprovals,
    tasks: openTasks > 0 ? openTasks : 0,
    work: openTasks + pendingApprovals,
  }), [unreadNotifs, pendingApprovals, openTasks])

  function modeBadge(mode: ModeDefinition): number {
    return mode.studios.reduce((acc, s) => acc + (badgeCounts[s.key] ?? 0), 0)
  }

  const panelModeDef = visibleModes.find((m) => m.key === panelMode) ?? visibleModes[0]

  return (
    <div className="flex h-screen flex-shrink-0">
      {/* ── Mode Rail ── */}
      <div
        className="w-[var(--activity-bar-w)] flex flex-col border-r border-[var(--border-default)] z-50"
        style={{ background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)' }}
      >
        {/* Logo */}
        <div className="h-[var(--topbar-h)] flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity duration-[var(--duration-fast)]"
            aria-label="Product OS Home"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="var(--accent)" />
              <rect x="11" y="2" width="7" height="7" rx="2" fill="var(--accent)" fillOpacity="0.45" />
              <rect x="2" y="11" width="7" height="7" rx="2" fill="var(--accent)" fillOpacity="0.45" />
              <rect x="11" y="11" width="7" height="7" rx="2" fill="var(--accent)" fillOpacity="0.2" />
            </svg>
          </Link>
        </div>

        {/* 5 Modes */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-2 flex flex-col items-center gap-1" aria-label="Modes">
          {visibleModes.map((mode) => {
            const Icon = modeIconMap[mode.key]
            const isActive = mode.key === activeMode
            const badge = modeBadge(mode)
            const href = productBasePath ? `${productBasePath}/${mode.defaultHref}` : '#'

            return (
              <Link
                key={mode.key}
                href={href}
                onClick={() => {
                  setPinnedMode(mode.key)
                  setPersistedMode(mode.key)
                  if (!expanded) setExpanded(true)
                }}
                className={`tool-tooltip relative w-[36px] h-[36px] flex items-center justify-center rounded-[var(--radius-sm)] transition-[background,color] duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  isActive
                    ? 'bg-[var(--surface-selected-strong)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                }`}
                data-tooltip={mode.label}
                aria-label={mode.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] rounded-r-sm bg-[var(--accent)]"
                    aria-hidden
                  />
                )}
                <Icon size={16} strokeWidth={1.75} />
                {badge > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-[var(--color-error)] text-[10px] font-semibold text-white flex items-center justify-center leading-none px-[3px]"
                    aria-label={`${badge} items`}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Persistent rails */}
        <div className="border-t border-[var(--border-subtle)] py-2 flex flex-col items-center gap-1">
          {visibleRails.map((rail) => {
            const isActive = activeStudio === rail.href
            const href = productBasePath ? `${productBasePath}/${rail.href}` : '#'
            return (
              <Link
                key={rail.key}
                href={href}
                className={`tool-tooltip w-[36px] h-[36px] flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] ${
                  isActive
                    ? 'bg-[var(--surface-selected)] text-[var(--accent-text)]'
                    : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]'
                }`}
                data-tooltip={rail.label}
                aria-label={rail.label}
              >
                <StudioIcon studio={rail.key === 'graph' ? 'graph' : rail.href} size={16} useColor={isActive} />
              </Link>
            )
          })}
        </div>

        {/* Bottom actions */}
        <div className="border-t border-[var(--border-default)] py-2 flex flex-col items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
          </button>
          <Link
            href={productBasePath ? `${productBasePath}/settings` : '#'}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]"
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={16} />
          </Link>
          {user && (
            <div
              className="w-[30px] h-[30px] rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-primary)] cursor-pointer hover:ring-1 hover:ring-[var(--border-strong)] transition-all"
              title={user.name}
              aria-label={user.name}
            >
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded Panel ── */}
      {expanded && panelModeDef && (
        <div
          className="w-[var(--sidebar-w)] bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col overflow-hidden"
          style={{ animation: `slideInLeft var(--duration-base) var(--ease-out)` }}
        >
          {/* Mode header */}
          <div className="h-[var(--topbar-h)] flex items-center justify-between px-4 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = modeIconMap[panelModeDef.key]
                return <Icon size={14} strokeWidth={1.75} />
              })()}
              <span className="font-serif text-[var(--font-size-h3)] tracking-[-0.01em] font-medium text-[var(--text-primary)]">
                {panelModeDef.label}
              </span>
            </div>
          </div>

          {/* Tagline */}
          <div className="px-4 pt-3 pb-2">
            <p className="text-[var(--font-size-caption)] leading-[var(--line-height-caption)] text-[var(--text-tertiary)]">
              {panelModeDef.tagline}
            </p>
          </div>

          {/* Studios */}
          <nav className="flex-1 overflow-y-auto px-1.5 pb-2" aria-label="Navigation">
            <div className="px-2 pt-2 pb-1 text-[var(--font-size-caption)] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
              Studios
            </div>
            {panelModeDef.studios.map((item) => {
              const isActive = activeStudio === item.href
              return (
                <Link
                  key={item.key}
                  href={productBasePath ? `${productBasePath}/${item.href}` : '#'}
                  className={`tool-list-item ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <StudioIcon studio={studioIconKey(item.key, item.href)} size={14} useColor={isActive} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {badgeCounts[item.key] > 0 && (
                    <span className="tool-badge-error text-[10px] px-1.5 py-px rounded">
                      {badgeCounts[item.key]}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Persistent rails section */}
            {visibleRails.length > 0 && (
              <>
                <div className="px-2 pt-4 pb-1 text-[var(--font-size-caption)] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  Anywhere
                </div>
                {visibleRails.map((rail) => {
                  const isActive = activeStudio === rail.href
                  return (
                    <Link
                      key={rail.key}
                      href={productBasePath ? `${productBasePath}/${rail.href}` : '#'}
                      className={`tool-list-item ${isActive ? 'active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <StudioIcon studio={rail.key === 'graph' ? 'graph' : rail.href} size={14} useColor={isActive} />
                      <span className="flex-1 truncate">{rail.label}</span>
                      {badgeCounts[rail.key] > 0 && (
                        <span className="tool-badge-accent text-[10px] px-1.5 py-px rounded">
                          {badgeCounts[rail.key]}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* User */}
          <div className="border-t border-[var(--border-default)] px-2 py-2.5">
            <div className="flex items-center gap-2.5 px-1 text-[var(--font-size-label)] text-[var(--text-secondary)]">
              <div className="w-[24px] h-[24px] rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-primary)] shrink-0">
                {user ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
              </div>
              <span className="truncate flex-1">{user?.name ?? 'Account'}</span>
              {user && (
                <button
                  onClick={logout}
                  className="p-1.5 rounded-[var(--radius-xs)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)]"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Map a mode-config studio key to the legacy role-config key for access checks. */
function legacyKeyFor(key: string): string {
  switch (key) {
    case 'workspace': return 'home'
    case 'cortex':
    case 'copilot':
    case 'ai-skills': return 'ai-skills'
    case 'extensions': return 'connectors'
    case 'mcp': return 'connectors'
    case 'computer-log': return 'brand-compliance'
    case 'work': return 'tasks'
    default: return key
  }
}

/** Pick the right StudioIcon slug for a studio row. */
function studioIconKey(key: string, href: string): string {
  switch (key) {
    case 'workspace': return 'home'
    case 'work': return 'tasks'
    case 'cortex': return 'cortex'
    case 'copilot': return 'ai-skills'
    case 'extensions': return 'connectors'
    case 'mcp': return 'connectors'
    case 'computer-log': return 'brand-compliance'
    default: return href
  }
}
