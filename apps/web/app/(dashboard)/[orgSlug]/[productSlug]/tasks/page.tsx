'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Plus, LayoutGrid, List, Sparkles } from 'lucide-react'
import { type Task, mockTasks } from './_data/mock-tasks'
import { TaskBoard } from './_components/task-board'
import { TaskList } from './_components/task-list'
import { TaskFiltersBar, type TaskFilters } from './_components/task-filters'
import { TaskCreateModal } from './_components/task-create-modal'

type ViewMode = 'board' | 'list'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [view, setView] = useState<ViewMode>('board')
  const [modalOpen, setModalOpen] = useState(false)
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

  // Update a task (used by drag-and-drop)
  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    )
  }, [])

  // Create a new task
  const handleCreateTask = useCallback((data: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...data,
      id: `task-${String(Date.now()).slice(-6)}`,
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setTasks((prev) => [newTask, ...prev])
  }, [])

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
            <span className="text-[#3B82F6] text-lg font-semibold">T</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Tasks</h1>
            <p className="text-xs text-[#64748B]">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
              {filters.search || filters.statuses.length || filters.priorities.length
                ? ` (filtered from ${tasks.length})`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI suggest placeholder */}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#3B82F6] bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI: Suggest tasks
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
            <button
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'board'
                  ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'list'
                  ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          {/* New task */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <TaskFiltersBar filters={filters} onChange={setFilters} />

      {/* Content */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 min-h-0"
      >
        {view === 'board' ? (
          <TaskBoard tasks={filteredTasks} onUpdateTask={handleUpdateTask} />
        ) : (
          <TaskList tasks={filteredTasks} onUpdateTask={handleUpdateTask} />
        )}
      </motion.div>

      {/* Create modal */}
      <TaskCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateTask}
      />
    </div>
  )
}
