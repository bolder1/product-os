'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
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
    storeMarkRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [storeMarkRead])

  const handleDismiss = useCallback((id: string) => {
    storeDelete(id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [storeDelete])

  const handleMarkAllRead = useCallback(() => {
    storeMarkAllRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [storeMarkAllRead])

  const unreadCount = counts.unread

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* Toolbar */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-3 shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-[var(--text-secondary)]" />
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold text-white bg-[var(--accent)] rounded-[var(--radius-sm)] px-1.5 py-px">
              {unreadCount}
            </span>
          )}
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {notifications.length} total
          </span>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="tool-btn"
          style={{ opacity: unreadCount === 0 ? 0.4 : 1 }}
        >
          <CheckCheck size={12} />
          Mark All Read
        </button>
      </div>

      {/* Filter tabs */}
      <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <NotificationFilters
          active={activeFilter}
          onChange={setActiveFilter}
          counts={counts}
        />
      </div>

      {/* Notification list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell size={18} className="text-[var(--text-tertiary)] mb-2" />
            <p className="text-[12px] text-[var(--text-secondary)]">
              {activeFilter === 'unread' ? 'All caught up!' : 'No notifications'}
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <div className="flex items-center gap-2 px-3 h-7 bg-[var(--bg-workspace)] border-b border-[var(--border-default)]">
                <span className="tool-section-label p-0">
                  {group.label}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">
                  {group.items.length}
                </span>
              </div>

              {/* Items */}
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
          ))
        )}
      </div>
    </div>
  )
}
