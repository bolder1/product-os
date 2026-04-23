'use client'

import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, AlertTriangle, Users } from 'lucide-react'
import { useTaskStore } from '../../../../../lib/task-store'
import { useNotificationStore } from '../../../../../lib/notification-store'

const insights = [
  {
    icon: TrendingUp,
    color: '#6398ff',
    title: 'Focus area for today',
    body: 'Prioritise in-review tasks to unblock downstream work. Review pending items before EOD.',
  },
  {
    icon: AlertTriangle,
    color: '#e8a830',
    title: 'Blockers to address',
    body: 'Two tasks are awaiting feedback longer than 48h. Consider pinging assignees.',
  },
  {
    icon: Users,
    color: '#3dd68c',
    title: 'Team highlight',
    body: 'Great velocity this sprint. Your team closed 12 tasks in the last 3 days.',
  },
]

export function AIDailyBrief() {
  const totalTasks = useTaskStore((s) => s.tasks.length)
  const doneTasks = useTaskStore((s) => s.tasks.filter((t) => t.status === 'done').length)
  const unread = useNotificationStore((s) => s.unreadCount)

  const velocity = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[11px] font-medium tracking-widest uppercase text-[var(--text-tertiary)]">
          AI Daily Brief
        </h2>
        <Sparkles size={12} className="text-[var(--accent)]" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-center">
          <div className="text-lg font-semibold gradient-text">{velocity}%</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">Completion</div>
        </div>
        <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-center">
          <div className="text-lg font-semibold text-[var(--color-warning)]">{unread}</div>
          <div className="text-[10px] text-[var(--text-tertiary)]">Unread</div>
        </div>
      </div>

      {/* AI insights — glass card with gradient border */}
      <motion.div
        className="gradient-border rounded-xl p-4 bg-[var(--bg-surface)] flex flex-col gap-3 flex-1"
        style={{ animation: 'float 7s ease-in-out infinite' }}
      >
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
              className="flex items-start gap-2.5"
            >
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${insight.color}15` }}
              >
                <Icon size={12} style={{ color: insight.color }} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[var(--text-primary)]">{insight.title}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed mt-0.5">{insight.body}</p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
