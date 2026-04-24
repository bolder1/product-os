'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, ChevronDown } from 'lucide-react'
import { type Task, type TaskStatus, type TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG, STATUSES, PRIORITIES } from '../_data/mock-tasks'

interface TaskCreateModalProps {
  open: boolean
  onClose: () => void
  onCreate: (task: Omit<Task, 'id' | 'createdAt'>) => void
}

function SelectField({
  label,
  value,
  options,
  config,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  config: Record<string, { label: string; color: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = config[value]

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--text-primary)] hover:border-white/[0.15] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: current.color }} />
          {current.label}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-tertiary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-white/[0.08] bg-[#0C1029] shadow-xl py-1">
          {options.map((opt) => {
            const c = config[opt]
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-white/[0.05] transition-colors ${
                  opt === value ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function TaskCreateModal({ open, onClose, onCreate }: TaskCreateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState('')

  const resetForm = useCallback(() => {
    setTitle('')
    setDescription('')
    setStatus('todo')
    setPriority('medium')
    setAssignee('')
    setDueDate('')
  }, [])

  const handleCreate = useCallback(() => {
    if (!title.trim()) return

    const names = assignee.trim() || 'Unassigned'
    const initials = names
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const COLORS = ['#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#3B82F6']
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]

    onCreate({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: { name: names, initials, color },
      dueDate: dueDate || new Date().toISOString().slice(0, 10),
    })

    resetForm()
    onClose()
  }, [title, description, status, priority, assignee, dueDate, onCreate, onClose, resetForm])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg mx-4 rounded-2xl border border-white/[0.08] bg-[#0A0F24] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">New Task</h2>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this task..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors resize-none"
                />
              </div>

              {/* Status & Priority row */}
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="Status"
                  value={status}
                  options={STATUSES}
                  config={STATUS_CONFIG}
                  onChange={(v) => setStatus(v as TaskStatus)}
                />
                <SelectField
                  label="Priority"
                  value={priority}
                  options={PRIORITIES}
                  config={PRIORITY_CONFIG}
                  onChange={(v) => setPriority(v as TaskPriority)}
                />
              </div>

              {/* Assignee & Due date row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Assignee</label>
                  <input
                    type="text"
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    placeholder="Name"
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              {/* AI placeholder */}
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI: Auto-assign
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!title.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Create Task
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
