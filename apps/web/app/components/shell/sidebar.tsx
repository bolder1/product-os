'use client'

import { useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  LogOut,
} from 'lucide-react'
import { StudioIcon, getStudioColor } from './studio-icon'
import { AnimatedLogo } from './animated-logo'
import { useAuth } from '../../lib/auth-context'
import { hasStudioAccess, getRoleLabel, roleConfigs } from '../../lib/role-config'

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
      { key: 'planner', label: 'Product Planner', href: 'planner' },
      { key: 'templates', label: 'Template Gallery', href: 'templates' },
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
      { key: 'notifications', label: 'Notifications', href: 'notifications' },
      { key: 'analytics', label: 'Analytics', href: 'analytics' },
    ],
  },
  {
    title: 'OVERVIEW',
    items: [
      { key: 'control-tower', label: 'Control Tower', href: 'control-tower' },
      { key: 'graph-explorer', label: 'Graph Explorer', href: 'graph-explorer' },
    ],
  },
]

export function Sidebar() {
  const [expanded, setExpanded] = useState(true)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Extract the base product path from the URL
  const segments = pathname.split('/')
  const productBasePath = segments.length >= 3 ? `/${segments[1]}/${segments[2]}` : ''
  const activeStudio = segments[3] ?? ''

  // Filter sections based on user role
  const filteredSections = useMemo(() => {
    if (!user) return navSections // show all if not logged in (shouldn't happen in practice)
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasStudioAccess(user.role, item.key)),
      }))
      .filter((section) => section.items.length > 0)
  }, [user])

  const roleLabel = user ? getRoleLabel(user.role) : ''
  const roleColor = user ? roleConfigs[user.role].color : '#3B82F6'

  const userInitials = useMemo(() => {
    if (!user?.name) return '?'
    const parts = user.name.trim().split(/\s+/)
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase()
  }, [user?.name])

  return (
    <motion.aside
      className="glass flex flex-col h-screen sticky top-0 z-40 overflow-hidden"
      animate={{ width: expanded ? 260 : 64 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-white/[0.08]">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <AnimatedLogo size={expanded ? 'expanded' : 'compact'} />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-sm whitespace-nowrap overflow-hidden"
              >
                Product OS
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md hover:bg-white/[0.06] transition-colors text-[#94A3B8]"
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {filteredSections.map((section) => (
          <div key={section.title}>
            <AnimatePresence>
              {expanded && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[0.625rem] font-semibold tracking-[0.1em] text-[#64748B] px-2 mb-1 uppercase"
                >
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeStudio === item.href
                const accentColor = getStudioColor(item.key)

                return (
                  <li key={item.key}>
                    <Link
                      href={productBasePath ? `${productBasePath}/${item.href}` : `#`}
                      className={`
                        flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[0.8125rem] transition-colors relative group
                        ${isActive
                          ? 'bg-white/[0.09] text-[#F1F5F9]'
                          : 'text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F1F5F9]'
                        }
                      `}
                      title={!expanded ? item.label : undefined}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                          style={{ backgroundColor: accentColor }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <StudioIcon studio={item.key} size={18} useColor={isActive} />
                      <AnimatePresence>
                        {expanded && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.08] px-2 py-2 space-y-0.5">
        <Link
          href={productBasePath ? `${productBasePath}/settings` : '#'}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[0.8125rem] text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#F1F5F9] transition-colors"
          title={!expanded ? 'Settings' : undefined}
        >
          <Settings size={18} />
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* User row with role badge */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[0.8125rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors group">
          <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shrink-0">
            {user ? (
              <span className="text-[8px] font-bold text-white leading-none">{userInitials}</span>
            ) : (
              <User size={11} className="text-white" />
            )}
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-2 overflow-hidden whitespace-nowrap min-w-0 flex-1"
              >
                <span className="truncate">{user?.name ?? 'Account'}</span>
                {user && (
                  <span
                    className="text-[0.625rem] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: `${roleColor}20`,
                      color: roleColor,
                    }}
                  >
                    {roleLabel}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logout button */}
          {user && expanded && (
            <button
              onClick={logout}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/[0.06] transition-all shrink-0"
              title="Sign out"
            >
              <LogOut size={13} className="text-[#64748B] hover:text-[#F1F5F9]" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
