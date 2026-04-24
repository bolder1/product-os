'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Users,
  Lock,
  CreditCard,
  MessageSquare,
  LayoutDashboard,
  ArrowLeft,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import AdminOverview from './_components/admin-overview'
import MemberManagement from './_components/member-management'
import RolesPermissions from './_components/roles-permissions'
import SeatManagement from './_components/seat-management'
import AccessRequests from './_components/access-requests'

const tabs = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'roles', label: 'Roles & Permissions', icon: Lock },
  { key: 'seats', label: 'Seats', icon: CreditCard },
  { key: 'access', label: 'Access Requests', icon: MessageSquare },
] as const

type TabKey = (typeof tabs)[number]['key']

const tabContent: Record<TabKey, React.ComponentType> = {
  overview: AdminOverview,
  members: MemberManagement,
  roles: RolesPermissions,
  seats: SeatManagement,
  access: AccessRequests,
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const { user } = useAuth()

  const ActiveComponent = tabContent[activeTab]

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </a>
              <div className="w-px h-5 bg-white/[0.08]" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-error)]/12 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[var(--color-error)]" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-[var(--text-primary)]">Admin Panel</h1>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{user?.orgName || 'Organization'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] font-medium">
                Admin
              </span>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-error)] to-[var(--accent)] flex items-center justify-center text-xs font-medium text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'text-[var(--color-error)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-error)]"
                      layoutId="admin-tab-indicator"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <ActiveComponent />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
