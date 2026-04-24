'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Inbox, Settings, Trash2, CheckCircle2, CheckCheck } from 'lucide-react'
import { trpc } from '../../../../lib/trpc'
import { useNotificationStore } from '../../../../lib/notification-store'
import { PreferencesModal } from './_components/preferences-modal'
import { StudioShell, StudioPageHeader, StudioBody, StudioToolbar } from '../../../../components/shared/studio-shell'

/**
 * Per R20 palette consolidation, every notification type rides the semantic
 * tone ramp instead of a bespoke hex. Icon + label still convey the type;
 * color is now a meaning signal, not an identity signal.
 */
type Tone = 'info' | 'success' | 'warning' | 'accent' | 'neutral'

const TYPE_CONFIG: Record<string, { label: string; tone: Tone }> = {
  task_assigned: { label: 'Task Assigned', tone: 'info' },
  task_updated: { label: 'Task Updated', tone: 'warning' },
  approval_requested: { label: 'Approval Requested', tone: 'accent' },
  approval_decided: { label: 'Approval Decided', tone: 'success' },
  comment_mention: { label: 'Mentioned in Comment', tone: 'accent' },
  comment_reply: { label: 'Comment Reply', tone: 'accent' },
  release_ready: { label: 'Release Ready', tone: 'success' },
  system: { label: 'System', tone: 'neutral' },
}

/** Pre-composed tone → classname pairs — no template-literal concat needed. */
const toneBg: Record<Tone, string> = {
  info: 'bg-[var(--accent-subtle)]',
  success: 'bg-[var(--color-success-muted)]',
  warning: 'bg-[var(--color-warning-muted)]',
  accent: 'bg-[var(--accent-muted)]',
  neutral: 'bg-[var(--bg-inset)]',
}
const toneFg: Record<Tone, string> = {
  info: 'text-[var(--accent)]',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  accent: 'text-[var(--accent-text)]',
  neutral: 'text-[var(--text-tertiary)]',
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
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const deleteNotification = useNotificationStore((s) => s.deleteNotification)
  const storeUnread = useNotificationStore((s) => s.unreadCount)
  const { data: remoteUnread } = trpc.notification.getUnreadCount.useQuery()
  const unreadCount = remoteUnread ?? storeUnread

  const filteredNotifications = useMemo(
    () => (filterType ? notifications.filter((n) => n.type === filterType) : notifications),
    [notifications, filterType],
  )

  const typeOptions = useMemo(
    () => Object.keys(TYPE_CONFIG).filter((type) => notifications.some((n) => n.type === type)),
    [notifications],
  )

  return (
    <StudioShell>
      <StudioPageHeader
        title="Notifications"
        subtitle={`${unreadCount || 0} unread`}
        actions={
          <>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-inset)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                aria-label="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setShowPreferences(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--accent-text)] transition-colors hover:bg-[var(--accent-muted)]"
            >
              <Settings size={14} />
              Preferences
            </button>
          </>
        }
      />

      <StudioToolbar>
        <button
          onClick={() => setFilterType(null)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
            filterType === null
              ? 'bg-[var(--accent)] text-[var(--color-white)]'
              : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
          }`}
        >
          All
        </button>
        {typeOptions.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              filterType === type
                ? 'bg-[var(--accent)] text-[var(--color-white)]'
                : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
            }`}
          >
            {TYPE_CONFIG[type].label}
          </button>
        ))}
      </StudioToolbar>

      <StudioBody padded={false}>
        {filteredNotifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-16">
            <Inbox size={32} className="text-[var(--text-tertiary)] opacity-40" />
            <p className="text-sm text-[var(--text-secondary)]">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2 px-6 py-5">
            {filteredNotifications.map((notif) => {
              const typeConfig = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.system
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    notif.read
                      ? 'border-[var(--border-subtle)] bg-[var(--bg-inset)]'
                      : 'border-[var(--border-accent)] bg-[var(--accent-subtle)]'
                  }`}
                  onClick={() => !notif.read && markRead(notif.id)}
                >
                  <div className={`mt-0.5 shrink-0 rounded p-1.5 ${toneBg[typeConfig.tone]}`}>
                    <CheckCircle2 size={14} className={toneFg[typeConfig.tone]} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{notif.title}</p>
                    {notif.body && (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{notif.body}</p>
                    )}
                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">{formatDate(notif.timestamp)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notif.id)
                    }}
                    className="p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--color-error)]"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </StudioBody>

      {showPreferences && (
        <PreferencesModal onClose={() => setShowPreferences(false)} productId={params.productSlug || ''} />
      )}
    </StudioShell>
  )
}
