'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Plus, LayoutGrid, List, Sparkles, Filter, GanttChart } from 'lucide-react'
import { useProduct } from '../layout'
import { type Task, mockTasks } from './_data/mock-tasks'
import { TaskBoard } from './_components/task-board'
import { TaskList } from './_components/task-list'
import { TaskTimeline } from './_components/task-timeline'
import { TaskFiltersBar, type TaskFilters } from './_components/task-filters'
import { TaskCreateModal } from './_components/task-create-modal'
import { useTaskStore } from '../../../../lib/task-store'
import { useActivityStore } from '../../../../lib/activity-store'

type ViewMode = 'board' | 'list' | 'timeline'

/** Convert a Zustand store task to the local Task format used by board/list components */
function storeTaskToLocal(t: ReturnType<typeof useTaskStore.getState>['tasks'][number]): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    status: t.status === 'blocked' ? 'todo' : t.status,
    priority: t.priority,
    assignee: { name: t.assignee.name, initials: t.assignee.initials, color: '#6366F1' },
    dueDate: t.dueDate,
    linkedNode: t.feature ? { kind: 'Feature', label: t.feature } : undefined,
    createdAt: t.createdAt.slice(0, 10),
  }
}

export default function TasksPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  // Read tasks from Zustand store for this product
  const rawTasks = useTaskStore((s) => s.tasks)
  const storeTasks = useMemo(() => rawTasks.filter((t) => t.productId === productId), [rawTasks, productId])
  const storeAddTask = useTaskStore((s) => s.addTask)
  const storeMoveTask = useTaskStore((s) => s.moveTask)
  const storeUpdateTask = useTaskStore((s) => s.updateTask)
  const addActivity = useActivityStore((s) => s.addActivity)

  // Merge store tasks with mock fallback — store tasks take priority
  const allTasks = useMemo(() => {
    const converted = storeTasks.map(storeTaskToLocal)
    if (converted.length > 0) return converted
    return mockTasks // Fallback to mock data when no store tasks exist
  }, [storeTasks])

  const [localUpdates, setLocalUpdates] = useState<Record<string, Partial<Task>>>({})
  const tasks = useMemo(() => {
    return allTasks.map((t) => (localUpdates[t.id] ? { ...t, ...localUpdates[t.id] } : t))
  }, [allTasks, localUpdates])
  const [view, setView] = useState<ViewMode>('board')
  const [modalOpen, setModalOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    statuses: [],
    priorities: [],
  })

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const matchesSearch =
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          task.assignee.name.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }
      if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
        return false
      }
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
        return false
      }
      return true
    })
  }, [tasks, filters])

  const hasActiveFilters = filters.search || filters.statuses.length > 0 || filters.priorities.length > 0

  // Update a task (used by drag-and-drop)
  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    // Sync status changes to store
    if (updates.status) {
      const storeStatus = updates.status === 'blocked' ? 'todo' : updates.status
      storeMoveTask(taskId, storeStatus as any)
    }
    if (Object.keys(updates).some((k) => k !== 'status')) {
      storeUpdateTask(taskId, updates as any)
    }
    setLocalUpdates((prev) => ({ ...prev, [taskId]: { ...prev[taskId], ...updates } }))
  }, [storeMoveTask, storeUpdateTask])

  // Create a new task
  const handleCreateTask = useCallback((data: Omit<Task, 'id' | 'createdAt'>) => {
    const created = storeAddTask({
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignee: { id: 'user-1', name: data.assignee.name, initials: data.assignee.initials, role: 'member' },
      dueDate: data.dueDate,
      studio: 'tasks',
      productId,
    })
    addActivity({
      type: 'task_created',
      title: `Created task: ${data.title}`,
      description: `New ${data.priority} priority task`,
      studio: 'tasks',
      productId,
      userId: 'user-1',
      userName: 'You',
    })
  }, [storeAddTask, addActivity, productId])

  return (
    <div className="flex flex-col h-full">
      {/* ── Top toolbar ── */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between bg-[var(--bg-surface)] border-b border-[var(--border-default)] px-2">
        {/* Left: title + count */}
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Tasks</span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-medium tabular-nums">
            {filteredTasks.length}
            {hasActiveFilters ? ` / ${tasks.length}` : ''}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {/* AI suggest */}
          <button className="tool-btn text-[11px] text-[var(--accent-text)] border-transparent bg-transparent hover:bg-[var(--accent)]/10">
            <Sparkles className="w-3 h-3" />
            <span>AI Suggest</span>
          </button>

          {/* Filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`tool-btn text-[11px] ${
              hasActiveFilters
                ? 'text-[var(--accent-text)] border-[var(--accent)]/30'
                : 'border-transparent bg-transparent'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Filter</span>
          </button>

          {/* View toggle */}
          <div className="flex items-center border border-[var(--border-default)] rounded-[var(--radius-sm)] bg-[var(--bg-workspace)]">
            {([
              { id: 'board' as const, icon: LayoutGrid, label: 'Board' },
              { id: 'list' as const, icon: List, label: 'List' },
              { id: 'timeline' as const, icon: GanttChart, label: 'Timeline' },
            ]).map((v) => {
              const Icon = v.icon
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${
                    view === v.id
                      ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {v.label}
                </button>
              )
            })}
          </div>

          {/* New task */}
          <button
            onClick={() => setModalOpen(true)}
            className="tool-btn tool-btn-primary text-[11px]"
          >
            <Plus className="w-3 h-3" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* ── Filters bar (collapsible) ── */}
      {filtersOpen && (
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
          <TaskFiltersBar filters={filters} onChange={setFilters} />
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 min-h-0 bg-[var(--bg-workspace)]">
        {view === 'board' && (
          <TaskBoard tasks={filteredTasks} onUpdateTask={handleUpdateTask} />
        )}
        {view === 'list' && (
          <TaskList tasks={filteredTasks} onUpdateTask={handleUpdateTask} />
        )}
        {view === 'timeline' && (
          <TaskTimeline tasks={filteredTasks} onUpdateTask={handleUpdateTask} />
        )}
      </div>

      {/* Create modal */}
      <TaskCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTask}
      />
    </div>
  )
}
