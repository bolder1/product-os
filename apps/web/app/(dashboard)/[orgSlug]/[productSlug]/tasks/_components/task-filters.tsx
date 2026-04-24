'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, ChevronDown, Check } from 'lucide-react'
import { type TaskStatus, type TaskPriority, STATUS_CONFIG, PRIORITY_CONFIG, STATUSES, PRIORITIES } from '../_data/mock-tasks'

export interface TaskFilters {
  search: string
  statuses: TaskStatus[]
  priorities: TaskPriority[]
}

interface TaskFiltersBarProps {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

function MultiSelect<T extends string>({
  label,
  options,
  selected,
  config,
  onToggle,
}: {
  label: string
  options: T[]
  selected: T[]
  config: Record<T, { label: string; color: string }>
  onToggle: (value: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-[var(--text-secondary)] hover:border-white/[0.15] hover:bg-white/[0.05] transition-colors"
      >
        {label}
        {selected.length > 0 && (
          <span className="bg-[var(--accent)]/20 text-[var(--accent)] text-[10px] font-medium px-1.5 py-0.5 rounded-full">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-48 rounded-xl border border-white/[0.08] bg-[#0C1029] shadow-xl py-1">
          {options.map((opt) => {
            const c = config[opt]
            const checked = selected.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-white/[0.05] transition-colors"
              >
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-white/[0.2]'
                  }`}
                >
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-[var(--text-primary)]">{c.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function TaskFiltersBar({ filters, onChange }: TaskFiltersBarProps) {
  const hasFilters = filters.search || filters.statuses.length > 0 || filters.priorities.length > 0

  const toggleStatus = useCallback((status: TaskStatus) => {
    const next = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status]
    onChange({ ...filters, statuses: next })
  }, [filters, onChange])

  const togglePriority = useCallback((priority: TaskPriority) => {
    const next = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority]
    onChange({ ...filters, priorities: next })
  }, [filters, onChange])

  const clearFilters = useCallback(() => {
    onChange({ search: '', statuses: [], priorities: [] })
  }, [onChange])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search tasks..."
          className="w-56 pl-9 pr-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors"
        />
      </div>

      {/* Status multi-select */}
      <MultiSelect
        label="Status"
        options={STATUSES}
        selected={filters.statuses}
        config={STATUS_CONFIG}
        onToggle={toggleStatus}
      />

      {/* Priority multi-select */}
      <MultiSelect
        label="Priority"
        options={PRIORITIES}
        selected={filters.priorities}
        config={PRIORITY_CONFIG}
        onToggle={togglePriority}
      />

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  )
}
