'use client'

import { useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { StudioIcon } from './studio-icon'
import { useAuth } from '../../lib/auth-context'
import { hasStudioAccess } from '../../lib/role-config'
import { useNotificationStore } from '../../lib/notification-store'
import { useApprovalStore } from '../../lib/approval-store'
import { useTaskStore } from '../../lib/task-store'

interface NavItem {
  key: string
  label: string
  href: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'PLAN',
    items: [
      { key: 'planner', label: 'Planner', href: 'planner' },
      { key: 'templates', label: 'Templates', href: 'templates' },
      { key: 'canvas', label: 'Canvas', href: 'canvas' },
    ],
  },
  {
    title: 'BUILD',
    items: [
      { key: 'brand', label: 'Brand', href: 'brand' },
      { key: 'components', label: 'Components', href: 'components' },
      { key: 'design', label: 'Design', href: 'design' },
      { key: 'workflow', label: 'Workflow', href: 'workflows' },
      { key: 'pages', label: 'Pages', href: 'pages' },
      { key: 'graphics', label: 'Graphics', href: 'graphics' },
    ],
  },
  {
    title: 'SHIP',
    items: [
      { key: 'code', label: 'Code', href: 'code' },
      { key: 'handoff', label: 'Handoff', href: 'handoff' },
      { key: 'releases', label: 'Releases', href: 'releases' },
      { key: 'testing', label: 'Testing', href: 'testing' },
    ],
  },
  {
    title: 'OPERATE',
    items: [
      { key: 'tasks', label: 'Tasks', href: 'tasks' },
      { key: 'approvals', label: 'Approvals', href: 'approvals' },
      { key: 'decisions', label: 'Decisions', href: 'decisions' },
      { key: 'notifications', label: 'Alerts', href: 'notifications' },
      { key: 'analytics', label: 'Analytics', href: 'analytics' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { key: 'control-tower', label: 'Control Tower', href: 'control-tower' },
      { key: 'graph-explorer', label: 'Graph', href: 'graph-explorer' },
    ],
  },
]

export function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const segments = pathname.split('/')
  const productBasePath = segments.length >= 3 ? `/${segments[1]}/${segments[2]}` : ''
  const activeStudio = segments[3] ?? ''

  const filteredSections = useMemo(() => {
    if (!user) return navSections
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasStudioAccess(user.role, item.key)),
      }))
      .filter((section) => section.items.length > 0)
  }, [user])

  const unreadNotifs = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length)
  const pendingApprovals = useApprovalStore((s) => s.requests.filter((r) => r.status === 'pending').length)
  const openTasks = useTaskStore((s) => s.tasks.filter((t) => t.status !== 'done').length)

  const badgeCounts: Record<string, number> = useMemo(() => ({
    notifications: unreadNotifs,
    approvals: pendingApprovals,
    tasks: openTasks > 0 ? openTasks : 0,
  }), [unreadNotifs, pendingApprovals, openTasks])

  return (
    <div className="flex h-screen flex-shrink-0">
      {/* ── Activity Bar ── */}
      <div className="w-[var(--activity-bar-w)] flex flex-col bg-[#0f0f0f] border-r border-[var(--border-default)] z-50">
        {/* Logo */}
        <div className="h-[var(--topbar-h)] flex items-center justify-center">
          <Link href="/" className="flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="#6398ff" />
              <rect x="11" y="2" width="7" height="7" rx="2" fill="#6398ff" fillOpacity="0.45" />
              <rect x="2" y="11" width="7" height="7" rx="2" fill="#6398ff" fillOpacity="0.45" />
              <rect x="11" y="11" width="7" height="7" rx="2" fill="#6398ff" fillOpacity="0.2" />
            </svg>
          </Link>
        </div>

        {/* Nav Icons */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-1 flex flex-col items-center">
          {filteredSections.map((section, si) => (
            <div key={section.title} className="w-full flex flex-col items-center">
              {si > 0 && <div className="w-4 h-px bg-[var(--border-default)] my-2" />}
              {section.items.map((item) => {
                const isActive = activeStudio === item.href
                const badge = badgeCounts[item.key]

                return (
                  <Link
                    key={item.key}
                    href={productBasePath ? `${productBasePath}/${item.href}` : '#'}
                    className={`
                      tool-tooltip relative w-[34px] h-[34px] flex items-center justify-center rounded-md my-[1px] transition-all duration-100
                      ${isActive
                        ? 'bg-[var(--surface-selected-strong)] text-[var(--text-primary)]'
                        : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)]'
                      }
                    `}
                    data-tooltip={item.label}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] rounded-r-sm bg-[var(--accent)]" />
                    )}
                    <StudioIcon studio={item.key} size={16} useColor={isActive} />
                    {badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-[var(--color-error)] text-[8px] font-semibold text-white flex items-center justify-center leading-none px-[3px]">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-[var(--border-default)] py-2 flex flex-col items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] transition-colors"
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <ChevronsLeft size={15} /> : <ChevronsRight size={15} />}
          </button>
          <Link
            href={productBasePath ? `${productBasePath}/settings` : '#'}
            className="w-[34px] h-[34px] flex items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-secondary)] transition-colors"
            title="Settings"
          >
            <Settings size={15} />
          </Link>
          {user && (
            <div
              className="w-[28px] h-[28px] rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-[9px] font-semibold text-[var(--text-secondary)] cursor-pointer hover:ring-1 hover:ring-[var(--border-strong)] transition-all"
              title={user.name}
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
          <div className="h-[var(--topbar-h)] flex items-center px-3 border-b border-[var(--border-default)]">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase">Product OS</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-1.5 px-1.5">
            {filteredSections.map((section) => (
              <div key={section.title} className="mb-0.5">
                <div className="tool-section-label">{section.title}</div>
                {section.items.map((item) => {
                  const isActive = activeStudio === item.href
                  return (
                    <Link
                      key={item.key}
                      href={productBasePath ? `${productBasePath}/${item.href}` : '#'}
                      className={`tool-list-item ${isActive ? 'active' : ''}`}
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
            ))}
          </nav>

          {/* User */}
          <div className="border-t border-[var(--border-default)] px-2 py-2.5">
            <div className="flex items-center gap-2.5 px-1 text-[11px] text-[var(--text-secondary)]">
              <div className="w-[22px] h-[22px] rounded-full bg-[var(--bg-overlay)] flex items-center justify-center text-[8px] font-semibold text-[var(--text-secondary)] shrink-0">
                {user ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
              </div>
              <span className="truncate flex-1">{user?.name ?? 'Account'}</span>
              {user && (
                <button
                  onClick={logout}
                  className="p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  title="Sign out"
                >
                  <LogOut size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
