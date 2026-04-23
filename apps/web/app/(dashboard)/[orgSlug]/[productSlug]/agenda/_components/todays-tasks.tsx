'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Circle } from 'lucide-react'
import { useTaskStore } from '../../../../../lib/task-store'

const priorityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'var(--color-error)', label: 'Critical' },
  high: { color: 'var(--color-warning)', label: 'High' },
  medium: { color: 'var(--accent)', label: 'Medium' },
  low: { color: '#3d3d3d', label: 'Low' },
}

function EmptyCalendar() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-3 opacity-40">
        <rect x="8" y="12" width="48" height="44" rx="6" stroke="var(--text-tertiary)" strokeWidth="1.5" fill="none" />
        <rect x="8" y="20" width="48" height="1.5" fill="var(--text-tertiary)" opacity="0.4" />
        <line x1="22" y1="8" x2="22" y2="18" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="8" x2="42" y2="18" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="40" r="8" stroke="var(--color-success)" strokeWidth="1.5" fill="none" />
        <path d="M28 40 l3 3 5-5" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm text-[var(--text-secondary)]">No tasks due today</p>
      <p className="text-xs text-[var(--text-tertiary)] mt-1">You&apos;re all caught up!</p>
    </div>
  )
}

export function TodaysTasksPanel() {
  const allTasks = useTaskStore((s) => s.tasks)
  const today = new Date().toISOString().split('T')[0]

  const todayTasks = allTasks
    .filter((t) => t.dueDate && t.dueDate.startsWith(today!))
    .sort((a, b) => {
      const order = ['critical', 'high', 'medium', 'low']
      return order.indexOf(a.priority) - order.indexOf(b.priority)
    })

  const doneTasks = todayTasks.filter((t) => t.status === 'done')
  const pendingTasks = todayTasks.filter((t) => t.status !== 'done')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-medium tracking-widest uppercase text-[var(--text-tertiary)]">
          Today&apos;s Tasks
        </h2>
        {todayTasks.length > 0 && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {doneTasks.length}/{todayTasks.length} done
          </span>
        )}
      </div>

      {todayTasks.length === 0 ? (
        <EmptyCalendar />
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          {/* Pending tasks */}
          {pendingTasks.map((task, i) => {
            const pc = priorityConfig[task.priority] ?? priorityConfig['medium']!
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.035)' }}
                className="flex items-start gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] cursor-pointer transition-colors"
                style={{ borderLeft: `3px solid ${pc.color}` }}
              >
                <Circle size={16} className="flex-shrink-0 mt-0.5" style={{ color: pc.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] leading-snug">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style={{ color: pc.color, backgroundColor: `${pc.color}15` }}
                    >
                      {pc.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] capitalize">{task.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Completed tasks */}
          {doneTasks.length > 0 && (
            <>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-2 mb-1 px-1">
                Completed
              </div>
              {doneTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-white/[0.04] bg-transparent"
                >
                  <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5 text-[var(--color-success)]" />
                  <p className="text-sm text-[var(--text-tertiary)] line-through leading-snug">{task.title}</p>
                </motion.div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
