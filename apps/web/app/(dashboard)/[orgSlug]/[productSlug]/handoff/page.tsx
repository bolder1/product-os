'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { FileOutput, Filter } from 'lucide-react'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import {
  mockHandoffs,
  type HandoffItem as MockItem,
  type DesignToken as MockToken,
} from './_data/mock-handoffs'
import { HandoffCard } from './_components/handoff-card'
import { SpecDetail } from './_components/spec-detail'
import { useProduct } from '../layout'
import { useHandoffStore, type HandoffItem as StoreItem } from '../../../../lib/handoff-store'

type FilterType = 'all' | MockItem['type']

/** Fold shadow/opacity store tokens into the closest mock equivalent. */
function toMockTokenType(t: StoreItem['tokens'][number]['type']): MockToken['type'] {
  if (t === 'shadow' || t === 'opacity') return 'color'
  return t
}

function toMockItem(s: StoreItem): MockItem {
  // The mock UI understands component / page / token; collapse 'pattern' onto component for display.
  const uiType: MockItem['type'] = s.type === 'pattern' ? 'component' : s.type
  return {
    id: s.id,
    name: s.label,
    type: uiType,
    completeness: s.completeness,
    previewColor: s.previewColor,
    specs: s.specs,
    tokens: s.tokens.map((t) => ({
      name: t.name,
      value: t.value,
      type: toMockTokenType(t.type),
    })),
    criteria: s.criteria,
  }
}

export default function DevHandoffPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const storeItems = useHandoffStore((s) => s.items)
  const productItems = useMemo(
    () => storeItems.filter((i) => i.productId === productId),
    [storeItems, productId],
  )
  const isLive = productItems.length > 0
  const items: MockItem[] = isLive ? productItems.map(toMockItem) : mockHandoffs

  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((item) => item.type === filter)
  }, [items, filter])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const avgCompleteness = useMemo(() => {
    if (filteredItems.length === 0) return 0
    return Math.round(
      filteredItems.reduce((sum, item) => sum + item.completeness, 0) / filteredItems.length,
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
      {/* Toolbar */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <FileOutput className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Dev Handoff</span>
          <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
            {filteredItems.length} items / {avgCompleteness}% avg
          </span>
          {isLive ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)]">
              live
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
              sample
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AIActionBar workspace="engineer" productId={productId} compact />
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
