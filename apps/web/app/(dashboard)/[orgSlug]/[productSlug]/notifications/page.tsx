'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Inbox, Settings, Trash2, CheckCircle2, Clock, MessageSquare, Bell } from 'lucide-react'
import { trpc } from '../../../../lib/trpc'
import { useNotificationStore } from '../../../../lib/notification-store'
import { PreferencesModal } from './_components/preferences-modal'

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  task_assigned: { label: 'Task Assigned', color: '#3B82F6' },
  task_updated: { label: 'Task Updated', color: '#F59E0B' },
  approval_requested: { label: 'Approval Requested', color: '#EC4899' },
  approval_decided: { label: 'Approval Decided', color: '#10B981' },
  comment_mention: { label: 'Mentioned in Comment', color: '#8B5CF6' },
  comment_reply: { label: 'Comment Reply', color: '#8B5CF6' },
  release_ready: { label: 'Release Ready', color: '#10B981' },
  system: { label: 'System', color: '#64748B' },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

export default function NotificationsPage() {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const [filterType, setFilterType] = useState<string | null>(null)
  const [showPreferences, setShowPreferences] = useState(false)

  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const deleteNotification = useNotificationStore((s) => s.deleteNotification)
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery()

  const filteredNotifications = filterType
    ? notifications.filter((n) => n.type === filterType)
    : notifications

  const typeOptions = Object.keys(TYPE_CONFIG).filter((type) =>
    notifications.some((n) => n.type === type as any)
  )

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Notifications</h1>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
            {unreadCount || 0} unread
          </p>
        </div>
        <button
          onClick={() => setShowPreferences(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent-text)] hover:bg-[var(--accent)]/20 transition-colors text-[11px] font-medium"
        >
          <Settings size={12} />
          Preferences
        </button>
      </div>

      <div className="px-6 py-3 border-b border-[var(--border-default)] flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setFilterType(null)}
          className={`px-2.5 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
            filterType === null
              ? 'bg-[var(--accent)] text-[var(--accent-text)]'
              : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
          }`}
        >
          All
        </button>
        {typeOptions.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2.5 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
              filterType === type
                ? 'bg-[var(--accent)] text-[var(--accent-text)]'
                : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
            }`}
          >
            {TYPE_CONFIG[type].label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Inbox size={32} className="text-[var(--text-tertiary)] opacity-40" />
            <p className="text-[12px] text-[var(--text-secondary)]">No notifications</p>
          </div>
        ) : (
          <div className="p-6 space-y-2">
            {filteredNotifications.map((notif) => {
              const typeConfig = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    notif.read
                      ? 'bg-[var(--bg-inset)] border-[var(--border-subtle)]'
                      : 'bg-[var(--accent)]/5 border-[var(--accent)]/30'
                  }`}
                  onClick={() => !notif.read && markRead(notif.id)}
                >
                  <div
                    className="p-1.5 rounded shrink-0 mt-0.5"
                    style={{ backgroundColor: `${typeConfig.color}18` }}
                  >
                    <CheckCircle2 size={14} style={{ color: typeConfig.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-[var(--text-primary)]">{notif.title}</p>
                    {notif.body && (
                      <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">{notif.body}</p>
                    )}
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-2">{formatDate(notif.timestamp)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notif.id)
                    }}
                    className="text-[var(--text-tertiary)] hover:text-[#F43F5E] transition-colors p-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {showPreferences && (
        <PreferencesModal onClose={() => setShowPreferences(false)} productId={params.productSlug || ''} />
      )}
    </div>
  )
}
