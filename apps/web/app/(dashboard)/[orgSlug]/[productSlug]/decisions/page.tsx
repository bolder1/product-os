'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Scale,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  X,
  Trash2,
  Link2,
  Tag,
} from 'lucide-react'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import {
  useDecisionStore,
  type Decision,
  type DecisionStatus,
  type Alternative,
  type RelatedEntity,
} from '../../../../lib/decision-store'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<DecisionStatus, string> = {
  proposed: 'var(--color-warning)',
  decided: 'var(--color-success)',
  revisited: 'var(--accent-text)',
  superseded: 'var(--text-tertiary)',
}

const STATUS_BG_COLORS: Record<DecisionStatus, string> = {
  proposed: 'var(--color-warning-muted)',
  decided: 'var(--color-success-muted)',
  revisited: 'var(--accent-muted)',
  superseded: 'var(--border-subtle)',
}

const STATUS_LABELS: Record<DecisionStatus, string> = {
  proposed: 'Proposed',
  decided: 'Decided',
  revisited: 'Revisited',
  superseded: 'Superseded',
}

const STUDIO_OPTIONS = [
  'planner', 'templates', 'canvas', 'brand', 'components', 'design',
  'workflow', 'pages', 'graphics', 'code', 'handoff', 'releases',
  'testing', 'tasks', 'approvals', 'analytics',
]

type FilterTab = 'all' | DecisionStatus

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'decided', label: 'Decided' },
  { key: 'revisited', label: 'Revisited' },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  )
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Decision Card
// ---------------------------------------------------------------------------

