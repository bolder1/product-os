'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { type Task, type TaskStatus, STATUS_CONFIG, STATUSES } from '../_data/mock-tasks'
import { TaskCard } from './task-card'

interface TaskBoardProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
}

export function TaskBoard({ tasks, onUpdateTask }: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedTaskId(taskId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      onUpdateTask(taskId, { status })
    }
    setDraggedTaskId(null)
    setDragOverColumn(null)
  }, [onUpdateTask])

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null)
    setDragOverColumn(null)
  }, [])

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-4 h-full"
      role="region"
      aria-label="Task board"
    >
      {STATUSES.map((status) => {
        const config = STATUS_CONFIG[status]
        const columnTasks = tasks.filter((t) => t.status === status)
        const isOver = dragOverColumn === status

        return (
          <div
            key={status}
            className="min-w-[280px] w-[280px] flex-shrink-0 flex flex-col"
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
            role="group"
            aria-label={`${config.label} column, ${columnTasks.length} task${columnTasks.length !== 1 ? 's' : ''}`}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: config.dotColor }}
                aria-hidden="true"
              />
              <h3 className="text-sm font-medium text-[#F1F5F9]" id={`col-${status}`}>
                {config.label}
              </h3>
              <span
                className="text-xs text-[#64748B] bg-white/[0.05] px-2 py-0.5 rounded-full ml-auto"
                aria-label={`${columnTasks.length} tasks`}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Drop zone */}
            <div
              className={`flex-1 rounded-xl p-2 space-y-2 overflow-y-auto transition-all duration-200 ${
                isOver
                  ? 'border-2 border-dashed border-[#3B82F6]/50 bg-[#3B82F6]/[0.04]'
                  : 'border-2 border-transparent'
              }`}
              onDragEnd={handleDragEnd}
              role="list"
              aria-labelledby={`col-${status}`}
              aria-dropeffect={isOver ? 'move' : 'none'}
            >
              <AnimatePresence mode="popLayout">
                {columnTasks.map((task, idx) => (
                  <div
                    key={task.id}
                    role="listitem"
                    className={`transition-opacity duration-150 ${
                      draggedTaskId === task.id ? 'opacity-50' : 'opacity-100'
                    }`}
                    aria-grabbed={draggedTaskId === task.id}
                  >
                    <TaskCard
                      task={task}
                      index={idx}
                      onDragStart={handleDragStart}
                    />
                  </div>
                ))}
              </AnimatePresence>

              {columnTasks.length === 0 && !isOver && (
                <div
                  className="flex items-center justify-center h-24 text-xs text-[#64748B] border border-dashed border-white/[0.06] rounded-lg"
                  aria-label="No tasks in this column"
                >
                  No tasks
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
