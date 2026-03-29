'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, CheckCheck } from 'lucide-react'
import { type Notification, mockNotifications } from './_data/mock-notifications'
import { NotificationItem } from './_components/notification-item'
import { NotificationFilters, type FilterKey } from './_components/notification-filters'
import { useNotificationStore } from '../../../../lib/notification-store'

function getDateGroup(ts: string): string {
  const date = new Date(ts)
  const now = new Date('2026-03-29T12:00:00Z')
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return 'This Week'
  return 'Earlier'
}

const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier']

export default function NotificationsPage() {
  const params = useParams<{ productSlug: string }>()
  const allNotifs = useNotificationStore((s) => s.notifications)
  const storeNotifs = useMemo(() => allNotifs.filter((n) => n.productId === params.productSlug), [allNotifs, params.productSlug])
  const storeMarkRead = useNotificationStore((s) => s.markRead)
  const storeMarkAllRead = useNotificationStore((s) => s.markAllRead)
  const storeDelete = useNotificationStore((s) => s.deleteNotification)

  // Convert store notifications to the local Notification format
  const storeAsLocal: Notification[] = useMemo(
    () =>
      storeNotifs.map((n) => ({
        id: n.id,
        type: (n.type === 'task_assigned' || n.type === 'task_completed'
          ? 'task'
          : n.type === 'approval_requested' || n.type === 'approval_decided'
          ? 'approval'
          : n.type === 'mention'
          ? 'mention'
          : n.type === 'comment_added'
          ? 'comment'
          : 'system') as Notification['type'],
        actor: { name: 'System', avatar: 'SY' },
        action: '',
        target: n.title,
        timestamp: n.createdAt,
        read: n.read,
        message: n.message ?? '',
      })),
    [storeNotifs]
  )

  // Merge: store notifications first, then mock fallback
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (storeAsLocal.length > 0) return [...storeAsLocal, ...mockNotifications]
    return mockNotifications
  })
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      comment: notifications.filter((n) => n.type === 'comment').length,
      task: notifications.filter((n) => n.type === 'task').length,
      approval: notifications.filter((n) => n.type === 'approval').length,
      mention: notifications.filter((n) => n.type === 'mention').length,
      system: notifications.filter((n) => n.type === 'system').length,
    }
    return c
  }, [notifications])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications
    if (activeFilter === 'unread') return notifications.filter((n) => !n.read)
    return notifications.filter((n) => n.type === activeFilter)
  }, [notifications, activeFilter])

  const grouped = useMemo(() => {
    const groups: Record<string, Notification[]> = {}
    for (const n of filtered) {
      const group = getDateGroup(n.timestamp)
      if (!groups[group]) groups[group] = []
      groups[group].push(n)
    }
    return groupOrder
      .filter((g) => groups[g]?.length)
      .map((g) => ({ label: g, items: groups[g]! }))
  }, [filtered])

  const handleMarkRead = useCallback((id: string) => {
    storeMarkRead(id) // sync to store (no-op if it's a mock notification)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [storeMarkRead])

  const handleDismiss = useCallback((id: string) => {
    storeDelete(id) // sync to store
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [storeDelete])

  const handleMarkAllRead = useCallback(() => {
    storeMarkAllRead() // sync to store
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [storeMarkAllRead])

  const unreadCount = counts.unread

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl bg-[#94A3B8]/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#94A3B8]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#3B82F6] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#F1F5F9]">Notifications</h1>
            <p className="text-xs text-[#64748B]">
              {unreadCount} unread &middot; {notifications.length} total
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#94A3B8] border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark All Read
        </motion.button>
      </motion.div>

      {/* Filter tabs */}
      <NotificationFilters
        active={activeFilter}
        onChange={setActiveFilter}
        counts={counts}
      />

      {/* Notification list */}
      <motion.div
        key={activeFilter}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 min-h-0 overflow-y-auto space-y-6"
      >
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#94A3B8]/10 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <p className="text-sm text-[#94A3B8]">
              {activeFilter === 'unread' ? 'All caught up!' : 'No notifications'}
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748B]">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-white/[0.04]" />
                <span className="text-[10px] text-[#64748B]">{group.items.length}</span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {group.items.map((notification, idx) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={idx}
                    onMarkRead={handleMarkRead}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>
    </div>
  )
}
