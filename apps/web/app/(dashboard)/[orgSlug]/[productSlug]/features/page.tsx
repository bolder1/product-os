'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Search,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Trash2,
  ExternalLink,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { trpc } from '../../../../lib/trpc'
import { useProduct } from '../layout'

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type Status = 'Planned' | 'In Progress' | 'Shipped'

interface FeatureNode {
  id: string
  label: string
  kind: string
  data: Record<string, unknown>
  productId: string
  createdAt: string | Date
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const COLUMNS: { status: Status; color: string; bg: string }[] = [
  { status: 'Planned', color: '#64748B', bg: '#64748B' },
  { status: 'In Progress', color: '#F59E0B', bg: '#F59E0B' },
  { status: 'Shipped', color: '#10B981', bg: '#10B981' },
]

const PRIORITY_COLORS: Record<string, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function getStatus(data: Record<string, unknown>): Status {
  const s = String(data.status ?? '').trim()
  if (s === 'In Progress' || s === 'in_progress' || s === 'in-progress') return 'In Progress'
  if (s === 'Shipped' || s === 'shipped' || s === 'done' || s === 'complete') return 'Shipped'
  return 'Planned'
}

function statusIndex(s: Status): number {
  return COLUMNS.findIndex((c) => c.status === s)
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

// ── QuickAdd ───────────────────────────────────────────────────────────

interface QuickAddProps {
  status: Status
  productId: string
  onCreated: () => void
}

function QuickAdd({ status, productId, onCreated }: QuickAddProps) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const createMutation = trpc.graph.createNode.useMutation({
    onSuccess: () => {
      setLabel('')
      setOpen(false)
      onCreated()
    },
  })

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function submit() {
    const trimmed = label.trim()
    if (!trimmed) return
    createMutation.mutate({
      productId,
      kind: 'feature' as any,
      label: trimmed,
      data: { status },
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') submit()
    if (e.key === 'Escape') {
      setLabel('')
      setOpen(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full px-3 py-2 rounded-lg text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] transition-colors"
      >
        <Plus size={12} />
        Add feature
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[var(--bg-inset)] border border-[var(--border-default)]">
      <input
        ref={inputRef}
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!label.trim()) setOpen(false)
        }}
        placeholder="Feature name…"
        className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
      />
      <button
        onClick={submit}
        disabled={!label.trim() || createMutation.isPending}
        className="text-[var(--accent-text)] hover:opacity-80 disabled:opacity-40"
      >
        <Check size={12} />
      </button>
      <button
        onClick={() => {
          setLabel('')
          setOpen(false)
        }}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ── FeatureCard ────────────────────────────────────────────────────────

interface FeatureCardProps {
  feature: FeatureNode
  moduleLabel: string | null
  onSelect: (f: FeatureNode) => void
  onMoveLeft: () => void
  onMoveRight: () => void
  currentStatusIndex: number
}

function FeatureCard({
  feature,
  moduleLabel,
  onSelect,
  onMoveLeft,
  onMoveRight,
  currentStatusIndex,
}: FeatureCardProps) {
  const [hovered, setHovered] = useState(false)
  const priority = typeof feature.data.priority === 'string' ? feature.data.priority : undefined
  const sprint = typeof feature.data.sprint === 'string' ? feature.data.sprint : undefined

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(feature)}
      className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] px-3 py-2.5 cursor-pointer select-none"
      style={{ boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.3)' : undefined }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[12px] font-medium text-[var(--text-primary)] leading-snug line-clamp-2 flex-1">
          {feature.label}
        </span>
        {priority && PRIORITY_COLORS[priority] && (
          <span
            className="mt-0.5 shrink-0 w-2 h-2 rounded-sm"
            style={{ backgroundColor: PRIORITY_COLORS[priority] }}
            title={`Priority: ${priority}`}
          />
        )}
      </div>

      {/* Module badge */}
      {moduleLabel && (
        <div className="mb-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-900/40 text-purple-300 border border-purple-700/30">
            {moduleLabel}
          </span>
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          {sprint && (
            <span className="text-[9px] text-[var(--text-tertiary)] bg-[var(--bg-inset)] px-1.5 py-0.5 rounded">
              {sprint}
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onMoveLeft}
            disabled={currentStatusIndex === 0}
            className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] disabled:opacity-20 transition-colors"
            title="Move left"
          >
            <ChevronLeft size={11} />
          </button>
          <button
            onClick={onMoveRight}
            disabled={currentStatusIndex === COLUMNS.length - 1}
            className="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] disabled:opacity-20 transition-colors"
            title="Move right"
          >
            <ChevronRight size={11} />
          </button>
          {hovered && (
            <span className="text-[var(--text-tertiary)] text-[9px] pl-1 opacity-50">click to open</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── DetailPanel ────────────────────────────────────────────────────────

interface DetailPanelProps {
  feature: FeatureNode
  moduleLabel: string | null
  orgSlug: string
  productSlug: string
  onClose: () => void
  onUpdated: () => void
}

function DetailPanel({
  feature,
  moduleLabel,
  orgSlug,
  productSlug,
  onClose,
  onUpdated,
}: DetailPanelProps) {
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(feature.label)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingVal, setEditingVal] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const labelInputRef = useRef<HTMLInputElement>(null)

  const currentStatus = getStatus(feature.data)

  const updateMutation = trpc.graph.updateNode.useMutation({ onSuccess: onUpdated })
  const deleteMutation = trpc.graph.deleteNode.useMutation({
    onSuccess: () => {
      onUpdated()
      onClose()
    },
  })

  useEffect(() => {
    setLabelDraft(feature.label)
    setEditingLabel(false)
    setEditingKey(null)
    setConfirmDelete(false)
  }, [feature.id])

  useEffect(() => {
    if (editingLabel) labelInputRef.current?.focus()
  }, [editingLabel])

  function saveLabel() {
    const trimmed = labelDraft.trim()
    if (!trimmed || trimmed === feature.label) {
      setEditingLabel(false)
      return
    }
    updateMutation.mutate({ id: feature.id, label: trimmed })
    setEditingLabel(false)
  }

  function changeStatus(s: Status) {
    updateMutation.mutate({ id: feature.id, data: { ...feature.data, status: s } })
  }

  function startEditKey(key: string) {
    setEditingKey(key)
    setEditingVal(String(feature.data[key] ?? ''))
  }

  function saveKey() {
    if (!editingKey) return
    updateMutation.mutate({ id: feature.id, data: { ...feature.data, [editingKey]: editingVal } })
    setEditingKey(null)
  }

  const dataEntries = Object.entries(feature.data).filter(([k]) => k !== 'status')

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-[var(--toolbar-h,48px)] bottom-0 w-[280px] z-40 flex flex-col bg-[var(--bg-surface)] border-l border-[var(--border-default)] shadow-2xl overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-start gap-2 p-4 border-b border-[var(--border-default)]">
        <div className="flex-1 min-w-0">
          {editingLabel ? (
            <input
              ref={labelInputRef}
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveLabel()
                if (e.key === 'Escape') {
                  setLabelDraft(feature.label)
                  setEditingLabel(false)
                }
              }}
              className="w-full bg-[var(--bg-inset)] border border-[var(--border-default)] rounded px-2 py-1 text-[13px] font-medium text-[var(--text-primary)] outline-none"
            />
          ) : (
            <h3
              onClick={() => setEditingLabel(true)}
              className="text-[13px] font-semibold text-[var(--text-primary)] cursor-text hover:text-[var(--accent-text)] transition-colors leading-snug"
              title="Click to edit"
            >
              {feature.label}
            </h3>
          )}
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Feature</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Status selector */}
      <div className="p-4 border-b border-[var(--border-default)]">
        <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
          Status
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {COLUMNS.map((col) => (
            <button
              key={col.status}
              onClick={() => changeStatus(col.status)}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium transition-all"
              style={
                currentStatus === col.status
                  ? { backgroundColor: col.bg + '33', color: col.color, border: `1px solid ${col.color}66` }
                  : { backgroundColor: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' }
              }
            >
              {col.status}
            </button>
          ))}
        </div>
      </div>

      {/* Properties */}
      {dataEntries.length > 0 && (
        <div className="p-4 border-b border-[var(--border-default)]">
          <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Properties
          </p>
          <div className="space-y-1.5">
            {dataEntries.map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-[var(--text-tertiary)] w-16 shrink-0 truncate capitalize">
                  {key}
                </span>
                {editingKey === key ? (
                  <input
                    autoFocus
                    value={editingVal}
                    onChange={(e) => setEditingVal(e.target.value)}
                    onBlur={saveKey}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveKey()
                      if (e.key === 'Escape') setEditingKey(null)
                    }}
                    className="flex-1 bg-[var(--bg-inset)] border border-[var(--border-default)] rounded px-1.5 py-0.5 text-[10px] text-[var(--text-primary)] outline-none"
                  />
                ) : (
                  <span
                    onClick={() => startEditKey(key)}
                    className="flex-1 text-[10px] text-[var(--text-secondary)] cursor-text hover:text-[var(--accent-text)] truncate"
                    title="Click to edit"
                  >
                    {String(val)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module */}
      {moduleLabel && (
        <div className="p-4 border-b border-[var(--border-default)]">
          <p className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Module
          </p>
          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-purple-900/40 text-purple-300 border border-purple-700/30">
            {moduleLabel}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 space-y-2 border-b border-[var(--border-default)]">
        <a
          href={`/${orgSlug}/${productSlug}/graph-explorer`}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ExternalLink size={12} />
          Open in Graph
        </a>
        <button
          onClick={() => console.log('[AI Suggest] feature:', feature.id)}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] text-[var(--accent-text)] hover:bg-[var(--accent-bg)] transition-colors"
        >
          <Sparkles size={12} />
          AI: Suggest
        </button>
      </div>

      {/* Delete */}
      <div className="p-4 mt-auto">
        <button
          onClick={() => {
            if (confirmDelete) {
              deleteMutation.mutate({ id: feature.id })
            } else {
              setConfirmDelete(true)
              setTimeout(() => setConfirmDelete(false), 3000)
            }
          }}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[11px] transition-colors"
          style={
            confirmDelete
              ? { backgroundColor: '#EF444420', color: '#EF4444', border: '1px solid #EF444440' }
              : { color: 'var(--text-tertiary)' }
          }
        >
          {confirmDelete ? (
            <>
              <AlertTriangle size={12} />
              Confirm delete
            </>
          ) : (
            <>
              <Trash2 size={12} />
              Delete feature
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

// ── AISuggestPanel ─────────────────────────────────────────────────────

interface AISuggestPanelProps {
  productId: string
  existingLabels: string[]
  onClose: () => void
  onAddFeature: (label: string) => void
}

function AISuggestPanel({ productId, existingLabels, onClose, onAddFeature }: AISuggestPanelProps) {
  const suggestMutation = trpc.ai.suggest.useMutation()

  useEffect(() => {
    suggestMutation.mutate({
      productId,
      prompt: `Suggest 5 new features for this product based on existing features: ${existingLabels.slice(0, 20).join(', ')}`,
      context: { studioOrigin: 'features' },
    })
  }, [])

  const suggestions: string[] = useMemo(() => {
    if (!suggestMutation.data) return []
    const raw = suggestMutation.data
    if (Array.isArray(raw)) return raw.map((r: unknown) => String(r))
    if (typeof raw === 'string') {
      return raw
        .split('\n')
        .map((l) => l.replace(/^[\d\.\-\*\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 5)
    }
    return []
  }, [suggestMutation.data])

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute right-0 top-full mt-2 w-72 z-50 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-default)]">
        <span className="text-[11px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
          <Sparkles size={11} className="text-[var(--accent-text)]" />
          AI Suggestions
        </span>
        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
          <X size={12} />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {suggestMutation.isPending && (
          <p className="text-[11px] text-[var(--text-tertiary)] text-center py-4">Generating suggestions…</p>
        )}
        {suggestMutation.isError && (
          <p className="text-[11px] text-red-400 text-center py-4">Failed to generate suggestions</p>
        )}
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-inset)] group"
          >
            <span className="flex-1 text-[11px] text-[var(--text-secondary)] leading-snug">{s}</span>
            <button
              onClick={() => onAddFeature(s)}
              className="shrink-0 p-0.5 rounded text-[var(--accent-text)] opacity-0 group-hover:opacity-100 hover:bg-[var(--accent-bg)] transition-all"
              title="Add feature"
            >
              <Plus size={12} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function FeaturesPage() {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const orgSlug = params.orgSlug ?? ''
  const productSlug = params.productSlug ?? ''
  const { product } = useProduct()
  const productId = product?.id ?? ''

  const [search, setSearch] = useState('')
  const [selectedFeature, setSelectedFeature] = useState<FeatureNode | null>(null)
  const [showAISuggest, setShowAISuggest] = useState(false)
  const aiButtonRef = useRef<HTMLDivElement>(null)

  // ── Queries ───────────────────────────────────────────────────────────

  const featuresQuery = trpc.graph.getNodes.useQuery(
    { productId, kind: 'feature' as any },
    { enabled: !!productId, staleTime: 0 },
  )

  const edgesQuery = trpc.graph.getEdges.useQuery(
    { productId },
    { enabled: !!productId, staleTime: 0 },
  )

  const allNodesQuery = trpc.graph.getNodes.useQuery(
    { productId },
    { enabled: !!productId, staleTime: 30_000 },
  )

  // ── Mutations ─────────────────────────────────────────────────────────

  const updateMutation = trpc.graph.updateNode.useMutation({
    onSuccess: () => featuresQuery.refetch(),
  })

  const createMutation = trpc.graph.createNode.useMutation({
    onSuccess: () => featuresQuery.refetch(),
  })

  // ── Derived data ──────────────────────────────────────────────────────

  const features: FeatureNode[] = useMemo(() => {
    if (!featuresQuery.data) return []
    return featuresQuery.data as FeatureNode[]
  }, [featuresQuery.data])

  // Map nodeId → label for all nodes (used for module resolution)
  const nodeLabels = useMemo<Record<string, string>>(() => {
    if (!allNodesQuery.data) return {}
    const map: Record<string, string> = {}
    for (const n of allNodesQuery.data as FeatureNode[]) {
      map[n.id] = n.label
    }
    return map
  }, [allNodesQuery.data])

  // Map featureId → module label
  const moduleByFeature = useMemo<Record<string, string>>(() => {
    if (!edgesQuery.data) return {}
    const map: Record<string, string> = {}
    for (const edge of edgesQuery.data as { sourceId: string; targetId: string; kind: string }[]) {
      if (edge.kind === 'contains') {
        const label = nodeLabels[edge.sourceId]
        if (label) map[edge.targetId] = label
      }
    }
    return map
  }, [edgesQuery.data, nodeLabels])

  // Filtered features
  const filteredFeatures = useMemo(() => {
    if (!search.trim()) return features
    const q = search.toLowerCase()
    return features.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        String(f.data.sprint ?? '').toLowerCase().includes(q) ||
        (moduleByFeature[f.id] ?? '').toLowerCase().includes(q),
    )
  }, [features, search, moduleByFeature])

  // Group by status
  const byStatus = useMemo<Record<Status, FeatureNode[]>>(() => {
    const map: Record<Status, FeatureNode[]> = { Planned: [], 'In Progress': [], Shipped: [] }
    for (const f of filteredFeatures) {
      map[getStatus(f.data)].push(f)
    }
    return map
  }, [filteredFeatures])

  // ── Handlers ──────────────────────────────────────────────────────────

  const moveFeature = useCallback(
    (feature: FeatureNode, direction: 'left' | 'right') => {
      const current = getStatus(feature.data)
      const idx = statusIndex(current)
      const nextIdx = direction === 'left' ? idx - 1 : idx + 1
      if (nextIdx < 0 || nextIdx >= COLUMNS.length) return
      const newStatus = COLUMNS[nextIdx].status
      updateMutation.mutate({ id: feature.id, data: { ...feature.data, status: newStatus } })
      if (selectedFeature?.id === feature.id) {
        setSelectedFeature({ ...feature, data: { ...feature.data, status: newStatus } })
      }
    },
    [updateMutation, selectedFeature],
  )

  function handleAddFromAI(label: string) {
    createMutation.mutate({
      productId,
      kind: 'feature' as any,
      label,
      data: { status: 'Planned' },
    })
  }

  const existingLabels = useMemo(() => features.map((f) => f.label), [features])
  const isEmpty = features.length === 0 && !featuresQuery.isLoading

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)] overflow-hidden">
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-3 px-4 border-b border-[var(--border-default)] shrink-0"
        style={{ height: 'var(--toolbar-h, 48px)' }}
      >
        {/* Title */}
        <div className="flex items-center gap-2 shrink-0">
          <Zap size={15} className="text-[var(--accent-text)]" />
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">Features</span>
          <span className="ml-1 px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[10px] text-[var(--text-tertiary)]">
            {features.length}
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1.5 flex-1 max-w-xs bg-[var(--bg-inset)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5">
          <Search size={11} className="text-[var(--text-tertiary)] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search features…"
            className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
              <X size={10} />
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* AI Suggest */}
          <div className="relative" ref={aiButtonRef}>
            <button
              onClick={() => setShowAISuggest((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors"
              style={
                showAISuggest
                  ? { backgroundColor: 'var(--accent-bg)', color: 'var(--accent-text)', borderColor: 'var(--accent-text)' }
                  : { backgroundColor: 'transparent', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }
              }
            >
              <Sparkles size={11} />
              AI: Suggest
            </button>

            <AnimatePresence>
              {showAISuggest && (
                <AISuggestPanel
                  productId={productId}
                  existingLabels={existingLabels}
                  onClose={() => setShowAISuggest(false)}
                  onAddFeature={(label) => {
                    handleAddFromAI(label)
                    setShowAISuggest(false)
                  }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Add Feature */}
          <button
            onClick={() => {
              // Focus the first column's quick-add
              document.getElementById('quick-add-Planned')?.click()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent-bg)] text-[var(--accent-text)] hover:opacity-90 transition-opacity"
          >
            <Plus size={11} />
            Add Feature
          </button>
        </div>
      </div>

      {/* ── Empty state ── */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center">
            <Zap size={28} className="text-[var(--text-tertiary)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-1">No features yet</h3>
            <p className="text-[12px] text-[var(--text-tertiary)] max-w-xs">
              Start building your product features. Apply a template to get started quickly or let AI generate some for you.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <a
              href={`/${orgSlug}/${productSlug}/templates`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)] transition-colors"
            >
              Apply a template
            </a>
            <a
              href={`/${orgSlug}/${productSlug}/graph-explorer`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium bg-[var(--accent-bg)] text-[var(--accent-text)] hover:opacity-90 transition-opacity"
            >
              <Sparkles size={12} />
              AI: Generate
            </a>
          </div>
        </div>
      )}

      {/* ── Kanban board ── */}
      {!isEmpty && (
        <div className="flex-1 flex gap-4 px-4 py-4 overflow-x-auto overflow-y-hidden">
          {COLUMNS.map((col) => {
            const cards = byStatus[col.status]
            return (
              <div
                key={col.status}
                className="flex flex-col shrink-0"
                style={{ minWidth: 280, maxWidth: 320, width: 300 }}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                    {col.status}
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-inset)] px-1.5 py-0.5 rounded-full">
                    {cards.length}
                  </span>
                  <button
                    id={`quick-add-${col.status}`}
                    onClick={() => {
                      const el = document.querySelector<HTMLButtonElement>(
                        `[data-quick-add="${col.status}"]`,
                      )
                      el?.click()
                    }}
                    className="ml-auto p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] transition-colors"
                    title={`Add to ${col.status}`}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Cards area */}
                <div
                  className="flex-1 overflow-y-auto space-y-2 pb-2 pr-0.5"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    {cards.map((feature) => (
                      <FeatureCard
                        key={feature.id}
                        feature={feature}
                        moduleLabel={moduleByFeature[feature.id] ?? null}
                        onSelect={setSelectedFeature}
                        onMoveLeft={() => moveFeature(feature, 'left')}
                        onMoveRight={() => moveFeature(feature, 'right')}
                        currentStatusIndex={statusIndex(col.status)}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Quick add */}
                <div className="mt-2" data-quick-add-wrapper={col.status}>
                  <div data-quick-add={col.status}>
                    <QuickAdd
                      status={col.status}
                      productId={productId}
                      onCreated={() => featuresQuery.refetch()}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {selectedFeature && (
          <>
            {/* Backdrop (click to close) */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setSelectedFeature(null)}
            />
            <DetailPanel
              key={selectedFeature.id}
              feature={selectedFeature}
              moduleLabel={moduleByFeature[selectedFeature.id] ?? null}
              orgSlug={orgSlug}
              productSlug={productSlug}
              onClose={() => setSelectedFeature(null)}
              onUpdated={() => {
                featuresQuery.refetch()
                // Keep panel open with updated data if possible
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
