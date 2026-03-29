'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked'
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee: { id: string; name: string; initials: string; role: string }
  dueDate: string
  studio: string
  feature?: string
  productId: string
  role?: string
  dependencies?: string[]
  tags?: string[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  studio?: string[]
  assigneeId?: string
  productId?: string
  search?: string
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface TaskState {
  tasks: Task[]
  filter: TaskFilter

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus) => void
  bulkAddTasks: (tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[]) => Task[]
  setFilter: (filter: TaskFilter) => void
  getTasksByProduct: (productId: string) => Task[]
  getTasksByStudio: (productId: string, studio: string) => Task[]
  getTasksByAssignee: (assigneeId: string) => Task[]
  getOverdueTasks: (productId: string) => Task[]
  getTaskStats: (productId: string) => {
    total: number
    todo: number
    inProgress: number
    inReview: number
    done: number
    blocked: number
    overdue: number
  }
}

let taskCounter = 0

function generateId(): string {
  taskCounter += 1
  return `task-${Date.now()}-${taskCounter}`
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      filter: {},

      addTask: (taskData) => {
        const now = new Date().toISOString()
        const task: Task = {
          ...taskData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
        return task
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }))
      },

      moveTask: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  updatedAt: new Date().toISOString(),
                  completedAt: status === 'done' ? new Date().toISOString() : t.completedAt,
                }
              : t
          ),
        }))
      },

      bulkAddTasks: (tasksData) => {
        const now = new Date().toISOString()
        const newTasks = tasksData.map((td) => ({
          ...td,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        }))
        set((state) => ({ tasks: [...state.tasks, ...newTasks] }))
        return newTasks
      },

      setFilter: (filter) => set({ filter }),

      getTasksByProduct: (productId) =>
        get().tasks.filter((t) => t.productId === productId),

      getTasksByStudio: (productId, studio) =>
        get().tasks.filter((t) => t.productId === productId && t.studio === studio),

      getTasksByAssignee: (assigneeId) =>
        get().tasks.filter((t) => t.assignee.id === assigneeId),

      getOverdueTasks: (productId) => {
        const now = new Date()
        return get().tasks.filter(
          (t) =>
            t.productId === productId &&
            t.status !== 'done' &&
            new Date(t.dueDate) < now
        )
      },

      getTaskStats: (productId) => {
        const tasks = get().tasks.filter((t) => t.productId === productId)
        const now = new Date()
        return {
          total: tasks.length,
          todo: tasks.filter((t) => t.status === 'todo').length,
          inProgress: tasks.filter((t) => t.status === 'in_progress').length,
          inReview: tasks.filter((t) => t.status === 'in_review').length,
          done: tasks.filter((t) => t.status === 'done').length,
          blocked: tasks.filter((t) => t.status === 'blocked').length,
          overdue: tasks.filter(
            (t) => t.status !== 'done' && new Date(t.dueDate) < now
          ).length,
        }
      },
    }),
    {
      name: 'product-os-tasks',
    }
  )
)
