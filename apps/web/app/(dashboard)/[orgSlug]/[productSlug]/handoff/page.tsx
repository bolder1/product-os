'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  FileOutput,
  Component,
  Layout,
  Palette,
  Layers,
  Sparkles,
  ArrowRight,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
} from 'lucide-react'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { ContextBanner } from '../../../../components/shared/upstream-empty-state'
import {
  mockHandoffs,
  type HandoffItem as MockItem,
  type DesignToken as MockToken,
} from './_data/mock-handoffs'
import { SpecDetail } from './_components/spec-detail'
import { useProduct } from '../layout'
import { useHandoffStore, type HandoffItem as StoreItem } from '../../../../lib/handoff-store'
import { useGraphStore } from '../../../../lib/graph-store'

// ──────────────────────────────────────────────────────────────────────────────
// Types & adapters
// ──────────────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | MockItem['type']

function toMockTokenType(t: StoreItem['tokens'][number]['type']): MockToken['type'] {
  if (t === 'shadow' || t === 'opacity') return 'color'
  return t as MockToken['type']
}

function toMockItem(s: StoreItem): MockItem {
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

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  component: { label: 'Component', color: '#3B82F6', icon: <Component className="w-3 h-3" /> },
  page: { label: 'Page', color: '#8B5CF6', icon: <Layout className="w-3 h-3" /> },
  token: { label: 'Token', color: '#F59E0B', icon: <Palette className="w-3 h-3" /> },
}

function statusColor(completeness: number) {
  if (completeness >= 90) return 'var(--color-success)'
  if (completeness >= 70) return 'var(--color-warning)'
  return '#F43F5E'
}

