'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { ListTodo, ArrowRight, Plus, Circle, Clock, AlertCircle } from 'lucide-react'
import { useTaskStore } from '../../../../../lib/task-store'
import { useAuth } from '../../../../../lib/auth-context'
import { trpc } from '../../../../../lib/trpc'

// R20.6 — status maps to semantic tokens. 'todo' and 'cancelled' are neutral
// (tertiary text); active states map to accent/warning/error/success.
const STATUS_CONFIG = {
  todo:        { label: 'To Do',       tone: 'neutral', icon: Circle },
  in_progress: { label: 'In Progress', tone: 'accent',  icon: Clock },
  in_review:   { label: 'In Review',   tone: 'warning', icon: Clock },
  blocked:     { label: 'Blocked',     tone: 'error',   icon: AlertCircle },
  done:        { label: 'Done',        tone: 'success', icon: Circle },
  cancelled:   { label: 'Cancelled',   tone: 'neutral', icon: Circle },
} as const

type Tone = 'neutral' | 'accent' | 'warning' | 'error' | 'success'
const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-[var(--text-tertiary)]',
  accent:  'text-[var(--accent)]',
  warning: 'text-[var(--color-warning)]',
  error:   'text-[var(--color-error)]',
  success: 'text-[var(--color-success)]',
}

// Priority maps to semantic severity. critical/urgent = error, high = warning,
// medium = accent, low = neutral.
const PRIORITY_TONE: Record<string, Tone> = {
  critical: 'error',
  urgent:   'error',
  high:     'warning',
  medium:   'accent',
  low:      'neutral',
}
const PRIORITY_PILL: Record<Tone, string> = {
  error:   'bg-[var(--color-error-muted)] text-[var(--color-error)]',
  warning: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
  accent:  'bg-[var(--accent-subtle)] text-[var(--accent-text)]',
  success: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  neutral: 'bg-[var(--bg-inset)] text-[var(--text-tertiary)]',
}

interface Props {
  productId: string
  /** If true, shows only the current user's tasks; if false shows all open tasks */
  myTasksOnly?: boolean
  maxItems?: number
}

export function MyTasksPanel({ productId, myTasksOnly = true, maxItems = 6 }: Props) {
  const params  = useParams<{ orgSlug: string; productSlug: string }>()
  const router  = useRouter()
  const { user } = useAuth()
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const allTasks  = useTaskStore((s) => s.tasks)
  const storeTasks = useMemo(
    () => allTasks.filter((t) => t.productId === productId),
    [allTasks, productId],
  )

  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => { setNewTitle(''); setCreating(false) },
  })

  const tasks = useMemo(() => {
    let filtered = storeTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled')
    if (myTasksOnly && user) {
      const mine = filtered.filter((t) => t.assignee?.id === user.id)
      filtered = mine.length > 0 ? mine : filtered
    }
    return filtered
      .sort((a, b) => {
        const P: Record<string, number> = { critical: 0, urgent: 0, high: 1, medium: 2, low: 3 }
        return (P[a.priority] ?? 2) - (P[b.priority] ?? 2)
      })
      .slice(0, maxItems)
  }, [storeTasks, myTasksOnly, user, maxItems])

  const totalOpen = storeTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    createMutation.mutate({ productId, title: newTitle.trim(), status: 'todo', priority: 'medium' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo size={13} className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            {myTasksOnly ? 'My Tasks' : 'Open Tasks'}
          </span>
          {totalOpen > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-text)] font-bold">
              {totalOpen}
            </span>
          )}
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="w-5 h-5 rounded flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Quick create */}
      {creating && (
        <form onSubmit={handleCreate} className="mb-3">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title…"
            className="w-full bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] transition-colors"
            onKeyDown={(e) => e.key === 'Escape' && setCreating(false)}
          />
          <div className="flex gap-2 mt-1.5">
            <button type="submit" disabled={!newTitle.trim() || createMutation.isPending}
              className="text-[10px] px-3 py-1 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[var(--accent-text)] hover:bg-[var(--accent)]/20 disabled:opacity-40 transition-colors">
              Add
            </button>
            <button type="button" onClick={() => setCreating(false)}
              className="text-[10px] px-3 py-1 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-0.5">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <ListTodo size={20} className="text-[var(--text-tertiary)]" />
            <p className="text-[11px] text-[var(--text-tertiary)]">No open tasks. Time to plan!</p>
            <button
              onClick={() => setCreating(true)}
              className="text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)] flex items-center gap-1 transition-colors"
            >
              <Plus size={10} /> Create first task
            </button>
          </div>
        ) : (
          tasks.map((task, i) => {
            const statusKey = task.status as keyof typeof STATUS_CONFIG
            const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.todo
            const StatusIcon = cfg.icon
            const statusClass = TONE_TEXT[cfg.tone]
            const priorityTone = PRIORITY_TONE[task.priority] ?? 'neutral'
            return (
              <motion.div
                key={task.id ?? i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="flex items-center gap-2.5 py-2 border-b border-[var(--border-subtle)] last:border-0 group"
              >
                <StatusIcon size={10} className={`${statusClass} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--text-primary)] truncate group-hover:text-[var(--text-primary)] transition-colors">
                    {task.title}
                  </p>
                  <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">{cfg.label}</p>
                </div>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${PRIORITY_PILL[priorityTone]}`}
                >
                  {task.priority}
                </span>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Footer */}
      {totalOpen > maxItems && (
        <button
          onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/tasks`)}
          className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-center gap-1.5 text-[10px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
        >
          View all {totalOpen} tasks <ArrowRight size={9} />
        </button>
      )}
    </motion.div>
  )
}
