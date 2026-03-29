'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { Search, Sparkles, Bell, User, ChevronRight, GitBranch, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCommandPaletteStore } from '../../lib/command-palette-store'
import { useVersionStore } from '../../lib/version-store'
import { useNotificationStore } from '../../lib/notification-store'
import { useAuthStore } from '../../lib/auth-store'

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function TopBar() {
  const pathname = usePathname()
  const openPalette = useCommandPaletteStore((s) => s.open)
  const openVersionPanel = useVersionStore((s) => s.openPanel)
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadNotifs = useMemo(() => notifications.filter((n) => !n.read), [notifications])
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const user = useAuthStore((s) => s.user)
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
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

  // Build breadcrumb from URL segments
  const orgSlug = segments[0] ?? ''
  const productSlug = segments[1] ?? ''
  const studioSlug = segments[2] ?? ''

  const studioLabel = studioSlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <header className="glass sticky top-0 z-30 h-12 flex items-center justify-between px-4 border-b border-white/[0.08]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-[0.8125rem]">
        {orgSlug && (
          <span className="text-[#64748B] hover:text-[#94A3B8] transition-colors cursor-pointer">
            {orgSlug}
          </span>
        )}
        {productSlug && (
          <>
            <ChevronRight size={14} className="text-[#64748B]" />
            <span className="text-[#94A3B8] hover:text-[#F1F5F9] transition-colors cursor-pointer">
              {productSlug}
            </span>
          </>
        )}
        {studioLabel && (
          <>
            <ChevronRight size={14} className="text-[#64748B]" />
            <span className="text-[#F1F5F9] font-medium">
              {studioLabel}
            </span>
          </>
        )}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Search / command palette */}
        <button
          onClick={openPalette}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[0.8125rem] text-[#64748B] hover:bg-white/[0.06] hover:text-[#94A3B8] transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search size={16} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-[0.625rem] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[#64748B]">
            Ctrl K
          </kbd>
        </button>

        {/* Version History */}
        <button
          onClick={openVersionPanel}
          className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-[#94A3B8] hover:text-[#8B5CF6]"
          title="Version History"
        >
          <GitBranch size={18} />
        </button>

        {/* AI Assistant */}
        <button
          className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-[#8B5CF6]"
          title="AI Assistant"
        >
          <Sparkles size={18} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-[#94A3B8]"
            title="Notifications"
          >
            <Bell size={18} />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F43F5E] text-[0.5rem] font-bold text-white flex items-center justify-center">
                {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-[#0A0F1E] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <span className="text-sm font-medium text-[#F1F5F9]">Notifications</span>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-[10px] text-[#6366F1] hover:text-[#818CF8] transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 10).length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell size={20} className="mx-auto text-[#64748B] mb-2" />
                      <p className="text-xs text-[#64748B]">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer ${
                          !n.read ? 'bg-[#6366F1]/[0.04]' : ''
                        }`}
                        onClick={() => { if (!n.read) markRead(n.id) }}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-[#6366F1]'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#F1F5F9] line-clamp-2">{n.title}</p>
                          {n.message && (
                            <p className="text-[10px] text-[#64748B] mt-0.5 line-clamp-1">{n.message}</p>
                          )}
                          <p className="text-[10px] text-[#475569] mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <button
          className="ml-1 w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center hover:opacity-90 transition-opacity"
          title={user?.name ?? 'Account'}
        >
          {user ? (
            <span className="text-[0.5625rem] font-bold text-white leading-none">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          ) : (
            <User size={14} className="text-white" />
          )}
        </button>
      </div>
    </header>
  )
}