// ──────────────────────────────────────────────────────────────────────────────
// Left panel — item row
// ──────────────────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  selected,
  onClick,
}: {
  item: MockItem
  selected: boolean
  onClick: () => void
}) {
  const tInfo = typeConfig[item.type] ?? typeConfig.component
  const done = item.criteria.filter((c) => c.done).length
  const total = item.criteria.length

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left group ${
        selected
          ? 'bg-[var(--accent-bg,rgba(99,102,241,0.15))] border border-[var(--accent-text)]/20'
          : 'hover:bg-white/[0.04] border border-transparent'
      }`}
    >
      {/* type icon */}
      <span style={{ color: tInfo.color }} className="flex-shrink-0">
        {tInfo.icon}
      </span>

      {/* name */}
      <span
        className={`flex-1 text-[12px] font-medium truncate ${
          selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
        }`}
      >
        {item.name}
      </span>

      {/* completeness badge */}
      <span
        className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
        style={{
          color: statusColor(item.completeness),
          backgroundColor: `${statusColor(item.completeness)}15`,
        }}
      >
        {item.completeness}%
      </span>

      {/* status dot */}
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: done === total && total > 0 ? 'var(--color-success)' : statusColor(item.completeness) }}
      />
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Center panel — visual preview
// ──────────────────────────────────────────────────────────────────────────────

const INTERACTION_STATES = ['Normal', 'Hover', 'Active', 'Disabled']
const STATE_OPACITIES = [1, 0.8, 0.6, 0.3]

const RESPONSIVE_VARIANTS = [
  { label: 'Mobile', icon: Smartphone },
  { label: 'Tablet', icon: Tablet },
  { label: 'Desktop', icon: Monitor },
]

function VisualPreview({ item }: { item: MockItem | null }) {
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-tertiary)]">
        <Layers className="w-10 h-10 opacity-20" />
        <p className="text-[13px]">Select an item to inspect</p>
      </div>
    )
  }

  const tInfo = typeConfig[item.type] ?? typeConfig.component
  const allCriteriaDone = item.criteria.length > 0 && item.criteria.every((c) => c.done)

  return (
    <div className="flex flex-col h-full overflow-auto p-4 gap-5">
      {/* Main preview block */}
      <div
        className="rounded-xl flex items-center justify-center border border-white/[0.08] relative overflow-hidden"
        style={{ height: 140, backgroundColor: `${item.previewColor}08` }}
      >
        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(var(--border-default) 1px, transparent 1px), linear-gradient(90deg, var(--border-default) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        <div
          className="relative px-8 py-4 rounded-xl border-2 border-dashed"
          style={{ borderColor: `${item.previewColor}40`, backgroundColor: `${item.previewColor}15` }}
        >
          <span className="text-sm font-semibold" style={{ color: item.previewColor }}>
            {item.name}
          </span>
          <span
            className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ color: tInfo.color, backgroundColor: `${tInfo.color}20` }}
          >
            {tInfo.label}
          </span>
        </div>
        {allCriteriaDone && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 rounded-full px-1.5 py-0.5">
            <CheckCircle2 className="w-3 h-3 text-[var(--color-success)]" />
            <span className="text-[9px] text-[var(--color-success)]">Ready</span>
          </div>
        )}
      </div>

      {/* Interaction states */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium mb-2">
          Interaction states
        </p>
        <div className="flex gap-2">
          {INTERACTION_STATES.map((state, i) => (
            <div key={state} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full h-7 rounded-lg border border-dashed flex items-center justify-center"
                style={{
                  borderColor: `${item.previewColor}${Math.round(STATE_OPACITIES[i] * 64).toString(16).padStart(2, '0')}`,
                  backgroundColor: `${item.previewColor}${Math.round(STATE_OPACITIES[i] * 24).toString(16).padStart(2, '0')}`,
                  opacity: STATE_OPACITIES[i],
                }}
              />
              <span className="text-[9px] text-[var(--text-tertiary)]">{state}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive variants */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium mb-2">
          Responsive variants
        </p>
        <div className="flex gap-2">
          {RESPONSIVE_VARIANTS.map(({ label, icon: Icon }) => (
            <div key={label} className="flex-1 flex flex-col gap-1.5">
              <div
                className="rounded-lg border border-[var(--border-subtle)] flex flex-col items-center justify-center gap-1"
                style={{ height: 60, backgroundColor: `${item.previewColor}06` }}
              >
                <Icon className="w-4 h-4" style={{ color: item.previewColor, opacity: 0.6 }} />
                <div
                  className="rounded"
                  style={{
                    width: label === 'Mobile' ? 24 : label === 'Tablet' ? 32 : 40,
                    height: 6,
                    backgroundColor: `${item.previewColor}40`,
                  }}
                />
              </div>
              <span className="text-[9px] text-[var(--text-tertiary)] text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prototype flow (placeholder) */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium mb-2">
          Prototype flow
        </p>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-subtle)]">
          <div
            className="text-[11px] font-medium px-2 py-1 rounded"
            style={{ backgroundColor: `${item.previewColor}20`, color: item.previewColor }}
          >
            {item.name}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
          <div className="text-[11px] font-medium px-2 py-1 rounded bg-[var(--bg-surface)] text-[var(--text-secondary)]">
            {item.type === 'page' ? 'Dashboard' : 'Parent Screen'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────

export default function DevHandoffPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  // Store items
  const storeItems = useHandoffStore((s) => s.items)
  const productItems = useMemo(
    () => storeItems.filter((i) => i.productId === productId),
    [storeItems, productId],
  )

  // Graph nodes (component + screen kinds)
  const allNodes = useGraphStore((s) => s.nodes)
  const graphItems = useMemo<MockItem[]>(() => {
    return allNodes
      .filter((n) => n.productId === productId && (n.kind === 'component' || n.kind === 'screen'))
      .map((n) => ({
        id: n.id,
        name: n.label,
        type: n.kind === 'screen' ? 'page' : 'component',
        completeness: 50,
        previewColor: '#6366f1',
        specs: [],
        tokens: [],
        criteria: [],
      }))
  }, [allNodes, productId])

  const isLive = productItems.length > 0
  const baseItems: MockItem[] = isLive ? productItems.map(toMockItem) : mockHandoffs

  // Merge with any graph nodes not already in store
  const storeIds = new Set(baseItems.map((i) => i.id))
  const extraGraphItems = graphItems.filter((i) => !storeIds.has(i.id))
  const items: MockItem[] = [...baseItems, ...extraGraphItems]

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items
    return items.filter((item) => item.type === activeTab)
  }, [items, activeTab])

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  )

  const avgCompleteness = useMemo(() => {
    if (filteredItems.length === 0) return 0
    return Math.round(filteredItems.reduce((s, i) => s + i.completeness, 0) / filteredItems.length)
  }, [filteredItems])

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: items.length },
    { key: 'component', label: 'Components', count: items.filter((i) => i.type === 'component').length },
    { key: 'page', label: 'Pages', count: items.filter((i) => i.type === 'page').length },
    { key: 'token', label: 'Tokens', count: items.filter((i) => i.type === 'token').length },
  ]

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)] overflow-hidden">
      <ContextBanner
        chips={[
          { label: 'Design Screens', source: 'design' },
          { label: 'Components', source: 'components' },
          { label: 'Brand Tokens', source: 'brand' },
        ]}
        missing={[]}
      />
      {/* ── Toolbar ── */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <FileOutput className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Dev Handoff</span>
          <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
            {filteredItems.length} items · {avgCompleteness}% avg
          </span>
          {isLive ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg,rgba(99,102,241,0.15))] text-[var(--accent-text)]">
              live
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
              sample
            </span>
          )}
        </div>
        <AIActionBar workspace="engineer" productId={productId} compact />
      </div>

      {/* ── Split pane body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left panel: item list (260px) ── */}
        <div className="w-[260px] flex-shrink-0 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)]">
          {/* Tab bar */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border-default)] shrink-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeTab === t.key
                    ? 'bg-[var(--accent-bg,rgba(99,102,241,0.15))] text-[var(--accent-text)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04]'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-1 text-[9px] opacity-60">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Generate All button */}
          <div className="px-2 py-1.5 border-b border-[var(--border-subtle)] shrink-0">
            <button className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 border border-[var(--accent)]/20 transition-colors">
              <Sparkles className="w-3 h-3" />
              Generate All
            </button>
          </div>

          {/* Item list */}
          <div className="flex-1 overflow-auto px-2 py-2 space-y-0.5">
            {filteredItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
              />
            ))}
            {filteredItems.length === 0 && (
              <p className="text-[11px] text-[var(--text-tertiary)] px-2 py-4">No items match</p>
            )}
          </div>
        </div>

        {/* ── Center panel: visual preview ── */}
        <div className="flex-1 min-w-0 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-workspace)] overflow-hidden">
          <VisualPreview item={selectedItem} />
        </div>

        {/* ── Right panel: inspect (320px) ── */}
        <div className="w-[320px] flex-shrink-0 flex flex-col bg-[var(--bg-surface)] overflow-hidden">
          {selectedItem ? (
            <SpecDetail item={selectedItem} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-tertiary)] px-4 text-center">
              <FileOutput className="w-8 h-8 opacity-20" />
              <p className="text-[12px]">Select an item to see the inspect panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
