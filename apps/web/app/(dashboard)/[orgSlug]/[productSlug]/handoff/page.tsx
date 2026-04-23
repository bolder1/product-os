'use client'

import { useState, useMemo } from 'react'
import { FileOutput, Sparkles, Filter } from 'lucide-react'
import { mockHandoffs } from './_data/mock-handoffs'
import { ContextBanner } from '../../../../components/shared/upstream-empty-state'
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
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      <ContextBanner
        chips={[
          { label: 'Design Screens', source: 'design', color: '#3B82F6' },
          { label: 'Components', source: 'components', color: '#6366F1' },
          { label: 'Brand Tokens', source: 'brand', color: '#EC4899' },
        ]}
        missing={[]}
      />
      {/* Toolbar */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <FileOutput className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Dev Handoff</span>
          <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
            {filteredItems.length} items / {avgCompleteness}% avg
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button className="tool-btn-primary flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            <span className="text-[11px]">Generate Specs</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="h-9 flex items-center gap-2 px-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <Filter className="w-3 h-3 text-[var(--text-tertiary)]" />
        <div className="tool-tabs flex items-center">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`tool-tab px-2.5 py-1 text-[11px] ${
                filter === f.key ? 'active' : ''
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-[var(--text-tertiary)] ml-auto">
          {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content — dense card list */}
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
            <p className="text-[12px] text-[var(--text-tertiary)]">No items match this filter</p>
          </div>
        )}
      </div>

      {/* Spec detail modal */}
      {selectedItem && (
        <SpecDetail item={selectedItem} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
