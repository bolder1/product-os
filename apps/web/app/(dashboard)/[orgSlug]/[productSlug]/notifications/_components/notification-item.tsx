'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  CheckSquare,
  Shield,
  AtSign,
  Bell,
  ChevronDown,
  Eye,
  XCircle,
} from 'lucide-react'
import type { Notification, NotificationType } from '../_data/mock-notifications'

interface NotificationItemProps {
  notification: Notification
  index: number
  onMarkRead: (id: string) => void
  onDismiss: (id: string) => void
}

const typeIcons: Record<NotificationType, React.ElementType> = {
  comment: MessageSquare,
  task: CheckSquare,
  approval: Shield,
  mention: AtSign,
  system: Bell,
}

const typeColors: Record<NotificationType, string> = {
  comment: '#3B82F6',
  task: '#10B981',
  approval: '#F59E0B',
  mention: '#EC4899',
  system: '#94A3B8',
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  const now = new Date('2026-03-29T12:00:00Z')
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NotificationItem({
  notification,
  index,
  onMarkRead,
  onDismiss,
}: NotificationItemProps) {
  const [expanded, setExpanded] = useState(false)
  const Icon = typeIcons[notification.type]
  const color = typeColors[notification.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`group rounded-xl border transition-colors ${
        notification.read
          ? 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'
          : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05]'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left"
      >
        {/* Type icon */}
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
          style={{ backgroundColor: color + '15' }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)] line-clamp-2">
            <span className="font-medium">{notification.actor.name}</span>{' '}
            <span className="text-[var(--text-secondary)]">{notification.action}</span>{' '}
            <span className="font-medium text-[var(--text-primary)]">{notification.target}</span>
          </p>
        </div>

        {/* Right side */}
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap">
            {formatTimestamp(notification.timestamp)}
          </span>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pl-[3.75rem]">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                {notification.message}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarkRead(notification.id)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDismiss(notification.id)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <XCircle className="w-3 h-3" />
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
