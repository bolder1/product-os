'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { ListTodo, ArrowRight, Plus, Circle, Clock, AlertCircle } from 'lucide-react'
import { useTaskStore } from '../../../../../lib/task-store'
import { useAuth } from '../../../../../lib/auth-context'
import { trpc } from '../../../../../lib/trpc'

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: '#64748B', icon: Circle },
  in_progress: { label: 'In Progress', color: '#3B82F6', icon: Clock },
  in_review:   { label: 'In Review',   color: '#F59E0B', icon: Clock },
  blocked:     { label: 'Blocked',     color: '#F43F5E', icon: AlertCircle },
  done:        { label: 'Done',        color: '#10B981', icon: Circle },
  cancelled:   { label: 'Cancelled',   color: '#334155', icon: Circle },
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#F43F5E', urgent: '#F43F5E', high: '#F59E0B', medium: '#3B82F6', low: '#64748B',
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
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListTodo size={13} className="text-[#F59E0B]" />
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
            {myTasksOnly ? 'My Tasks' : 'Open Tasks'}
          </span>
          {totalOpen > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-bold">
              {totalOpen}
            </span>
          )}
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="w-5 h-5 rounded flex items-center justify-center text-[#475569] hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
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
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E2E8F0] placeholder-[#334155] outline-none focus:border-[#F59E0B]/50 transition-colors"
            onKeyDown={(e) => e.key === 'Escape' && setCreating(false)}
          />
          <div className="flex gap-2 mt-1.5">
            <button type="submit" disabled={!newTitle.trim() || createMutation.isPending}
              className="text-[10px] px-3 py-1 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/30 text-[#FCD34D] hover:bg-[#F59E0B]/30 disabled:opacity-40 transition-colors">
              Add
            </button>
            <button type="button" onClick={() => setCreating(false)}
              className="text-[10px] px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#64748B] hover:text-[#94A3B8] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      <div className="flex-1 space-y-1 overflow-y-auto pr-0.5">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
            <ListTodo size={20} className="text-[#334155]" />
            <p className="text-[11px] text-[#475569]">No open tasks. Time to plan!</p>
            <button
              onClick={() => setCreating(true)}
              className="text-[10px] text-[#F59E0B] hover:text-[#FCD34D] flex items-center gap-1 transition-colors"
            >
              <Plus size={10} /> Create first task
            </button>
          </div>
        ) : (
          tasks.map((task, i) => {
            const statusKey = task.status as keyof typeof STATUS_CONFIG
            const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.todo
            const StatusIcon = cfg.icon
            return (
              <motion.div
                key={task.id ?? i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0 group"
              >
                <StatusIcon size={10} style={{ color: cfg.color }} className="shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#E2E8F0] truncate group-hover:text-[#F1F5F9] transition-colors">
                    {task.title}
                  </p>
                  <p className="text-[9px] text-[#475569] mt-0.5">{cfg.label}</p>
                </div>
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{ backgroundColor: `${PRIORITY_COLOR[task.priority] ?? '#64748B'}18`, color: PRIORITY_COLOR[task.priority] ?? '#64748B' }}
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
          className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-[10px] text-[#3B82F6] hover:text-[#60A5FA] transition-colors"
        >
          View all {totalOpen} tasks <ArrowRight size={9} />
        </button>
      )}
    </motion.div>
  )
}
