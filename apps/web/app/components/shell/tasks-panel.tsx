'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckSquare,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  Check,
  User,
} from 'lucide-react'
import { type PanelTask, panelTasks } from './tasks-panel-data'
import { useTaskStore, type Task } from '../../lib/task-store'
import { useParams } from 'next/navigation'

type FilterTab = 'all' | 'mine' | 'overdue' | 'by_studio'
type StatusGroup = 'in_progress' | 'todo' | 'in_review'

const STATUS_ORDER: StatusGroup[] = ['in_progress', 'todo', 'in_review']

const STATUS_LABELS: Record<StatusGroup, string> = {
  in_progress: 'In Progress',
  todo: 'Todo',
  in_review: 'In Review',
}

const STATUS_COLORS: Record<StatusGroup, string> = {
  in_progress: '#3B82F6',
  todo: '#64748B',
  in_review: '#F59E0B',
}

const PRIORITY_COLORS: Record<PanelTask['priority'], string> = {
  critical: '#F43F5E',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#64748B',
}

const STUDIO_COLORS: Record<string, string> = {
  brand: '#EC4899',
  workflows: '#10B981',
  components: '#F59E0B',
  testing: '#F59E0B',
  design: '#06B6D4',
  analytics: '#8B5CF6',
  approvals: '#10B981',
  pages: '#3B82F6',
}

const STORAGE_KEY = 'tasks-panel-open'
const CURRENT_USER = 'Alice Chen'

