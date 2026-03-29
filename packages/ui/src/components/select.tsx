'use client'

import * as React from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../lib/utils'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  icon?: React.ReactNode
  searchable?: boolean
  disabled?: boolean
  label?: string
  error?: string
  className?: string
}

function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  icon,
  searchable = false,
  disabled = false,
  label,
  error,
  className,
}: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = React.useMemo(() => {
    if (!search) return options
    const lower = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(lower))
  }, [options, search])

  React.useEffect(() => {
    if (open && searchable) {
      setTimeout(() => searchRef.current?.focus(), 50)
    }
    if (!open) setSearch('')
  }, [open, searchable])

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-[#94A3B8]">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm transition-colors duration-200',
          'hover:border-white/[0.12]',
          'focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-rose-500/50',
          open && 'border-indigo-500/50 ring-2 ring-indigo-500/20'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {icon && <span className="text-[#64748B] shrink-0">{icon}</span>}
          {selected?.icon}
          <span className={selected ? 'text-[#F1F5F9]' : 'text-[#64748B]'}>
            {selected?.label || placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative z-50"
          >
            <div className="absolute top-1 left-0 w-full rounded-lg border border-white/[0.08] bg-[#0C1024] backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden">
              {searchable && (
                <div className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-2">
                  <Search className="h-4 w-4 text-[#64748B]" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="flex-1 bg-transparent text-sm text-[#F1F5F9] placeholder:text-[#64748B] outline-none"
                  />
                </div>
              )}
              <div className="max-h-60 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-[#64748B]">
                    No results found
                  </div>
                ) : (
                  filtered.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => {
                        onChange?.(option.value)
                        setOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                        'hover:bg-white/[0.05]',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        option.value === value
                          ? 'text-indigo-400 bg-indigo-500/10'
                          : 'text-[#F1F5F9]'
                      )}
                    >
                      {option.icon}
                      <span className="flex-1 text-left truncate">{option.label}</span>
                      {option.value === value && (
                        <Check className="h-4 w-4 shrink-0 text-indigo-400" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

export { Select }
