'use client'

import { motion } from 'framer-motion'
import type { NotificationType } from '../_data/mock-notifications'

export type FilterKey = 'all' | 'unread' | NotificationType

interface NotificationFiltersProps {
  active: FilterKey
  onChange: (key: FilterKey) => void
  counts: Record<FilterKey, number>
}

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'mention', label: 'Mentions' },
  { key: 'task', label: 'Tasks' },
  { key: 'approval', label: 'Approvals' },
]

export function NotificationFilters({ active, onChange, counts }: NotificationFiltersProps) {
  return (
    <div className="flex items-center gap-1 border-b border-white/[0.06] -mx-1 px-1">
      {filters.map((filter) => {
        const isActive = active === filter.key
        const count = counts[filter.key] ?? 0
        return (
          <button
            key={filter.key}
            onClick={() => onChange(filter.key)}
            className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
              isActive ? 'text-[#94A3B8]' : 'text-[#64748B] hover:text-[#94A3B8]'
            }`}
          >
            {filter.label}
            {count > 0 && (
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/[0.08] text-[#F1F5F9]'
                    : 'bg-white/[0.04] text-[#64748B]'
                }`}
              >
                {count}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="notification-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#94A3B8] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
