'use client'

import { useState, useEffect, useMemo } from 'react'
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
  ExternalLink,
} from 'lucide-react'
import { type PanelTask, panelTasks } from './tasks-panel-data'
import { useTaskStore } from '../../lib/task-store'
import { useAuthStore } from '../../lib/auth-store'
import { useParams, useRouter, usePathname } from 'next/navigation'

type FilterTab = 'all' | 'mine' | 'overdue' | 'by_studio' | 'this_studio'
type StatusGroup = 'in_progress' | 'todo' | 'in_review'

const STATUS_ORDER: StatusGroup[] = ['in_progress', 'todo', 'in_review']

const STATUS_LABELS: Record<StatusGroup, string> = {
  in_progress: 'In Progress',
  todo: 'Todo',
  in_review: 'In Review',
}

const STATUS_COLORS: Record<StatusGroup, string> = {
  in_progress: 'var(--accent)',
  todo: 'var(--text-tertiary)',
  in_review: 'var(--color-warning)',
}

const PRIORITY_COLORS: Record<PanelTask['priority'], string> = {
  critical: 'var(--color-error)',
  high: 'var(--color-warning)',
  medium: 'var(--accent)',
  low: 'var(--text-tertiary)',
}

const STUDIO_COLORS: Record<string, string> = {
  brand: 'var(--accent)',
  workflows: 'var(--accent)',
  components: 'var(--accent)',
  testing: 'var(--accent)',
  design: 'var(--accent)',
  analytics: 'var(--accent)',
  approvals: 'var(--accent)',
  pages: 'var(--accent)',
}

const STORAGE_KEY = 'tasks-panel-open'