function DecisionCard({
  decision,
  expanded,
  onToggle,
  onDecide,
}: {
  decision: Decision
  expanded: boolean
  onToggle: () => void
  onDecide: (id: string) => void
}) {
  const statusColor = STATUS_COLORS[decision.status]
  const statusBg = STATUS_BG_COLORS[decision.status]

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      {/* Card header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 text-left"
        style={{
          padding: '6px 12px',
          background: expanded ? 'var(--bg-elevated)' : 'transparent',
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 2,
            background: statusColor,
            flexShrink: 0,
          }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">
              {decision.title}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: statusColor,
                background: statusBg,
                borderRadius: 3,
                padding: '1px 5px',
                flexShrink: 0,
              }}
            >
              {STATUS_LABELS[decision.status]}
            </span>
          </div>

          <div className="flex items-center gap-3" style={{ marginTop: 2 }}>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
              {decision.studio}
            </span>
            {decision.alternatives.length > 0 && (
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                {decision.alternatives.length} alt{decision.alternatives.length !== 1 ? 's' : ''}
              </span>
            )}
            {decision.relatedEntities.length > 0 && (
              <span className="flex items-center gap-0.5" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                <Link2 size={9} />
                {decision.relatedEntities.length}
              </span>
            )}
            {decision.tags.length > 0 && (
              <span className="flex items-center gap-0.5" style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                <Tag size={9} />
                {decision.tags.join(', ')}
              </span>
            )}
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto', flexShrink: 0 }}>
              {timeAgo(decision.createdAt)}
            </span>
          </div>
        </div>

        <div style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            padding: '8px 12px 12px 20px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {/* Rationale */}
          <div style={{ marginBottom: 8 }}>
            <span className="tool-section-label" style={{ padding: 0, display: 'block', marginBottom: 3 }}>
              Rationale
            </span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {decision.rationale || 'No rationale provided'}
            </p>
          </div>

          {/* Alternatives */}
          {decision.alternatives.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span className="tool-section-label" style={{ padding: 0, display: 'block', marginBottom: 4 }}>
                Alternatives Considered
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {decision.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 3,
                      padding: '4px 8px',
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {alt.option}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {alt.proscons}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related entities */}
          {decision.relatedEntities.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <span className="tool-section-label" style={{ padding: 0, display: 'block', marginBottom: 4 }}>
                Related Entities
              </span>
              <div className="flex flex-wrap gap-1">
                {decision.relatedEntities.map((ent) => (
                  <span
                    key={ent.id}
                    className="tool-badge"
                  >
                    {ent.label}
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: 3 }}>({ent.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Decided by */}
          {decision.decidedBy && (
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 6 }}>
              Decided by <span style={{ color: 'var(--text-secondary)' }}>{decision.decidedBy}</span>
              {decision.decidedAt && ` -- ${timeAgo(decision.decidedAt)}`}
            </p>
          )}

          {/* Action buttons */}
          {decision.status === 'proposed' && (
            <button
              onClick={() => onDecide(decision.id)}
              className="tool-btn"
              style={{ color: 'var(--color-success)', borderColor: 'rgba(61,214,140,0.2)' }}
            >
              <CheckCircle size={12} />
              Mark as Decided
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Decision Modal
// ---------------------------------------------------------------------------

function CreateDecisionModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (data: {
    title: string
    rationale: string
    alternatives: Alternative[]
    relatedEntities: RelatedEntity[]
    tags: string[]
    studio: string
  }) => void
}) {
  const [title, setTitle] = useState('')
  const [rationale, setRationale] = useState('')
  const [studio, setStudio] = useState(STUDIO_OPTIONS[0] ?? 'planner')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [alternatives, setAlternatives] = useState<Alternative[]>([])

  const addAlternative = () => {
    setAlternatives([...alternatives, { option: '', proscons: '' }])
  }

  const removeAlternative = (idx: number) => {
    setAlternatives(alternatives.filter((_, i) => i !== idx))
  }

  const updateAlternative = (idx: number, field: keyof Alternative, value: string) => {
    setAlternatives(
      alternatives.map((alt, i) => (i === idx ? { ...alt, [field]: value } : alt))
    )
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    onCreate({
      title: title.trim(),
      rationale: rationale.trim(),
      alternatives: alternatives.filter((a) => a.option.trim()),
      relatedEntities: [],
      tags,
      studio,
    })
    setTitle('')
    setRationale('')
    setStudio(STUDIO_OPTIONS[0] ?? 'planner')
    setTagInput('')
    setTags([])
    setAlternatives([])
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col"
        style={{
          width: 480,
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 4,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3"
          style={{
            height: 36,
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center gap-2">
            <Scale size={13} style={{ color: 'var(--accent-text)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              Create Decision
            </span>
          </div>
          <button
            onClick={onClose}
            className="tool-btn"
            style={{ padding: '2px 4px', border: 'none', background: 'transparent' }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Title */}
            <div>
              <label className="tool-section-label" style={{ padding: 0, display: 'block', marginBottom: 3 }}>
                Title *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What was decided?"
                className="tool-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* Rationale */}
            <div>
              <label className="tool-section-label" style={{ padding: 0, display: 'block', marginBottom: 3 }}>
                Rationale
              </label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why was this decision made?"
                rows={3}
                className="tool-input"
                style={{ width: '100%', resize: 'none' }}
              />
            </div>

            {/* Studio */}
            <div>
              <label className="tool-section-label" style={{ padding: 0, display: 'block', marginBottom: 3 }}>
                Studio
              </label>
              <select
                value={studio}
                onChange={(e) => setStudio(e.target.value)}
                className="tool-input"
                style={{ width: '100%' }}
              >
                {STUDIO_OPTIONS.map((s) => (
                  <option key={s} value={s} style={{ background: 'var(--bg-surface)' }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Alternatives */}
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <span className="tool-section-label" style={{ padding: 0 }}>
                  Alternatives
                </span>
                <button onClick={addAlternative} className="tool-btn" style={{ padding: '2px 6px' }}>
                  <Plus size={10} />
                  Add
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {alternatives.map((alt, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 3,
                      padding: 6,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={alt.option}
                        onChange={(e) => updateAlternative(i, 'option', e.target.value)}
                        placeholder="Option name"
                        className="tool-input"
                        style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, padding: '2px 0' }}
                      />
                      <button
                        onClick={() => removeAlternative(i)}
                        className="tool-btn"
                        style={{ padding: '2px 4px', border: 'none', background: 'transparent' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <textarea
                      value={alt.proscons}
                      onChange={(e) => updateAlternative(i, 'proscons', e.target.value)}
                      placeholder="Pros/cons..."
                      rows={1}
                      className="tool-input"
                      style={{ width: '100%', border: 'none', background: 'transparent', padding: '2px 0', resize: 'none', fontSize: 11 }}
                    />
                  </div>
                ))}
                {alternatives.length === 0 && (
                  <p style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>No alternatives added yet</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="tool-section-label" style={{ padding: 0, display: 'block', marginBottom: 3 }}>
                Tags
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag..."
                  className="tool-input"
                  style={{ flex: 1 }}
                />
                <button onClick={addTag} className="tool-btn">
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1" style={{ marginTop: 4 }}>
                  {tags.map((tag) => (
                    <span key={tag} className="tool-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      {tag}
                      <button
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        style={{ color: 'var(--text-tertiary)', lineHeight: 1 }}
                      >
                        <X size={8} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-3"
          style={{
            height: 40,
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <button onClick={onClose} className="tool-btn">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="tool-btn tool-btn-primary"
            style={{ opacity: title.trim() ? 1 : 0.4 }}
          >
            <Plus size={12} />
            Create Decision
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Decisions Page
// ---------------------------------------------------------------------------

export default function DecisionsPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const allDecisions = useDecisionStore((s) => s.decisions)
  const decisions = useMemo(() => allDecisions.filter((d) => d.productId === productId), [allDecisions, productId])
  const addDecision = useDecisionStore((s) => s.addDecision)
  const decideOnDecision = useDecisionStore((s) => s.decideOnDecision)

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [studioFilter, setStudioFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const filteredDecisions = useMemo(() => {
    let result = decisions

    if (activeTab !== 'all') {
      result = result.filter((d) => d.status === activeTab)
    }

    if (studioFilter !== 'all') {
      result = result.filter((d) => d.studio === studioFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.rationale.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    return result
  }, [decisions, activeTab, studioFilter, search])

  const handleCreate = useCallback(
    (data: {
      title: string
      rationale: string
      alternatives: Alternative[]
      relatedEntities: RelatedEntity[]
      tags: string[]
      studio: string
    }) => {
      addDecision({
        ...data,
        productId,
      })
    },
    [addDecision, productId]
  )

  const handleDecide = useCallback(
    (id: string) => {
      decideOnDecision(id, 'You')
    },
    [decideOnDecision]
  )

  const usedStudios = useMemo(() => {
    const set = new Set(decisions.map((d) => d.studio))
    return Array.from(set).sort()
  }, [decisions])

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-workspace)' }}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 shrink-0 h-[var(--toolbar-h)]"
        style={{
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-surface)',
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            Decision Log
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            {filteredDecisions.length} decision{filteredDecisions.length !== 1 ? 's' : ''}
            {activeTab !== 'all' || studioFilter !== 'all'
              ? ` (filtered from ${decisions.length})`
              : ''}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <AIActionBar workspace="plan" productId={productId} compact />
          <button
            onClick={() => setCreateOpen(true)}
            className="tool-btn tool-btn-primary"
          >
            <Plus size={12} />
            New Decision
          </button>
        </div>
      </div>

      {/* Search + Studio filter + Status tabs */}
      <div
        className="shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {/* Search row */}
        <div className="flex items-center gap-2 px-3" style={{ height: 32 }}>
          <div className="relative flex-1" style={{ maxWidth: 280 }}>
            <Search
              size={12}
              style={{
                position: 'absolute',
                left: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions..."
              className="tool-input"
              style={{ width: '100%', paddingLeft: 22 }}
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter size={11} style={{ color: 'var(--text-tertiary)' }} />
            <select
              value={studioFilter}
              onChange={(e) => setStudioFilter(e.target.value)}
              className="tool-input"
              style={{ fontSize: 11 }}
            >
              <option value="all" style={{ background: 'var(--bg-surface)' }}>All Studios</option>
              {usedStudios.map((s) => (
                <option key={s} value={s} style={{ background: 'var(--bg-surface)' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status tabs */}
        <div className="tool-tabs" style={{ paddingLeft: 4 }}>
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.key
            const count =
              tab.key === 'all'
                ? decisions.length
                : decisions.filter((d) => d.status === tab.key).length

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tool-tab ${isActive ? 'active' : ''}`}
              >
                {tab.label}
                <span className="tool-badge" style={{ marginLeft: 4 }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Decision list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredDecisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={18} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {search || activeTab !== 'all' || studioFilter !== 'all'
                ? 'No matching decisions'
                : 'No decisions logged yet'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {search || activeTab !== 'all' || studioFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start logging architectural and product decisions'}
            </p>
          </div>
        ) : (
          filteredDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              expanded={expandedId === decision.id}
              onToggle={() =>
                setExpandedId(
                  expandedId === decision.id ? null : decision.id
                )
              }
              onDecide={handleDecide}
            />
          ))
        )}
      </div>

      {/* Create modal */}
      <CreateDecisionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
