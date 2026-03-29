'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileOutput, Sparkles, Filter } from 'lucide-react'
import { mockHandoffs, type HandoffItem } from './_data/mock-handoffs'
import { HandoffCard } from './_components/handoff-card'
import { SpecDetail } from './_components/spec-detail'

type FilterType = 'all' | 'component' | 'page' | 'token'

export default function DevHandoffPage() {
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    if (filter === 'all') return mockHandoffs
    return mockHandoffs.filter((item) => item.type === filter)
  }, [filter])

  const selectedItem = useMemo(
    () => mockHandoffs.find((item) => item.id === selectedId) ?? null,
    [selectedId]
  )

  const avgCompleteness = useMemo(() => {
    if (filteredItems.length === 0) return 0
    return Math.round(
      filteredItems.reduce((sum, item) => sum + item.completeness, 0) / filteredItems.length
    )
  }, [filteredItems])

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'component', label: 'Components' },
    { key: 'page', label: 'Pages' },
    { key: 'token', label: 'Tokens' },
  ]

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <FileOutput className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Dev Handoff</h1>
            <p className="text-xs text-[#64748B]">
              {filteredItems.length} items / {avgCompleteness}% avg completeness
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            Generate Specs
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-[#64748B]" />
        <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#64748B] ml-2">
          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid */}
      <motion.div
        key={filter}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item, i) => (
            <HandoffCard
              key={item.id}
              item={item}
              index={i}
              onViewSpec={setSelectedId}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-[#64748B]">No items match this filter</p>
          </div>
        )}
      </motion.div>

      {/* Spec detail modal */}
      {selectedItem && (
        <SpecDetail item={selectedItem} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
