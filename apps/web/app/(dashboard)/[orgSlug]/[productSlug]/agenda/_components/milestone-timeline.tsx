'use client'

import { motion } from 'framer-motion'
import { useTaskStore } from '../../../../../lib/task-store'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekDays(): Date[] {
  const now = new Date()
  const dow = now.getDay() // 0=Sun
  // Start week on Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const priorityColors: Record<string, string> = {
  critical: 'var(--color-error)',
  high: 'var(--color-warning)',
  medium: 'var(--accent)',
  low: '#3d4d5f',
}

export function MilestoneTimeline() {
  const allTasks = useTaskStore((s) => s.tasks)
  const weekDays = getWeekDays()
  const today = new Date().toISOString().split('T')[0]

  // Map date → tasks
  const tasksByDate: Record<string, typeof allTasks> = {}
  for (const day of weekDays) {
    const key = day.toISOString().split('T')[0]!
    tasksByDate[key] = allTasks.filter(
      (t) => t.dueDate && t.dueDate.startsWith(key)
    )
  }

  const hasMilestones = Object.values(tasksByDate).some((t) => t.length > 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-medium tracking-widest uppercase text-[var(--text-tertiary)]">
          This Week
        </h2>
        {hasMilestones && (
          <span className="text-[10px] text-[var(--text-tertiary)]">Milestone view</span>
        )}
      </div>

      <div className="relative overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {weekDays.map((day, i) => {
            const key = day.toISOString().split('T')[0]!
            const tasks = tasksByDate[key] ?? []
            const isToday = key === today

            return (
              <div key={i} className="flex flex-col items-center gap-2" style={{ minWidth: 80 }}>
                {/* Day header */}
                <div className={`text-[11px] font-medium px-2 py-1 rounded-md ${
                  isToday
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-tertiary)]'
                }`}>
                  {DAY_LABELS[i]}
                  <span className="ml-1 text-[10px] opacity-70">{day.getDate()}</span>
                </div>

                {/* Column container */}
                <div className={`w-full min-h-[80px] rounded-lg border ${
                  isToday
                    ? 'border-[var(--accent)]/20 bg-[var(--accent)]/[0.04]'
                    : 'border-white/[0.05] bg-white/[0.01]'
                } p-2 flex flex-col gap-1.5`}>
                  {tasks.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-white/[0.1]" />
                    </div>
                  ) : (
                    tasks.slice(0, 3).map((task, ti) => (
                      <motion.div
                        key={task.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 + ti * 0.06 + i * 0.02, type: 'spring', stiffness: 280 }}
                        className="flex items-center gap-1.5 cursor-pointer"
                        whileHover={{ x: 2 }}
                        title={task.title}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: priorityColors[task.priority] ?? priorityColors['medium'] }}
                        />
                        <span className="text-[10px] text-[var(--text-secondary)] truncate leading-tight"
                          style={{ maxWidth: 56 }}>
                          {task.title}
                        </span>
                      </motion.div>
                    ))
                  )}
                  {tasks.length > 3 && (
                    <span className="text-[9px] text-[var(--text-tertiary)] mt-0.5">+{tasks.length - 3} more</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Connecting SVG line */}
        <svg className="absolute top-[52px] left-0 w-full h-[2px] pointer-events-none opacity-20" style={{ zIndex: 0 }}>
          <motion.line
            x1="0" y1="1" x2="100%" y2="1"
            stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 8"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
      </div>

      {!hasMilestones && (
        <p className="text-[11px] text-[var(--text-tertiary)] text-center py-4 mt-2">
          No milestones scheduled for this week
        </p>
      )}
    </div>
  )
}
