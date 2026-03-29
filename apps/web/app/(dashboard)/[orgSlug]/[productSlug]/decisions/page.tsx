'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Sparkles,
} from 'lucide-react'
import { useParams } from 'next/navigation'
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
  proposed: '#F59E0B',
  decided: '#10B981',
  revisited: '#3B82F6',
  superseded: '#64748B',
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
  index,
  expanded,
  onToggle,
  onDecide,
}: {
  decision: Decision
  index: number
  expanded: boolean
  onToggle: () => void
  onDecide: (id: string) => void
}) {
  const statusColor = STATUS_COLORS[decision.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors"
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${statusColor}15` }}
        >
          <Scale size={15} style={{ color: statusColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-medium text-[#F1F5F9] truncate">
              {decision.title}
            </h3>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: `${statusColor}20`,
                color: statusColor,
              }}
            >
              {STATUS_LABELS[decision.status]}
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] line-clamp-2">
            {decision.rationale || 'No rationale provided'}
          </p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-[10px] text-[#64748B] capitalize">
              {decision.studio}
            </span>
            {decision.alternatives.length > 0 && (
              <span className="text-[10px] text-[#64748B]">
                {decision.alternatives.length} alternative
                {decision.alternatives.length !== 1 ? 's' : ''}
              </span>
            )}
            {decision.relatedEntities.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#64748B]">
                <Link2 size={9} />
                {decision.relatedEntities.length} linked
              </span>
            )}
            {decision.tags.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#64748B]">
                <Tag size={9} />
                {decision.tags.join(', ')}
              </span>
            )}
            <span className="text-[10px] text-[#475569] ml-auto shrink-0">
              {timeAgo(decision.createdAt)}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-[#64748B]">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-white/[0.06] space-y-3">
              {/* Rationale */}
              <div className="pt-3">
                <h4 className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1">
                  Rationale
                </h4>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  {decision.rationale || 'No rationale provided'}
                </p>
              </div>

              {/* Alternatives */}
              {decision.alternatives.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">
                    Alternatives Considered
                  </h4>
                  <div className="space-y-2">
                    {decision.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2"
                      >
                        <p className="text-xs font-medium text-[#F1F5F9] mb-0.5">
                          {alt.option}
                        </p>
                        <p className="text-[11px] text-[#94A3B8]">
                          {alt.proscons}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related entities */}
              {decision.relatedEntities.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1">
                    Related Entities
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {decision.relatedEntities.map((ent) => (
                      <span
                        key={ent.id}
                        className="text-[10px] text-[#94A3B8] bg-white/[0.04] rounded-md px-2 py-0.5"
                      >
                        {ent.label}
                        <span className="text-[#64748B] ml-1">({ent.type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Decided by */}
              {decision.decidedBy && (
                <p className="text-[10px] text-[#64748B]">
                  Decided by <span className="text-[#94A3B8]">{decision.decidedBy}</span>
                  {decision.decidedAt && ` — ${timeAgo(decision.decidedAt)}`}
                </p>
              )}

              {/* Action buttons */}
              {decision.status === 'proposed' && (
                <button
                  onClick={() => onDecide(decision.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#10B981] hover:bg-[#059669] transition-colors"
                >
                  <CheckCircle size={12} />
                  Mark as Decided
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
    // Reset
    setTitle('')
    setRationale('')
    setStudio(STUDIO_OPTIONS[0] ?? 'planner')
    setTagInput('')
    setTags([])
    setAlternatives([])
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0A0F1E] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                  <Scale size={16} className="text-[#F59E0B]" />
                </div>
                <h2 className="text-base font-semibold text-[#F1F5F9]">
                  Create Decision
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#64748B]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Title */}
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What was decided?"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#F59E0B]/40 transition-colors"
                />
              </div>

              {/* Rationale */}
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">
                  Rationale
                </label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Why was this decision made?"
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#F59E0B]/40 transition-colors resize-none"
                />
              </div>

              {/* Studio */}
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">
                  Studio
                </label>
                <select
                  value={studio}
                  onChange={(e) => setStudio(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] outline-none focus:border-[#F59E0B]/40 transition-colors"
                >
                  {STUDIO_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-[#0A0F1E]">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Alternatives */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider">
                    Alternatives
                  </label>
                  <button
                    onClick={addAlternative}
                    className="flex items-center gap-1 text-[10px] text-[#6366F1] hover:text-[#818CF8] transition-colors"
                  >
                    <Plus size={10} />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {alternatives.map((alt, i) => (
                    <div
                      key={i}
                      className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2.5 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={alt.option}
                          onChange={(e) =>
                            updateAlternative(i, 'option', e.target.value)
                          }
                          placeholder="Option name"
                          className="flex-1 bg-transparent border-b border-white/[0.06] pb-1 text-xs text-[#F1F5F9] placeholder-[#475569] outline-none"
                        />
                        <button
                          onClick={() => removeAlternative(i)}
                          className="p-0.5 rounded hover:bg-white/[0.06] text-[#64748B]"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <textarea
                        value={alt.proscons}
                        onChange={(e) =>
                          updateAlternative(i, 'proscons', e.target.value)
                        }
                        placeholder="Pros/cons..."
                        rows={1}
                        className="w-full bg-transparent text-[11px] text-[#94A3B8] placeholder-[#475569] outline-none resize-none"
                      />
                    </div>
                  ))}
                  {alternatives.length === 0 && (
                    <p className="text-[10px] text-[#475569]">
                      No alternatives added yet
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">
                  Tags
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-[#F1F5F9] placeholder-[#475569] outline-none"
                  />
                  <button
                    onClick={addTag}
                    className="px-2 py-1.5 rounded-lg text-xs text-[#6366F1] bg-[#6366F1]/10 hover:bg-[#6366F1]/20 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-[10px] text-[#94A3B8] bg-white/[0.04] rounded-md px-2 py-0.5"
                      >
                        {tag}
                        <button
                          onClick={() => setTags(tags.filter((t) => t !== tag))}
                          className="text-[#64748B] hover:text-[#94A3B8]"
                        >
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={14} />
                Create Decision
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Decisions Page
// ---------------------------------------------------------------------------

export default function DecisionsPage() {
  const params = useParams<{ productSlug: string }>()
  const productId = params.productSlug

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

    // Status filter
    if (activeTab !== 'all') {
      result = result.filter((d) => d.status === activeTab)
    }

    // Studio filter
    if (studioFilter !== 'all') {
      result = result.filter((d) => d.studio === studioFilter)
    }

    // Search
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

  // Studios that have decisions for the filter dropdown
  const usedStudios = useMemo(() => {
    const set = new Set(decisions.map((d) => d.studio))
    return Array.from(set).sort()
  }, [decisions])

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">
              Decision Log
            </h1>
            <p className="text-xs text-[#64748B]">
              {filteredDecisions.length} decision
              {filteredDecisions.length !== 1 ? 's' : ''}
              {activeTab !== 'all' || studioFilter !== 'all'
                ? ` (filtered from ${decisions.length})`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI: Suggest decisions
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#F59E0B] hover:bg-[#D97706] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Decision
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#F59E0B]/40 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-[#64748B]" />
          <select
            value={studioFilter}
            onChange={(e) => setStudioFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-[#F1F5F9] outline-none focus:border-[#F59E0B]/40 transition-colors"
          >
            <option value="all" className="bg-[#0A0F1E]">
              All Studios
            </option>
            {usedStudios.map((s) => (
              <option key={s} value={s} className="bg-[#0A0F1E]">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] -mx-1 px-1">
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
              className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-[#F59E0B]'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-[10px] ${
                  isActive ? 'text-[#F59E0B]/70' : 'text-[#64748B]/70'
                }`}
              >
                {count}
              </span>
              {isActive && (
                <motion.div
                  layoutId="decisions-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Decision list */}
      <motion.div
        key={`${activeTab}-${studioFilter}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {filteredDecisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <p className="text-sm text-[#94A3B8]">
              {search || activeTab !== 'all' || studioFilter !== 'all'
                ? 'No matching decisions'
                : 'No decisions logged yet'}
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              {search || activeTab !== 'all' || studioFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start logging architectural and product decisions'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDecisions.map((decision, index) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                index={index}
                expanded={expandedId === decision.id}
                onToggle={() =>
                  setExpandedId(
                    expandedId === decision.id ? null : decision.id
                  )
                }
                onDecide={handleDecide}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Create modal */}
      <CreateDecisionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