export function TasksPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const productId = params?.orgSlug && params?.productSlug
    ? `${params.orgSlug}-${params.productSlug}`
    : null
  const orgSlug = params?.orgSlug as string | undefined
  const productSlug = params?.productSlug as string | undefined
  const currentStudio = pathname?.split('/')[3] || ''
  // Targeted selectors — avoid subscribing to the full store object
  const storeTasks = useTaskStore((s) => s.tasks)
  const moveTask = useTaskStore((s) => s.moveTask)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const currentUserName = useAuthStore((s) => s.user?.name)

  const tasks: PanelTask[] = useMemo(() => {
    const realTasks: PanelTask[] = storeTasks
      .filter((t) => !productId || t.productId === productId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: (t.status === 'blocked' || t.status === 'cancelled') ? 'todo' as const : t.status,
        priority: t.priority,
        assignee: { name: t.assignee.name, initials: t.assignee.initials },
        dueDate: t.dueDate,
        studio: t.studio,
        feature: t.feature,
        description: t.description,
        role: t.role,
      }))
    return realTasks.length > 0 ? realTasks : panelTasks
  }, [storeTasks, productId])

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'true') setIsOpen(true)
    } catch {}
  }, [])

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
        return activeTasks.filter((t) =>
          currentUserId
            ? t.assignee.name === currentUserName
            : false
        )
      case 'overdue':
        return activeTasks.filter((t) => new Date(t.dueDate) < now)
      case 'by_studio':
        return [...activeTasks].sort((a, b) => a.studio.localeCompare(b.studio))
      case 'this_studio':
        return activeTasks.filter((t) => t.studio === currentStudio)
      default:
        return activeTasks
    }
  }, [activeTasks, activeFilter, currentStudio, currentUserId, currentUserName])

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
    moveTask(id, 'done')
    if (expandedTaskId === id) setExpandedTaskId(null)
  }

  const navigateToStudio = (studio: string) => {
    if (!orgSlug || !productSlug) return
    const studioPath = `/${orgSlug}/${productSlug}/${studio}`
    if (pathname !== studioPath) {
      router.push(studioPath)
    }
    setIsOpen(false)
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
      {/* Floating Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
          style={{ boxShadow: 'var(--shadow-panel)' }}
        >
          <CheckSquare size={13} className="text-[var(--accent)]" />
          <span className="text-[11px] font-medium">
            {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
          </span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 w-[360px] max-h-[72vh] flex flex-col tool-panel-float"
          style={{ animation: 'scaleIn 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-2">
              <CheckSquare size={14} className="text-[var(--accent)]" />
              <h2 className="text-[12px] font-semibold text-[var(--text-primary)]">Tasks</h2>
              <span className="tool-badge-accent">{activeTasks.length}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="tool-btn-ghost tool-btn-icon">
                <Filter size={12} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="tool-btn-ghost tool-btn-icon"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[var(--border-default)]">
            <div className="tool-segments">
              {(
                [
                  ['all', 'All'],
                  ['this_studio', 'This Studio'],
                  ['mine', 'Mine'],
                  ['overdue', 'Overdue'],
                  ['by_studio', 'By Studio'],
                ] as [FilterTab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`tool-segment ${activeFilter === key ? 'active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
            {STATUS_ORDER.map((status) => {
              const groupTasks = grouped[status]
              if (groupTasks.length === 0) return null
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 px-1.5 mb-1.5">
                    <div
                      className="tool-status"
                      style={{ backgroundColor: STATUS_COLORS[status] }}
                    />
                    <span className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      {STATUS_LABELS[status]}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] opacity-60">
                      {groupTasks.length}
                    </span>
                  </div>

                  <div className="space-y-px">
                    {groupTasks.map((task) => (
                      <div key={task.id}>
                        <button
                          onClick={() =>
                            setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                          }
                          className="w-full text-left px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)] transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className="tool-status mt-[5px]"
                              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-[var(--text-primary)] leading-snug truncate">
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className={`flex items-center gap-1 text-[10px] ${
                                    isOverdue(task.dueDate)
                                      ? 'text-[var(--color-error)]'
                                      : 'text-[var(--text-tertiary)]'
                                  }`}
                                >
                                  <Clock size={9} />
                                  {formatDate(task.dueDate)}
                                </span>
                                <span className="text-[9px] font-medium px-1.5 py-px rounded bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                                  {task.studio}
                                </span>
                              </div>
                            </div>
                            <div className="w-[22px] h-[22px] rounded bg-[var(--bg-overlay)] flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-medium text-[var(--text-secondary)]">
                                {task.assignee.initials}
                              </span>
                            </div>
                            {expandedTaskId === task.id ? (
                              <ChevronUp size={11} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                            ) : (
                              <ChevronDown size={11} className="text-[var(--text-tertiary)] mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </button>

                        {expandedTaskId === task.id && (
                          <div
                            className="px-2 py-2 ml-4 mt-0.5 mb-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-overlay)] space-y-2"
                            style={{ animation: 'fadeInUp 100ms ease-out' }}
                          >
                            {task.description && (
                              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                                {task.description}
                              </p>
                            )}
                            {task.feature && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[var(--text-tertiary)]">Feature:</span>
                                <span className="text-[11px] text-[var(--text-primary)]">{task.feature}</span>
                              </div>
                            )}
                            {task.role && (
                              <div className="flex items-center gap-2">
                                <User size={9} className="text-[var(--text-tertiary)]" />
                                <span className="text-[10px] text-[var(--text-tertiary)]">Role:</span>
                                <span className="text-[11px] text-[var(--text-primary)]">{task.role}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markDone(task.id)
                                }}
                                className="tool-btn text-[10px] text-[var(--color-success)]"
                              >
                                <Check size={10} />
                                Done
                              </button>
                              <button
                                className="tool-btn text-[10px]"
                                onClick={(e) => { e.stopPropagation(); alert('Reassign coming soon') }}
                                title="Reassign task"
                              >
                                <User size={10} />
                                Reassign
                              </button>
                              {task.studio && task.studio !== currentStudio && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigateToStudio(task.studio)
                                  }}
                                  className="tool-btn text-[10px] text-[var(--accent-text)]"
                                >
                                  <ExternalLink size={10} />
                                  Open {task.studio}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {filteredTasks.length === 0 && (
              <div className="tool-empty py-10">
                <CheckSquare size={20} className="text-[var(--text-tertiary)]" />
                <p className="text-[12px] text-[var(--text-secondary)]">No tasks found</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  {activeFilter === 'overdue'
                    ? 'No overdue tasks — great work!'
                    : 'Try a different filter'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-2 py-2 border-t border-[var(--border-default)]">
            <button className="tool-btn-primary w-full flex items-center justify-center gap-1.5 py-1.5">
              <Plus size={12} />
              <span className="text-[11px]">New Task</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
