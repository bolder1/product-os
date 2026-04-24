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

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
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
    return pool.slice(0, 6)
  }, [tasks])

  const findHref = (t: Task): string => {
    const product = products.find((p) => p.id === t.productId)
    if (!product) return '#'
    return `/${product.orgSlug || orgSlug}/${product.slug}/tasks`
  }

  const productName = (t: Task): string => {
    const p = products.find((x) => x.id === t.productId)
    return p?.name || 'Unassigned'
  }

  const criticalCount = todays.filter((t) => t.priority === 'critical').length

  return (
    <section>
      <div className="flex items-end justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)]/25 to-[#8B5CF6]/25 border border-white/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl border border-[var(--accent)]/40 pointer-events-none"
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Today's Tasks</h2>
              <span className="text-[10px] font-semibold tracking-wider text-[var(--accent)] uppercase px-2 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                AI Curated
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {todays.length > 0
                ? `${todays.length} focused item${todays.length > 1 ? 's' : ''}${criticalCount > 0 ? ` • ${criticalCount} critical` : ''}`
                : 'No urgent work surfaced'}
            </p>
          </div>
        </div>
      </div>

      {todays.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="w-14 h-14 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-[var(--color-success)]" />
          </div>
          <p className="text-base text-[var(--text-primary)]">You're clear for today ✨</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Nothing urgent surfaced by AI</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {todays.map((task, i) => {
            const color = PRIORITY_COLOR[task.priority]
            const overdue = task.dueDate && new Date(task.dueDate) < new Date() && !isToday(task.dueDate)
            return (
              <motion.a
                key={task.id}
                href={findHref(task)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -2 }}
                className="group relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all overflow-hidden"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ backgroundColor: color }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 100% 0%, ${color}16, transparent 65%)` }}
                />

                <div className="relative">
                  <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color}1F`, color }}
                    >
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] capitalize px-1.5 py-0.5 rounded bg-white/[0.04]">
                      {task.studio}
                    </span>
                    {overdue && (
                      <span className="flex items-center gap-1 text-[10px] text-[var(--color-error)]">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Overdue
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 group-hover:text-white transition leading-snug min-h-[2.5rem]">
                    {task.title}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)] truncate max-w-[70%]">
                      {task.dueDate ? (
                        <>
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">
                            {isToday(task.dueDate) ? 'Today' : new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </>
                      ) : (
                        <span className="truncate">{productName(task)}</span>
                      )}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </motion.a>
            )
          })}
        </div>
      )}
    </section>
  )
}
