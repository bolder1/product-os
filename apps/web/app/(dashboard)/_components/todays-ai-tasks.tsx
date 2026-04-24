'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { useTaskStore, type Task, type TaskPriority } from '../../lib/task-store'
import { useProductStore } from '../../lib/product-store'

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  critical: '#F43F5E',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#64748B',
}

function isToday(iso?: string): boolean {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function TodaysAITasks({ orgSlug }: { orgSlug: string }) {
  const tasks = useTaskStore((s) => s.tasks)
  const products = useProductStore((s) => s.products)

  const todays = useMemo(() => {
    const pool = tasks.filter((t) => {
      if (t.status === 'done' || t.status === 'cancelled') return false
      if (isToday(t.dueDate)) return true
      if (!t.dueDate && (t.priority === 'critical' || t.priority === 'high')) return true
      return false
    })
    pool.sort((a, b) => {
      const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (p !== 0) return p
      return (a.dueDate || '').localeCompare(b.dueDate || '')
    })
    return pool.slice(0, 5)
  }, [tasks])

  const findHref = (t: Task): string => {
    const product = products.find((p) => p.id === t.productId)
    if (!product) return '#'
    return `/${product.orgSlug || orgSlug}/${product.slug}/tasks`
  }

  return (
    <div className="relative p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* AI gradient accent */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 100% 0%, rgba(139,92,246,0.08), transparent 60%), radial-gradient(circle at 0% 100%, rgba(59,130,246,0.06), transparent 60%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent)]/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Today's Tasks</h2>
            <p className="text-[10px] text-[var(--accent)]">Curated by AI</p>
          </div>
        </div>
        {todays.length > 0 && (
          <span className="text-xs text-[var(--text-tertiary)]">{todays.length} focused</span>
        )}
      </div>

      {todays.length === 0 ? (
        <div className="relative flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
          </div>
          <p className="text-sm text-[var(--text-primary)]">You're clear for today ✨</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">No urgent work surfaced by AI</p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-2">
          {todays.map((task, i) => {
            const color = PRIORITY_COLOR[task.priority]
            const overdue = task.dueDate && new Date(task.dueDate) < new Date() && !isToday(task.dueDate)
            return (
              <motion.a
                key={task.id}
                href={findHref(task)}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-center gap-3 p-3 rounded-lg border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all"
              >
                <div
                  className="w-1 self-stretch rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate group-hover:text-white transition">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${color}18`, color }}
                    >
                      {task.priority}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{task.studio}</span>
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                        <Clock className="w-2.5 h-2.5" />
                        {isToday(task.dueDate) ? 'Today' : new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    {overdue && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--color-error)]">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[#94A3B8] group-hover:translate-x-0.5 transition" />
              </motion.a>
            )
          })}
        </div>
      )}
    </div>
  )
}
