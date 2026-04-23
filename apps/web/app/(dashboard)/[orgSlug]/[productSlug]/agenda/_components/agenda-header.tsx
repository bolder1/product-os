'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useAuthStore } from '../../../../../lib/auth-store'
import { useTaskStore } from '../../../../../lib/task-store'
import { useApprovalStore } from '../../../../../lib/approval-store'
import { useNotificationStore } from '../../../../../lib/notification-store'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function AgendaHeader() {
  const user = useAuthStore((s) => s.user)
  const allTasks = useTaskStore((s) => s.tasks)
  const pendingApprovals = useApprovalStore((s) => s.requests.filter((r) => r.status === 'pending').length)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const now = new Date()
  const h = now.getHours()
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'

  const today = now.toISOString().split('T')[0]
  const todayTaskCount = allTasks.filter(
    (t) => t.dueDate && t.dueDate.startsWith(today!) && t.status !== 'done'
  ).length

  // Build AI summary pill text
  const summaryParts: string[] = []
  if (todayTaskCount > 0) summaryParts.push(`${todayTaskCount} task${todayTaskCount !== 1 ? 's' : ''} due today`)
  if (pendingApprovals > 0) summaryParts.push(`${pendingApprovals} approval${pendingApprovals !== 1 ? 's' : ''} waiting`)
  if (unreadCount > 0) summaryParts.push(`${unreadCount} unread alert${unreadCount !== 1 ? 's' : ''}`)
  const summaryText = summaryParts.length > 0 ? summaryParts.join(' · ') : 'All clear — nothing urgent today'

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start justify-between mb-8 pb-6 border-b border-white/[0.06]"
    >
      <div className="flex flex-col gap-2">
        {/* Day + date */}
        <div className="flex items-baseline gap-3">
          <span className="text-[11px] font-medium tracking-widest uppercase text-[var(--text-tertiary)]">
            {DAYS[now.getDay()]}
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {MONTHS[now.getMonth()]} {now.getDate()}, {now.getFullYear()}
          </span>
        </div>

        {/* Greeting */}
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] leading-tight">
          {greeting}
          {user?.name && (
            <>
              ,{' '}
              <motion.span
                className="gradient-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {user.name}
              </motion.span>
            </>
          )}
        </h1>

        {/* AI summary pill */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex items-center gap-2 mt-1"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--accent-muted)] bg-[var(--accent-subtle)]">
            <Sparkles size={12} className="text-[var(--accent)]" />
            <span className="text-[12px] text-[var(--text-secondary)]">{summaryText}</span>
          </div>
        </motion.div>
      </div>

      {/* Right side: day-of-week indicator */}
      <div className="hidden sm:flex items-center gap-1 mt-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
          // Map: Mon=1, Tue=2, ... Sun=0 → adjusted index
          const dayIndex = (i + 1) % 7
          const isToday = now.getDay() === dayIndex
          const isPast = (() => {
            const d = now.getDay()
            // Normalize week: Mon=0..Sun=6
            const todayNorm = (d + 6) % 7
            return i < todayNorm
          })()
          return (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium transition-all ${
                isToday
                  ? 'bg-[var(--accent)] text-white'
                  : isPast
                    ? 'text-[var(--text-tertiary)]'
                    : 'text-[var(--text-secondary)] border border-white/[0.06]'
              }`}
            >
              {d}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
