'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ListTodo, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useProduct } from '../../layout'
import { useTaskStore } from '../../../../../lib/task-store'

type Priority = 'critical' | 'high' | 'medium' | 'low'
type Status = 'todo' | 'in_progress' | 'review'

const priorityColors: Record<Priority, string> = {
  critical: '#F43F5E',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#64748B',
}

const statusColors: Record<Status, string> = {
  todo: '#64748B',
  in_progress: '#3B82F6',
  review: '#F59E0B',
}

const statusLabels: Record<Status, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
}

const fallbackTasks = [
  { title: 'Implement OAuth2 flow', assignee: 'Alice', priority: 'critical' as Priority, status: 'in_progress' as Status, due: 'Mar 30' },
  { title: 'Design onboarding screens', assignee: 'Carol', priority: 'high' as Priority, status: 'todo' as Status, due: 'Apr 1' },
  { title: 'Add rate limiting to API', assignee: 'Dave', priority: 'high' as Priority, status: 'review' as Status, due: 'Mar 29' },
  { title: 'Write unit tests for Payments', assignee: 'Frank', priority: 'medium' as Priority, status: 'in_progress' as Status, due: 'Apr 3' },
  { title: 'Update README documentation', assignee: 'Eve', priority: 'low' as Priority, status: 'todo' as Status, due: 'Apr 5' },
]

export function OpenTasks() {
  const params = useParams()
  const product = useProduct()
  const productId = product?.id ?? (params.productSlug as string)
  const allTasks = useTaskStore((s) => s.tasks)
  const storeTasks = useMemo(() => allTasks.filter((t) => t.productId === productId), [allTasks, productId])

  const tasks = useMemo(() => {
    const open = storeTasks.filter((t) => t.status !== 'done')
    if (open.length > 0) {
      return open.slice(0, 5).map((t) => ({
        title: t.title,
        assignee: t.assignee.name,
        priority: t.priority as Priority,
        status: (t.status === 'in_review' ? 'review' : t.status === 'blocked' ? 'todo' : t.status) as Status,
        due: new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
    }
    return fallbackTasks
  }, [storeTasks])

  const totalOpen = storeTasks.filter((t) => t.status !== 'done').length || 12

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-[var(--color-warning)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            Open Tasks
          </span>
          <span className="text-xs bg-[var(--color-warning)]/10 text-[var(--color-warning)] px-2 py-0.5 rounded-full font-medium">
            {totalOpen}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-1">
        {tasks.map((task, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.07, duration: 0.3 }}
            className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0"
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: statusColors[task.status] }}
              title={statusLabels[task.status]}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-[var(--text-tertiary)]">{task.assignee}</span>
                <span className="text-[10px] text-[var(--text-tertiary)]">Due {task.due}</span>
              </div>
            </div>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
              style={{
                backgroundColor: priorityColors[task.priority] + '15',
                color: priorityColors[task.priority],
              }}
            >
              {task.priority}
            </span>
          </motion.div>
        ))}
      </div>

      <Link
        href={`/${params.orgSlug}/${params.productSlug}/tasks`}
        className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-white/[0.06] text-xs text-[var(--accent)] hover:text-[var(--accent)] transition-colors"
      >
        View All Tasks
        <ArrowRight className="w-3 h-3" />
      </Link>
    </motion.div>
  )
}
