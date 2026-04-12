'use client'

import { motion } from 'framer-motion'
import { Search, ChevronDown } from 'lucide-react'

const categories = ['All', 'SaaS', 'Internal Tool', 'Marketing', 'Mobile', 'Design System'] as const
const sortOptions = ['Popular', 'Recent', 'Name A-Z'] as const

export type Category = (typeof categories)[number]
export type SortOption = (typeof sortOptions)[number]

interface TemplateFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  category: Category
  onCategoryChange: (value: Category) => void
  sort: SortOption
  onSortChange: (value: SortOption) => void
}

export function TemplateFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
}: TemplateFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Search and Sort Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#F1F5F9] text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/25 transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none pl-3 pr-9 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[#94A3B8] text-sm focus:outline-none focus:border-[#3B82F6]/50 cursor-pointer transition-colors"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option} className="bg-[#0C1024] text-[#F1F5F9]">
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] pointer-events-none" />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className="relative px-4 py-2.5 text-sm font-medium transition-colors"
          >
            <span className={category === cat ? 'text-[#3B82F6]' : 'text-[#64748B] hover:text-[#94A3B8]'}>
              {cat}
            </span>
            {category === cat && (
              <motion.div
                layoutId="category-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
