'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Settings, LogOut, ChevronsLeft, ChevronsRight, ChevronRight } from 'lucide-react'
import { StudioIcon } from './studio-icon'
import { useAuth } from '../../lib/auth-context'
import { hasStudioAccess } from '../../lib/role-config'
import { useNotificationStore } from '../../lib/notification-store'
import { useApprovalStore } from '../../lib/approval-store'
import { useTaskStore } from '../../lib/task-store'

// ---------------------------------------------------------------------------
// Workspace definitions — 8 workspaces replacing 27 individual studios
// ---------------------------------------------------------------------------

interface StudioItem {
  key: string
  label: string
  href: string
}

interface Workspace {
  key: string
  label: string
  /** Icon key to look up in StudioIcon */
  icon: string
  /** Default route when clicking the workspace icon in the activity bar */
  defaultHref: string
  items: StudioItem[]
}

const workspaces: Workspace[] = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home',
    defaultHref: 'home',
    items: [
      { key: 'home', label: 'Home', href: 'home' },
      { key: 'notifications', label: 'Alerts', href: 'notifications' },
      { key: 'control-tower', label: 'Control Tower', href: 'control-tower' },
    ],
  },
  {
    key: 'plan',
    label: 'Plan',
    icon: 'planner',
    defaultHref: 'planner',
    items: [
      { key: 'planner', label: 'Planner', href: 'planner' },
      { key: 'roadmap', label: 'Roadmap', href: 'roadmap' },
      { key: 'features', label: 'Features', href: 'features' },
      { key: 'templates', label: 'Templates', href: 'templates' },
      { key: 'canvas', label: 'Canvas', href: 'canvas' },
      { key: 'decisions', label: 'Decisions', href: 'decisions' },
    ],
  },
  {
    key: 'design',
    label: 'Design',
    icon: 'design',
    defaultHref: 'design',
    items: [
      { key: 'design', label: 'Design Studio', href: 'design' },
      { key: 'brand', label: 'Brand', href: 'brand' },
      { key: 'components', label: 'Components', href: 'components' },
      { key: 'pages', label: 'Pages', href: 'pages' },
      { key: 'graphics', label: 'Graphics', href: 'graphics' },
    ],
  },
  {
    key: 'engineer',
    label: 'Engineer',
    icon: 'code',
    defaultHref: 'code',
    items: [
      { key: 'code', label: 'Code', href: 'code' },
      { key: 'workflow', label: 'Workflow', href: 'workflows' },
      { key: 'handoff', label: 'Handoff', href: 'handoff' },
    ],
  },
  {
    key: 'ship',
    label: 'Ship',
    icon: 'releases',
    defaultHref: 'releases',
    items: [
      { key: 'releases', label: 'Releases', href: 'releases' },
      { key: 'testing', label: 'Testing', href: 'testing' },
    ],
  },
  {
    key: 'operate',
    label: 'Operate',
    icon: 'tasks',
    defaultHref: 'tasks',
    items: [
      { key: 'tasks', label: 'Tasks', href: 'tasks' },
      { key: 'approvals', label: 'Approvals', href: 'approvals' },
      { key: 'analytics', label: 'Analytics', href: 'analytics' },
    ],
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    icon: 'ai-skills',
    defaultHref: 'ai-skills',
    items: [
      { key: 'ai-skills', label: 'AI Skills', href: 'ai-skills' },
      { key: 'brand-compliance', label: 'Brand Compliance', href: 'brand-compliance' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    icon: 'graph-explorer',
    defaultHref: 'connectors',
    items: [
      { key: 'connectors', label: 'Connectors', href: 'connectors' },
      { key: 'graph-explorer', label: 'Graph', href: 'graph-explorer' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Which workspace owns the current studio slug? */
function getActiveWorkspace(studioHref: string): string {
  for (const ws of workspaces) {
    if (ws.items.some((i) => i.href === studioHref)) return ws.key
  }
  return ''
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  // Which workspace is expanded in the panel (null = follows active)
  const [pinnedWorkspace, setPinnedWorkspace] = useState<string | null>(null)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const segments = pathname.split('/')
  const productBasePath = segments.length >= 3 ? `/${segments[1]}/${segments[2]}` : ''
  const activeStudio = segments[3] ?? ''
  const activeWorkspaceKey = getActiveWorkspace(activeStudio)

  // Workspace visibility config from Settings (persisted in localStorage, reactive via storage event)
  const [wsConfigRev, setWsConfigRev] = useState(0)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'product-os-workspace-config') setWsConfigRev((r) => r + 1)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const hiddenWorkspaces = useMemo<Set<string>>(() => {
    try {
      const raw = typeof window !== 'undefined'
        ? localStorage.getItem('product-os-workspace-config')
        : null
      if (!raw) return new Set()
      const config = JSON.parse(raw) as Array<{ key: string; enabled: boolean }>
      return new Set(config.filter((ws) => !ws.enabled).map((ws) => ws.key))
    } catch {
      return new Set()
    }
  // wsConfigRev intentionally included to re-run when storage changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsConfigRev])

  // Role-based item filtering
  const accessibleItems = useMemo<Set<string>>(() => {
    if (!user) return new Set(workspaces.flatMap((ws) => ws.items.map((i) => i.key)))
    return new Set(
      workspaces
        .flatMap((ws) => ws.items)
        .filter((item) => hasStudioAccess(user.role, item.key))
        .map((item) => item.key)
    )
  }, [user?.role])

  const visibleWorkspaces = useMemo(() =>
    workspaces
      .filter((ws) => !hiddenWorkspaces.has(ws.key))
      .map((ws) => ({ ...ws, items: ws.items.filter((i) => accessibleItems.has(i.key)) }))
      .filter((ws) => ws.items.length > 0),
    [accessibleItems, hiddenWorkspaces]
  )

  // Badge counts
  const unreadNotifs = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length)
  const pendingApprovals = useApprovalStore((s) => s.requests.filter((r) => r.status === 'pending').length)
  const openTasks = useTaskStore((s) => s.tasks.filter((t) => t.status !== 'done').length)

  const badgeCounts = useMemo<Record<string, number>>(() => ({
    notifications: unreadNotifs,
    approvals: pendingApprovals,
    tasks: openTasks > 0 ? openTasks : 0,
  }), [unreadNotifs, pendingApprovals, openTasks])

  /** Badge total for a workspace (sum of its items' badge counts) */
  function workspaceBadge(ws: Workspace): number {
    return ws.items.reduce((acc, i) => acc + (badgeCounts[i.key] ?? 0), 0)
  }

  // Panel workspace = pinned if set, else active
  const panelWorkspaceKey = pinnedWorkspace ?? activeWorkspaceKey
  const panelWorkspace = visibleWorkspaces.find((ws) => ws.key === panelWorkspaceKey) ?? visibleWorkspaces[0]

  return (
    <div className="flex h-screen flex-shrink-0">
      {/* ── Activity Bar ── */}
      <div className="w-[var(--activity-bar-w)] flex flex-col bg-[#0f0f0f] border-r border-[var(--border-default)] z-50">
        {/* Logo */}
        <div className="h-[var(--topbar-h)] flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
            aria-label="Product OS Home"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="#6398ff" />
              <rect x="11" y="2" width="7" height="7" rx="2" fill="#6398ff" fillOpacity="0.45" />
              <rect x="2" y="11" width="7" height="7" rx="2" fill="#6398ff" fillOpacity="0.45" />
              <rect x="11" y="11" width="7" height="7" rx="2" fill="#6398ff" fillOpacity="0.2" />
            </svg>
          </Link>
        </div>

        {/* Workspace Icons */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-1 flex flex-col items-center gap-px" aria-label="Workspaces">
          {visibleWorkspaces.map((ws) => {
            const isActive = ws.key === activeWorkspaceKey
            const badge = workspaceBadge(ws)
            const href = productBasePath ? `${productBasePath}/${ws.defaultHref}` : '#'

            return (
              <Link
                key={ws.key}
                href={href}
                onClick={() => {
                  if (expanded) setPinnedWorkspace(ws.key)
                }}
                className={`
                  tool-tooltip relative w-[36px] h-[36px] flex items-center justify-center rounded-md transition-all duration-100
                  ${isActive
                    ? 'bg-[var(--surface-selected-strong)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                  }
                `}
                data-tooltip={ws.label}
                aria-label={ws.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] rounded-r-sm bg-[var(--accent)]" />
                )}
                <StudioIcon studio={ws.icon} size={16} useColor={isActive} />
                {badge > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-[var(--color-error)] text-[9px] font-semibold text-white flex items-center justify-center leading-none px-[3px]"
                    aria-label={`${badge} items`}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-[var(--border-default)] py-2 flex flex-col items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <ChevronsLeft size={15} /> : <ChevronsRight size={15} />}
          </button>
          <Link
            href={productBasePath ? `${productBasePath}/settings` : '#'}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={15} />
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
      {expanded && (
        <div
          className="w-[var(--sidebar-w)] bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col overflow-hidden"
          style={{ animation: 'slideInLeft 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Header */}
          <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)]">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase">
              Product OS
            </span>
          </div>

          {/* Workspace tabs */}
          <div className="flex flex-col overflow-hidden flex-1">
            {/* Scrollable workspace list */}
            <nav className="flex-1 overflow-y-auto py-1.5 px-1.5" aria-label="Navigation">

              {/* All workspaces — show section headers with collapsible items */}
              {visibleWorkspaces.map((ws) => {
                const isActiveWs = ws.key === activeWorkspaceKey
                const isPanelWs = ws.key === panelWorkspaceKey
                const wsOpen = isPanelWs || isActiveWs

                return (
                  <div key={ws.key} className="mb-0.5">
                    {/* Workspace header row */}
                    <button
                      onClick={() => setPinnedWorkspace(wsOpen && pinnedWorkspace === ws.key ? null : ws.key)}
                      className={`
                        w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-semibold tracking-wider uppercase transition-colors
                        ${isActiveWs
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }
                      `}
                      aria-expanded={wsOpen}
                    >
                      <StudioIcon studio={ws.icon} size={12} useColor={isActiveWs} />
                      <span className="flex-1 text-left">{ws.label}</span>
                      {workspaceBadge(ws) > 0 && (
                        <span className="tool-badge-error text-[9px] px-1.5 py-px rounded">
                          {workspaceBadge(ws)}
                        </span>
                      )}
                      <ChevronRight
                        size={10}
                        className={`transition-transform duration-150 opacity-40 ${wsOpen ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {/* Sub-items */}
                    {wsOpen && (
                      <div className="pl-2">
                        {ws.items.map((item) => {
                          const isActive = activeStudio === item.href
                          return (
                            <Link
                              key={item.key}
                              href={productBasePath ? `${productBasePath}/${item.href}` : '#'}
                              className={`tool-list-item ${isActive ? 'active' : ''}`}
                              aria-current={isActive ? 'page' : undefined}
                            >
                              <StudioIcon studio={item.key} size={14} useColor={isActive} />
                              <span className="flex-1 truncate">{item.label}</span>
                              {badgeCounts[item.key] > 0 && (
                                <span className="tool-badge-error text-[9px] px-1.5 py-px rounded">
                                  {badgeCounts[item.key]}
                                </span>
                              )}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* User */}
            <div className="border-t border-[var(--border-default)] px-2 py-2.5">
              <div className="flex items-center gap-2.5 px-1 text-[11px] text-[var(--text-secondary)]">
                <div className="w-[24px] h-[24px] rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-primary)] shrink-0">
                  {user ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                </div>
                <span className="truncate flex-1">{user?.name ?? 'Account'}</span>
                {user && (
                  <button
                    onClick={logout}
                    className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <LogOut size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
