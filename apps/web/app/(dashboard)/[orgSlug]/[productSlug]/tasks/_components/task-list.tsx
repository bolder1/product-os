'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown, Calendar, Link2, Check } from 'lucide-react'
import { type Task, STATUS_CONFIG, PRIORITY_CONFIG } from '../_data/mock-tasks'

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'assignee'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER = { todo: 0, in_progress: 1, in_review: 2, done: 3 }

interface TaskListProps {
  tasks: Task[]
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
}

export function TaskList({ tasks, onUpdateTask }: TaskListProps) {
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }, [sortField])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.id)))
    }
  }, [selectedIds.size, tasks])

  const sorted = [...tasks].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1
    switch (sortField) {
      case 'title':
        return mul * a.title.localeCompare(b.title)
      case 'status':
        return mul * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      case 'priority':
        return mul * (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
      case 'dueDate':
        return mul * (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      case 'assignee':
        return mul * a.assignee.name.localeCompare(b.assignee.name)
      default:
        return 0
    }
  })

  const SortHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#94A3B8] transition-colors ${className}`}
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-[#3B82F6]' : ''}`} />
    </button>
  )

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[40px_1fr_120px_100px_140px_100px_140px] gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
        <div className="flex items-center justify-center">
          <button
            onClick={toggleAll}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              selectedIds.size === tasks.length && tasks.length > 0
                ? 'bg-[#3B82F6] border-[#3B82F6]'
                : 'border-white/[0.2] hover:border-white/[0.4]'
            }`}
          >
            {selectedIds.size === tasks.length && tasks.length > 0 && (
              <Check className="w-3 h-3 text-white" />
            )}
          </button>
        </div>
        <SortHeader field="title" label="Task" />
        <SortHeader field="status" label="Status" />
        <SortHeader field="priority" label="Priority" />
        <SortHeader field="assignee" label="Assignee" />
        <SortHeader field="dueDate" label="Due Date" />
        <div className="text-xs font-medium text-[#64748B]">Linked</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.04]">
        {sorted.map((task, idx) => {
          const status = STATUS_CONFIG[task.status]
          const priority = PRIORITY_CONFIG[task.priority]
          const isSelected = selectedIds.has(task.id)

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.25 }}
              className={`grid grid-cols-[40px_1fr_120px_100px_140px_100px_140px] gap-2 px-4 py-3 transition-colors hover:bg-white/[0.03] ${
                isSelected ? 'bg-[#3B82F6]/[0.05]' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => toggleSelect(task.id)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-[#3B82F6] border-[#3B82F6]'
                      : 'border-white/[0.2] hover:border-white/[0.4]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              </div>

              {/* Title */}
              <div className="flex items-center min-w-0">
                <span className="text-sm text-[#F1F5F9] truncate">{task.title}</span>
              </div>

              {/* Status badge */}
              <div className="flex items-center">
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{
                    color: status.color,
                    backgroundColor: `${status.color}15`,
                  }}
                >
                  {status.label}
                </span>
              </div>

              {/* Priority badge */}
              <div className="flex items-center">
                <span
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{
                    color: priority.color,
                    backgroundColor: `${priority.color}15`,
                  }}
                >
                  {priority.label}
                </span>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white shrink-0"
                  style={{ backgroundColor: task.assignee.color }}
                >
                  {task.assignee.initials}
                </div>
                <span className="text-xs text-[#94A3B8] truncate">{task.assignee.name}</span>
              </div>

              {/* Due date */}
              <div className="flex items-center gap-1 text-xs text-[#64748B]">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Linked node */}
              <div className="flex items-center">
                {task.linkedNode ? (
                  <div className="flex items-center gap-1.5">
                    <Link2 className="w-3 h-3 text-[#64748B]" />
                    <span className="text-[11px] text-[#64748B] bg-white/[0.05] px-1.5 py-0.5 rounded truncate">
                      {task.linkedNode.kind}: {task.linkedNode.label}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#64748B]/40">--</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="flex items-center justify-center py-16 text-sm text-[#64748B]">
          No tasks match the current filters
        </div>
      )}
    </div>
  )
}