export function TasksPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const params = useParams()
  const productId = params?.orgSlug && params?.productSlug
    ? `${params.orgSlug}-${params.productSlug}`
    : null
  const { tasks: storeTasks, moveTask } = useTaskStore()

  // Merge store tasks with fallback mock tasks
  const tasks: PanelTask[] = useMemo(() => {
    const realTasks: PanelTask[] = storeTasks
      .filter((t) => !productId || t.productId === productId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status === 'blocked' ? 'todo' as const : t.status,
        priority: t.priority,
        assignee: { name: t.assignee.name, initials: t.assignee.initials },
        dueDate: t.dueDate,
        studio: t.studio,
        feature: t.feature,
        description: t.description,
        role: t.role,
      }))
    // Show store tasks if available, otherwise fall back to mock data
    return realTasks.length > 0 ? realTasks : panelTasks
  }, [storeTasks, productId])

  // Hydrate from localStorage after mount
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') setIsOpen(true)
    } catch {}
  }, [])

  // Persist open/closed state
  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen))
    } catch {}
  }, [isOpen, mounted])

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'done'),
    [tasks]
  )

  const filteredTasks = useMemo(() => {
    const now = new Date()
    switch (activeFilter) {
      case 'mine':
        return activeTasks.filter((t) => t.assignee.name === CURRENT_USER)
      case 'overdue':
        return activeTasks.filter((t) => new Date(t.dueDate) < now)
      case 'by_studio':
        return [...activeTasks].sort((a, b) => a.studio.localeCompare(b.studio))
      default:
        return activeTasks
    }
  }, [activeTasks, activeFilter])

  const grouped = useMemo(() => {
    const map: Record<StatusGroup, PanelTask[]> = {
      in_progress: [],
      todo: [],
      in_review: [],
    }
    for (const t of filteredTasks) {
      if (t.status in map) {
        map[t.status as StatusGroup].push(t)
      }
    }
    return map
  }, [filteredTasks])

  const markDone = (id: string) => {
    // Try store first, then fall back to local state
    moveTask(id, 'done')
    if (expandedTaskId === id) setExpandedTaskId(null)
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diff < 0) return `${Math.abs(diff)}d overdue`
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    return `${diff}d left`
  }

  const isOverdue = (d: string) => new Date(d) < new Date()

  if (!mounted) return null

  return (
    <>
      {/* Floating button (collapsed state) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/25 hover:bg-[#2563EB] transition-colors group"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CheckSquare size={18} />
            </motion.div>
            <span className="text-sm font-medium">
              {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed top-0 right-0 z-50 h-screen w-[380px] flex flex-col bg-[#0a0f1e]/95 backdrop-blur-xl border-l border-white/[0.08] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <CheckSquare size={18} className="text-[#3B82F6]" />
                <h2 className="text-sm font-semibold text-[#F1F5F9]">
                  My Tasks
                </h2>
                <span className="px-1.5 py-0.5 rounded-md bg-[#3B82F6]/15 text-[#3B82F6] text-[0.6875rem] font-medium">
                  {activeTasks.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#64748B] hover:text-[#94A3B8] transition-colors">
                  <Filter size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 px-5 py-2.5 border-b border-white/[0.05]">
              {(
                [
                  ['all', 'All'],
                  ['mine', 'Mine'],
                  ['overdue', 'Overdue'],
                  ['by_studio', 'By Studio'],
                ] as [FilterTab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`px-2.5 py-1 rounded-md text-[0.6875rem] font-medium transition-colors ${
                    activeFilter === key
                      ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                      : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {STATUS_ORDER.map((status) => {
                const groupTasks = grouped[status]
                if (groupTasks.length === 0) return null
                return (
                  <div key={status}>
                    {/* Group header */}
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status] }}
                      />
                      <span className="text-[0.6875rem] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-[0.625rem] text-[#475569]">
                        {groupTasks.length}
                      </span>
                    </div>

                    {/* Task cards */}
                    <div className="space-y-1.5">
                      {groupTasks.map((task, idx) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.2 }}
                        >
                          {/* Card */}
                          <button
                            onClick={() =>
                              setExpandedTaskId(
                                expandedTaskId === task.id ? null : task.id
                              )
                            }
                            className="w-full text-left px-3 py-2.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors group"
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Priority dot */}
                              <div
                                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                style={{
                                  backgroundColor:
                                    PRIORITY_COLORS[task.priority],
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-[0.8125rem] text-[#E2E8F0] leading-snug truncate">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  {/* Due date */}
                                  <span
                                    className={`flex items-center gap-1 text-[0.625rem] ${
                                      isOverdue(task.dueDate)
                                        ? 'text-[#F43F5E]'
                                        : 'text-[#64748B]'
                                    }`}
                                  >
                                    <Clock size={10} />
                                    {formatDate(task.dueDate)}
                                  </span>
                                  {/* Studio badge */}
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[0.5625rem] font-medium"
                                    style={{
                                      color:
                                        STUDIO_COLORS[task.studio] || '#94A3B8',
                                      backgroundColor: `${STUDIO_COLORS[task.studio] || '#94A3B8'}15`,
                                    }}
                                  >
                                    {task.studio}
                                  </span>
                                </div>
                              </div>
                              {/* Assignee avatar */}
                              <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                                <span className="text-[0.5625rem] font-medium text-[#94A3B8]">
                                  {task.assignee.initials}
                                </span>
                              </div>
                              {/* Expand indicator */}
                              {expandedTaskId === task.id ? (
                                <ChevronUp
                                  size={12}
                                  className="text-[#475569] mt-1 shrink-0"
                                />
                              ) : (
                                <ChevronDown
                                  size={12}
                                  className="text-[#475569] mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                />
                              )}
                            </div>
                          </button>

                          {/* Expanded detail */}
                          <AnimatePresence>
                            {expandedTaskId === task.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 py-3 mx-1 mt-1 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-3">
                                  {task.description && (
                                    <p className="text-[0.75rem] text-[#94A3B8] leading-relaxed">
                                      {task.description}
                                    </p>
                                  )}

                                  {task.feature && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[0.625rem] text-[#475569]">
                                        Feature:
                                      </span>
                                      <span className="text-[0.6875rem] text-[#CBD5E1]">
                                        {task.feature}
                                      </span>
                                    </div>
                                  )}

                                  {task.role && (
                                    <div className="flex items-center gap-2">
                                      <User size={10} className="text-[#475569]" />
                                      <span className="text-[0.625rem] text-[#475569]">
                                        Role:
                                      </span>
                                      <span className="text-[0.6875rem] text-[#CBD5E1]">
                                        {task.role}
                                      </span>
                                    </div>
                                  )}

                                  {/* Status dropdown (static for now) */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[0.625rem] text-[#475569]">
                                      Status:
                                    </span>
                                    <span
                                      className="px-2 py-0.5 rounded text-[0.625rem] font-medium"
                                      style={{
                                        color:
                                          STATUS_COLORS[
                                            task.status as StatusGroup
                                          ] || '#64748B',
                                        backgroundColor: `${STATUS_COLORS[task.status as StatusGroup] || '#64748B'}20`,
                                      }}
                                    >
                                      {STATUS_LABELS[
                                        task.status as StatusGroup
                                      ] || task.status}
                                    </span>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markDone(task.id)
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.6875rem] font-medium bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 transition-colors"
                                    >
                                      <Check size={12} />
                                      Mark Done
                                    </button>
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.6875rem] font-medium bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] transition-colors">
                                      <User size={12} />
                                      Reassign
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare
                    size={32}
                    className="text-[#1E293B] mb-3"
                  />
                  <p className="text-sm text-[#64748B]">No tasks found</p>
                  <p className="text-xs text-[#475569] mt-1">
                    {activeFilter === 'overdue'
                      ? 'No overdue tasks - great work!'
                      : 'Try a different filter'}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom: New Task */}
            <div className="px-4 py-3 border-t border-white/[0.08]">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors">
                <Plus size={16} />
                New Task
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
