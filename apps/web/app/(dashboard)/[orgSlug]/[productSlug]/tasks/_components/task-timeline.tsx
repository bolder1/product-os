'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, AlertTriangle } from 'lucide-react'
import { type Task, type TaskStatus, STATUS_CONFIG, PRIORITY_CONFIG } from '../_data/mock-tasks'

interface TaskTimelineProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
}

// ── Helpers ──

function parseDate(d: string): Date {
  return new Date(d + 'T00:00:00')
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function isOverdue(dueDate: string): boolean {
  return parseDate(dueDate) < new Date()
}

export function TaskTimeline({ tasks, onUpdateTask }: TaskTimelineProps) {
  // Compute timeline range
  const { rangeStart, rangeEnd, totalDays, weeks } = useMemo(() => {
    const now = new Date()
    const dates = tasks.map((t) => parseDate(t.dueDate)).filter((d) => !isNaN(d.getTime()))
    const createdDates = tasks.map((t) => parseDate(t.createdAt)).filter((d) => !isNaN(d.getTime()))
    const allDates = [...dates, ...createdDates, now]

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

    // Pad 3 days each side
    const start = new Date(minDate)
    start.setDate(start.getDate() - 3)
    const end = new Date(maxDate)
    end.setDate(end.getDate() + 7)

    const days = Math.max(daysBetween(start, end), 14)

    // Generate week markers
    const weekMarkers: { date: Date; offset: number }[] = []
    const cursor = new Date(start)
    // Align to Monday
    cursor.setDate(cursor.getDate() + ((8 - cursor.getDay()) % 7))
    while (cursor <= end) {
      weekMarkers.push({
        date: new Date(cursor),
        offset: daysBetween(start, cursor) / days,
      })
      cursor.setDate(cursor.getDate() + 7)
    }

    return { rangeStart: start, rangeEnd: end, totalDays: days, weeks: weekMarkers }
  }, [tasks])

  // Sort tasks by due date
  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime()),
    [tasks]
  )

  const todayOffset = useMemo(() => {
    const pct = daysBetween(rangeStart, new Date()) / totalDays
    return Math.max(0, Math.min(1, pct))
  }, [rangeStart, totalDays])

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Calendar className="w-6 h-6 text-[var(--text-tertiary)] mx-auto mb-2" />
          <p className="text-[12px] text-[var(--text-secondary)]">No tasks to display</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-[800px] px-4 py-3">
        {/* ── Header: week markers ── */}
        <div className="relative h-8 mb-1 border-b border-[var(--border-default)]">
          {weeks.map((w, i) => (
            <div
              key={i}
              className="absolute top-0 text-[10px] text-[var(--text-tertiary)] font-medium"
              style={{ left: `${w.offset * 100}%` }}
            >
              <div className="border-l border-[var(--border-default)] pl-1.5 h-8 flex items-end pb-1">
                {formatDateShort(w.date)}
              </div>
            </div>
          ))}

          {/* Today marker */}
          <div
            className="absolute top-0 bottom-0 w-px bg-[var(--accent)]"
            style={{ left: `${todayOffset * 100}%` }}
          >
            <div className="absolute -top-0.5 -translate-x-1/2 text-[9px] font-bold text-[var(--accent)] bg-[var(--bg-workspace)] px-1 rounded">
              Today
            </div>
          </div>
        </div>

        {/* ── Task rows ── */}
        <div className="space-y-1">
          {sortedTasks.map((task, i) => {
            const created = parseDate(task.createdAt)
            const due = parseDate(task.dueDate)
            const startPct = Math.max(0, daysBetween(rangeStart, created) / totalDays)
            const endPct = Math.max(startPct + 0.02, daysBetween(rangeStart, due) / totalDays)
            const widthPct = Math.min(endPct - startPct, 1 - startPct)
            const statusColor = STATUS_CONFIG[task.status]?.color ?? '#64748B'
            const priorityColor = PRIORITY_CONFIG[task.priority]?.color ?? '#64748B'
            const overdue = task.status !== 'done' && isOverdue(task.dueDate)

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="relative h-10 group"
              >
                {/* Background grid lines at week boundaries */}
                {weeks.map((w, wi) => (
                  <div
                    key={wi}
                    className="absolute top-0 bottom-0 w-px bg-[var(--border-default)] opacity-30"
                    style={{ left: `${w.offset * 100}%` }}
                  />
                ))}

                {/* Today line */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-[var(--accent)] opacity-20"
                  style={{ left: `${todayOffset * 100}%` }}
                />

                {/* Task bar */}
                <div
                  className={`absolute top-1 bottom-1 rounded-md flex items-center gap-1.5 px-2 cursor-pointer transition-all hover:brightness-110 ${
                    overdue ? 'ring-1 ring-[var(--color-error)]/40' : ''
                  }`}
                  style={{
                    left: `${startPct * 100}%`,
                    width: `${widthPct * 100}%`,
                    minWidth: '120px',
                    backgroundColor: `${statusColor}18`,
                    borderLeft: `3px solid ${statusColor}`,
                  }}
                  title={`${task.title} — ${task.status} — Due: ${task.dueDate}`}
                >
                  {/* Priority dot */}
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: priorityColor }}
                  />

                  {/* Title */}
                  <span className="text-[11px] text-[var(--text-primary)] font-medium truncate flex-1">
                    {task.title}
                  </span>

                  {/* Overdue warning */}
                  {overdue && (
                    <AlertTriangle className="w-3 h-3 text-[var(--color-error)] shrink-0" />
                  )}

                  {/* Due date */}
                  <span className={`text-[9px] shrink-0 ${overdue ? 'text-[var(--color-error)]' : 'text-[var(--text-tertiary)]'}`}>
                    {formatDateShort(due)}
                  </span>

                  {/* Assignee */}
                  <div
                    className="w-5 h-5 rounded bg-[var(--bg-overlay)] flex items-center justify-center shrink-0"
                  >
                    <span className="text-[8px] font-medium text-[var(--text-secondary)]">
                      {task.assignee.initials}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border-default)]">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-[10px] text-[var(--text-tertiary)]">{config.label}</span>
            </div>
          ))}
          <div className="w-px h-3 bg-[var(--border-default)] mx-1" />
          {Object.entries(PRIORITY_CONFIG).map(([priority, config]) => (
            <div key={priority} className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-[10px] text-[var(--text-tertiary)]">{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
