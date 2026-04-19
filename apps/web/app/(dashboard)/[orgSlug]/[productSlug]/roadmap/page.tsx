'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import {
  Map,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Loader2,
  X,
  Calendar,
  Flag,
  Layers,
  Target,
  TrendingUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  Link2,
  Zap,
  BarChart3,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import { useGraphStore } from '../../../../lib/graph-store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MilestoneStatus = 'planned' | 'in-progress' | 'completed' | 'at-risk' | 'delayed'
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  type: 'feature' | 'bug' | 'improvement' | 'milestone-marker'
  nodeId?: string
}

interface Milestone {
  id: string
  title: string
  description: string
  quarter: Quarter
  year: number
  status: MilestoneStatus
  items: RoadmapItem[]
  color: string
  dueDate?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MILESTONE_STATUS: Record<MilestoneStatus, { label: string; icon: typeof Circle; color: string; bg: string }> = {
  planned: { label: 'Planned', icon: Circle, color: 'var(--text-tertiary)', bg: 'var(--bg-subtle)' },
  'in-progress': { label: 'In Progress', icon: Zap, color: 'var(--accent-text)', bg: 'var(--accent-muted)' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'var(--color-success)', bg: 'var(--color-success-muted)' },
  'at-risk': { label: 'At Risk', icon: AlertTriangle, color: 'var(--color-warning)', bg: 'var(--color-warning-muted)' },
  delayed: { label: 'Delayed', icon: AlertTriangle, color: 'var(--color-error)', bg: 'var(--color-error-muted)' },
}

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#6398ff',
  low: 'var(--text-tertiary)',
}

const ITEM_TYPE_COLORS = {
  feature: '#6398ff',
  bug: '#ef4444',
  improvement: '#10b981',
  'milestone-marker': '#8b5cf6',
}

const QUARTER_MONTHS: Record<Quarter, string> = {
  Q1: 'Jan–Mar',
  Q2: 'Apr–Jun',
  Q3: 'Jul–Sep',
  Q4: 'Oct–Dec',
}

const MILESTONE_COLORS = ['#6398ff', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']

// ---------------------------------------------------------------------------
// Default milestones (demo)
// ---------------------------------------------------------------------------

function defaultMilestones(productId: string): Milestone[] {
  return [
    {
      id: `${productId}-m1`,
      title: 'Foundation & Core',
      description: 'Authentication, user management, core data model, and essential infrastructure.',
      quarter: 'Q1',
      year: 2026,
      status: 'completed',
      color: '#6398ff',
      dueDate: '2026-03-31',
      items: [
        { id: 'i1', title: 'User authentication & onboarding', description: 'Login, signup, OAuth, session management', status: 'done', priority: 'critical', type: 'feature' },
        { id: 'i2', title: 'Core data model', description: 'Define entities, relationships, and graph schema', status: 'done', priority: 'critical', type: 'feature' },
        { id: 'i3', title: 'Role-based permissions', description: 'RBAC for workspace and studio access', status: 'done', priority: 'high', type: 'feature' },
        { id: 'i4', title: 'Workspace settings', description: 'Org management, billing basics, member invites', status: 'done', priority: 'medium', type: 'improvement' },
      ],
    },
    {
      id: `${productId}-m2`,
      title: 'Product Creation Suite',
      description: 'Planner, Template Gallery, Brand Builder, and Component system go live.',
      quarter: 'Q2',
      year: 2026,
      status: 'in-progress',
      color: '#ec4899',
      dueDate: '2026-06-30',
      items: [
        { id: 'i5', title: 'Product Planner wizard', description: '7-step guided setup with AI suggestions', status: 'done', priority: 'critical', type: 'feature' },
        { id: 'i6', title: 'Template Gallery', description: 'Browse, remix, and apply multi-studio templates', status: 'done', priority: 'high', type: 'feature' },
        { id: 'i7', title: 'Brand token system', description: 'Colors, typography, spacing, effects with propagation', status: 'in-progress', priority: 'high', type: 'feature' },
        { id: 'i8', title: 'Component Builder v1', description: 'Variants, props, slot definitions, token binding', status: 'in-progress', priority: 'high', type: 'feature' },
        { id: 'i9', title: 'Canvas Planner', description: 'Infinite canvas for sitemaps, journeys, IA', status: 'todo', priority: 'medium', type: 'feature' },
      ],
    },
    {
      id: `${productId}-m3`,
      title: 'Design & Workflow Engine',
      description: 'Design Studio, Page Builder, Workflow Builder, and handoff pipeline.',
      quarter: 'Q3',
      year: 2026,
      status: 'planned',
      color: '#10b981',
      dueDate: '2026-09-30',
      items: [
        { id: 'i10', title: 'Design Studio full mode', description: 'Frames, layers, prototype linking, auto layout', status: 'todo', priority: 'critical', type: 'feature' },
        { id: 'i11', title: 'Page Builder CMS mode', description: 'Section assembly, collections, SEO, preview/publish', status: 'todo', priority: 'high', type: 'feature' },
        { id: 'i12', title: 'Workflow / Ops Builder', description: 'State machines, form builder, automation triggers', status: 'todo', priority: 'high', type: 'feature' },
        { id: 'i13', title: 'Dev Handoff specs', description: 'CSS inspect, prop tables, acceptance criteria', status: 'todo', priority: 'medium', type: 'feature' },
        { id: 'i14', title: 'Figma Connector', description: 'Import design components, tokens, styles', status: 'todo', priority: 'medium', type: 'feature' },
      ],
    },
    {
      id: `${productId}-m4`,
      title: 'Intelligence & Launch',
      description: 'AI Skills, Analytics, Release Center, brand compliance, and production launch.',
      quarter: 'Q4',
      year: 2026,
      status: 'planned',
      color: '#f59e0b',
      dueDate: '2026-12-31',
      items: [
        { id: 'i15', title: 'AI Skills Studio', description: 'Skill catalog, Computer Mode, execution history', status: 'todo', priority: 'high', type: 'feature' },
        { id: 'i16', title: 'Analytics Builder', description: 'Event tracking, funnels, anomaly alerts, insight loops', status: 'todo', priority: 'high', type: 'feature' },
        { id: 'i17', title: 'Release Center v2', description: 'Staged deploy, checklist, rollback, diff view', status: 'todo', priority: 'high', type: 'feature' },
        { id: 'i18', title: 'Brand Compliance scanner', description: 'Drift detection, auto-fix, health score', status: 'todo', priority: 'medium', type: 'feature' },
        { id: 'i19', title: 'Public launch', description: 'Marketing site, onboarding, pricing, self-serve signup', status: 'todo', priority: 'critical', type: 'milestone-marker' },
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function progressOf(items: RoadmapItem[]): number {
  if (items.length === 0) return 0
  return Math.round((items.filter((i) => i.status === 'done').length / items.length) * 100)
}

function timeAgo(iso?: string): string {
  if (!iso) return ''
  const diff = new Date(iso).getTime() - Date.now()
  const days = Math.round(diff / 86400000)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  return `${days}d left`
}

// ---------------------------------------------------------------------------
// Add Milestone modal
// ---------------------------------------------------------------------------

function AddMilestoneModal({
  onAdd,
  onClose,
  colorIndex,
}: {
  onAdd: (m: Omit<Milestone, 'id' | 'items'>) => void
  onClose: () => void
  colorIndex: number
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quarter, setQuarter] = useState<Quarter>('Q1')
  const [year, setYear] = useState(2026)

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      description: description.trim(),
      quarter,
      year,
      status: 'planned',
      color: MILESTONE_COLORS[colorIndex % MILESTONE_COLORS.length],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[460px] rounded-2xl border border-[var(--border-default)] overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-[var(--accent-text)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">New Milestone</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-hover)]">
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--text-tertiary)] block mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Beta Launch"
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-tertiary)] block mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="What does this milestone cover?"
              className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)] resize-none" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-[var(--text-tertiary)] block mb-1.5">Quarter</label>
              <select value={quarter} onChange={(e) => setQuarter(e.target.value as Quarter)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none">
                {(['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-[var(--text-tertiary)] block mb-1.5">Year</label>
              <select value={year} onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none">
                {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">Cancel</button>
          <button onClick={handleSubmit} disabled={!title.trim()}
            className="px-4 py-2 text-sm rounded-xl font-medium disabled:opacity-40"
            style={{ background: 'var(--accent-text)', color: '#fff' }}>
            Create Milestone
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add item modal
// ---------------------------------------------------------------------------

function AddItemModal({ milestoneId, onAdd, onClose }: { milestoneId: string; onAdd: (item: RoadmapItem) => void; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<RoadmapItem['priority']>('medium')
  const [type, setType] = useState<RoadmapItem['type']>('feature')

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({ id: crypto.randomUUID(), title: title.trim(), description: description.trim(), status: 'todo', priority, type })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[420px] rounded-2xl border border-[var(--border-default)] overflow-hidden" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Add Roadmap Item</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-hover)]"><X className="w-4 h-4 text-[var(--text-secondary)]" /></button>
        </div>
        <div className="p-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title"
            className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)]" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Short description"
            className="w-full px-3 py-2 text-sm rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)] resize-none" />
          <div className="flex gap-3">
            <select value={type} onChange={(e) => setType(e.target.value as RoadmapItem['type'])}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none">
              {['feature', 'bug', 'improvement', 'milestone-marker'].map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as RoadmapItem['priority'])}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none">
              {['critical', 'high', 'medium', 'low'].map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[var(--border-subtle)]">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">Cancel</button>
          <button onClick={handleSubmit} disabled={!title.trim()}
            className="px-4 py-2 text-sm rounded-xl font-medium disabled:opacity-40"
            style={{ background: 'var(--accent-text)', color: '#fff' }}>Add</button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Roadmap item card
// ---------------------------------------------------------------------------

function ItemCard({ item, onStatusToggle }: { item: RoadmapItem; onStatusToggle: (id: string) => void }) {
  const nextStatus = item.status === 'done' ? 'todo' : item.status === 'in-progress' ? 'done' : 'in-progress'
  const statusIcon = item.status === 'done'
    ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
    : item.status === 'in-progress'
    ? <Loader2 className="w-3.5 h-3.5 text-[var(--accent-text)] animate-spin" />
    : <Circle className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />

  return (
    <div
      className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all cursor-pointer"
      style={{ background: 'var(--bg-subtle)', opacity: item.status === 'done' ? 0.65 : 1 }}
      onClick={() => onStatusToggle(item.id)}
    >
      <div className="mt-0.5 flex-shrink-0">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium text-[var(--text-primary)] ${item.status === 'done' ? 'line-through opacity-60' : ''}`}>{item.title}</p>
        {item.description && <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate">{item.description}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
          style={{ color: ITEM_TYPE_COLORS[item.type], background: `${ITEM_TYPE_COLORS[item.type]}18` }}
        >
          {item.type === 'milestone-marker' ? '⚑' : item.type}
        </span>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: PRIORITY_COLORS[item.priority] }} title={item.priority} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Milestone card
// ---------------------------------------------------------------------------

function MilestoneCard({
  milestone,
  expanded,
  onToggle,
  onAddItem,
  onItemStatusToggle,
  onDelete,
}: {
  milestone: Milestone
  expanded: boolean
  onToggle: () => void
  onAddItem: (milestoneId: string) => void
  onItemStatusToggle: (milestoneId: string, itemId: string) => void
  onDelete: (milestoneId: string) => void
}) {
  const status = MILESTONE_STATUS[milestone.status]
  const StatusIcon = status.icon
  const progress = progressOf(milestone.items)
  const doneCount = milestone.items.filter((i) => i.status === 'done').length
  const dueLabel = timeAgo(milestone.dueDate)

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all"
      style={{
        borderColor: expanded ? milestone.color : 'var(--border-subtle)',
        background: 'var(--bg-card)',
        boxShadow: expanded ? `0 0 0 1px ${milestone.color}` : 'none',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
        onClick={onToggle}
      >
        {/* Color dot */}
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: milestone.color }} />

        {/* Quarter badge */}
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded flex-shrink-0"
          style={{ background: `${milestone.color}20`, color: milestone.color }}
        >
          {milestone.quarter} {milestone.year}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{milestone.title}</p>
          {!expanded && (
            <p className="text-[10px] text-[var(--text-tertiary)] truncate mt-0.5">{milestone.description}</p>
          )}
        </div>

        {/* Status */}
        <span
          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
          style={{ color: status.color, background: status.bg }}
        >
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: progress === 100 ? 'var(--color-success)' : milestone.color }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)]">{doneCount}/{milestone.items.length}</span>
        </div>

        {/* Due */}
        {dueLabel && (
          <span
            className="text-[10px] flex-shrink-0"
            style={{ color: dueLabel.includes('overdue') ? 'var(--color-error)' : 'var(--text-tertiary)' }}
          >
            {dueLabel}
          </span>
        )}

        {expanded ? <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0" />}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[var(--border-subtle)] px-4 py-4">
          <p className="text-xs text-[var(--text-secondary)] mb-4">{milestone.description}</p>

          {/* Items */}
          <div className="space-y-2">
            {milestone.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onStatusToggle={(id) => onItemStatusToggle(milestone.id, id)}
              />
            ))}
          </div>

          {/* Add item + delete */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={() => onAddItem(milestone.id)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add item
            </button>
            <button
              onClick={() => onDelete(milestone.id)}
              className="flex items-center gap-1 text-[10px] text-[var(--color-error)] opacity-50 hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Suggestions
// ---------------------------------------------------------------------------

function AISuggestions({ milestones, onDismiss }: { milestones: Milestone[]; onDismiss: () => void }) {
  const inProgress = milestones.find((m) => m.status === 'in-progress')
  const atRisk = milestones.filter((m) => m.status === 'at-risk' || m.status === 'delayed')
  const totalPending = milestones.flatMap((m) => m.items).filter((i) => i.status !== 'done').length

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--accent-text)', background: 'var(--accent-muted)' }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
          <span className="text-xs font-semibold text-[var(--accent-text)]">AI Roadmap Insight</span>
        </div>
        <button onClick={onDismiss} className="p-0.5 rounded hover:bg-[var(--bg-hover)]">
          <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </button>
      </div>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        {inProgress ? `"${inProgress.title}" is your active milestone with ${progressOf(inProgress.items)}% completion. ` : ''}
        {atRisk.length > 0 ? `${atRisk.length} milestone${atRisk.length > 1 ? 's are' : ' is'} at risk — consider re-scoping or moving items to a later quarter. ` : ''}
        {totalPending > 0 ? `${totalPending} items are still pending across all milestones. ` : ''}
        Based on current velocity, consider breaking down large milestones into 6-week sprints to maintain delivery confidence.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gantt chart — full horizontal timeline
// ---------------------------------------------------------------------------

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Quarter → 0-based month start / end indices
const Q_BOUNDS: Record<Quarter, [number, number]> = {
  Q1: [0, 2],
  Q2: [3, 5],
  Q3: [6, 8],
  Q4: [9, 11],
}

/** Convert a milestone's quarter + year into pixel offsets in a 12-month grid */
function ganttLayout(milestone: Milestone, totalCols: number): { left: number; width: number } {
  const [startMonth, endMonth] = Q_BOUNDS[milestone.quarter]
  const left = (startMonth / 12) * 100
  const width = ((endMonth - startMonth + 1) / 12) * 100
  return { left, width }
}

interface GanttTooltip {
  milestone: Milestone
  x: number
  y: number
}

function GanttChart({ milestones }: { milestones: Milestone[] }) {
  const [tooltip, setTooltip] = useState<GanttTooltip | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Today marker — fraction of year elapsed
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1)
  const todayPct = ((now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())) * 100

  // Detect if the year is 2026 (our demo year) — if so, show today as mid-April 2026
  const demoYear = 2026
  const demoTodayPct = ((4 - 1 + 20 / 30) / 12) * 100 // ~April 20 in 12-month grid

  const todayMarker = demoTodayPct

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Header row — month labels */}
      <div className="border-b border-[var(--border-subtle)] px-4 py-2.5 flex items-center gap-3">
        <div className="w-[180px] shrink-0 flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="text-[11px] font-semibold text-[var(--text-primary)]">{demoYear} Roadmap</span>
        </div>
        <div className="flex-1 relative">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
            {MONTHS.map((m, i) => (
              <div key={m} className="text-center">
                <span className="text-[9px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quarter shading row */}
      <div className="flex items-center border-b border-[var(--border-subtle)] px-4">
        <div className="w-[180px] shrink-0" />
        <div className="flex-1 grid grid-cols-4 h-5">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).map((q, i) => (
            <div
              key={q}
              className="flex items-center justify-center text-[9px] font-semibold text-[var(--text-tertiary)] border-r border-[var(--border-subtle)] last:border-0"
              style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
            >
              {q}
            </div>
          ))}
        </div>
      </div>

      {/* Milestone rows */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {milestones.map((milestone) => {
          const { left, width } = ganttLayout(milestone, 12)
          const prog = progressOf(milestone.items)
          const st = MILESTONE_STATUS[milestone.status]
          const StatusIcon = st.icon

          return (
            <div key={milestone.id} className="flex items-center px-4 h-[52px] hover:bg-[var(--surface-hover)] transition-colors group">
              {/* Row label */}
              <div className="w-[180px] shrink-0 pr-4 flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: milestone.color }}
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                    {milestone.title}
                  </p>
                  <p className="text-[9px] text-[var(--text-tertiary)] truncate">{prog}% · {milestone.items.length} items</p>
                </div>
              </div>

              {/* Bar area */}
              <div className="flex-1 relative h-full flex items-center">
                {/* Month grid lines */}
                <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                  {MONTHS.map((_, i) => (
                    <div key={i} className="border-r border-[var(--border-subtle)] last:border-0 h-full opacity-40" />
                  ))}
                </div>

                {/* Today line */}
                <div
                  className="absolute top-0 bottom-0 w-[1.5px] z-10 pointer-events-none"
                  style={{
                    left: `${todayMarker}%`,
                    background: 'rgba(99,152,255,0.6)',
                    boxShadow: '0 0 6px rgba(99,152,255,0.4)',
                  }}
                />

                {/* Milestone bar */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-[22px] rounded-full cursor-pointer transition-all group-hover:h-[26px] z-20"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    background: `${milestone.color}22`,
                    border: `1.5px solid ${milestone.color}66`,
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const containerRect = containerRef.current?.getBoundingClientRect()
                    setTooltip({
                      milestone,
                      x: rect.left - (containerRect?.left ?? 0) + rect.width / 2,
                      y: rect.top - (containerRect?.top ?? 0) - 8,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Progress fill */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{
                      width: `${prog}%`,
                      background: `linear-gradient(90deg, ${milestone.color}55, ${milestone.color}88)`,
                    }}
                  />
                  {/* Label inside bar */}
                  <div className="absolute inset-0 flex items-center px-2.5 gap-1.5 overflow-hidden">
                    <StatusIcon size={9} className="shrink-0" style={{ color: milestone.color }} />
                    <span
                      className="text-[9px] font-semibold truncate leading-none"
                      style={{ color: milestone.color }}
                    >
                      {milestone.title}
                    </span>
                    <span className="text-[9px] opacity-60 shrink-0" style={{ color: milestone.color }}>
                      {prog}%
                    </span>
                  </div>

                  {/* Due date diamond marker */}
                  {milestone.dueDate && (
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-[10px] h-[10px] rotate-45 z-10"
                      style={{ background: milestone.color }}
                      title={`Due ${milestone.dueDate}`}
                    />
                  )}
                </div>

                {/* Item dots below bar */}
                <div
                  className="absolute flex items-center gap-0.5 z-20"
                  style={{ left: `${left}%`, top: 'calc(50% + 14px)', transform: 'translateY(0)' }}
                >
                  {milestone.items.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="w-[5px] h-[5px] rounded-full"
                      style={{
                        background: item.status === 'done'
                          ? milestone.color
                          : item.status === 'in-progress'
                            ? `${milestone.color}88`
                            : 'var(--border-strong)',
                      }}
                      title={item.title}
                    />
                  ))}
                  {milestone.items.length > 8 && (
                    <span className="text-[8px] text-[var(--text-tertiary)]">+{milestone.items.length - 8}</span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className="w-[90px] shrink-0 pl-3 flex justify-end">
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${milestone.color}18`, color: milestone.color }}
                >
                  {st.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-6 px-4 py-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        <div className="w-[180px] shrink-0" />
        <div className="flex items-center gap-4 text-[9px] text-[var(--text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full bg-[var(--accent)]" />
            <span>Today ({new Date(demoYear, 3, 20).toLocaleDateString('en', { month: 'short', day: 'numeric' })})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent-muted)]" />
            <span>Milestone span</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rotate-45 bg-[var(--text-tertiary)]" />
            <span>Due date</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-[5px] h-[5px] rounded-full bg-[var(--accent)]" />
            <div className="w-[5px] h-[5px] rounded-full bg-[var(--border-strong)]" />
            <span>Item progress</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div
            className="rounded-xl border border-[var(--border-default)] p-3 shadow-2xl min-w-[180px]"
            style={{ background: 'var(--bg-overlay)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: tooltip.milestone.color }} />
              <span className="text-[11px] font-semibold text-[var(--text-primary)]">{tooltip.milestone.title}</span>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mb-2 leading-relaxed">{tooltip.milestone.description}</p>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-[var(--text-tertiary)]">{tooltip.milestone.quarter} {tooltip.milestone.year}</span>
              <span style={{ color: tooltip.milestone.color }}>{progressOf(tooltip.milestone.items)}% done</span>
            </div>
            {tooltip.milestone.dueDate && (
              <p className="text-[9px] text-[var(--text-tertiary)] mt-1">Due {tooltip.milestone.dueDate}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

function SummaryStats({ milestones }: { milestones: Milestone[] }) {
  const allItems = milestones.flatMap((m) => m.items)
  const done = allItems.filter((i) => i.status === 'done').length
  const inProg = allItems.filter((i) => i.status === 'in-progress').length
  const completed = milestones.filter((m) => m.status === 'completed').length
  const atRisk = milestones.filter((m) => m.status === 'at-risk' || m.status === 'delayed').length
  const overallProgress = allItems.length > 0 ? Math.round((done / allItems.length) * 100) : 0

  return (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Overall Progress', value: `${overallProgress}%`, color: 'var(--accent-text)' },
        { label: 'Items Done', value: `${done}/${allItems.length}`, color: 'var(--color-success)' },
        { label: 'Milestones Completed', value: `${completed}/${milestones.length}`, color: 'var(--text-primary)' },
        { label: 'At Risk', value: atRisk, color: atRisk > 0 ? 'var(--color-warning)' : 'var(--color-success)' },
      ].map((s) => (
        <div key={s.label} className="rounded-xl px-4 py-3 border border-[var(--border-subtle)]" style={{ background: 'var(--bg-card)' }}>
          <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'gantt'

export default function RoadmapPage() {
  const params = useParams()
  const product = useProduct()
  const productId = product?.id ?? (params.productSlug as string)

  const [milestones, setMilestones] = useState<Milestone[]>(() => defaultMilestones(productId))
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([`${productId}-m2`]))
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('gantt')
  const [statusFilter, setStatusFilter] = useState<MilestoneStatus | 'all'>('all')

  // Live graph features — shown as unscheduled backlog items
  const graphFeatures = useGraphStore((s) =>
    s.nodes.filter((n) => n.productId === productId && n.kind === 'feature')
  )

  // Features not yet pinned to any milestone
  const pinnedNodeIds = useMemo(
    () => new Set(milestones.flatMap((m) => m.items.map((i) => i.nodeId).filter(Boolean))),
    [milestones]
  )
  const unscheduledFeatures = useMemo(
    () => graphFeatures.filter((n) => !pinnedNodeIds.has(n.id)),
    [graphFeatures, pinnedNodeIds]
  )

  const filtered = useMemo(() =>
    statusFilter === 'all' ? milestones : milestones.filter((m) => m.status === statusFilter),
    [milestones, statusFilter]
  )

  /** Promote an unscheduled graph feature onto a milestone */
  function handleScheduleFeature(nodeId: string, milestoneId: string) {
    const node = graphFeatures.find((n) => n.id === nodeId)
    if (!node) return
    const item: RoadmapItem = {
      id: crypto.randomUUID(),
      title: node.label,
      description: (node.data?.description as string | undefined) ?? '',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
      nodeId: node.id,
    }
    setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, items: [...m.items, item] } : m))
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAddMilestone(data: Omit<Milestone, 'id' | 'items'>) {
    const id = crypto.randomUUID()
    setMilestones((prev) => [...prev, { ...data, id, items: [] }])
    setExpandedIds((prev) => new Set([...prev, id]))
  }

  function handleAddItem(milestoneId: string, item: RoadmapItem) {
    setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, items: [...m.items, item] } : m))
  }

  function handleItemStatusToggle(milestoneId: string, itemId: string) {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id !== milestoneId ? m : {
          ...m,
          items: m.items.map((i) =>
            i.id !== itemId ? i : {
              ...i,
              status: i.status === 'done' ? 'todo' : i.status === 'in-progress' ? 'done' : 'in-progress'
            }
          ),
        }
      )
    )
  }

  function handleDeleteMilestone(id: string) {
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    setExpandedIds((prev) => { const n = new Set(prev); n.delete(id); return n })
  }

  const statusOptions: { key: MilestoneStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'planned', label: 'Planned' },
    { key: 'completed', label: 'Completed' },
    { key: 'at-risk', label: 'At Risk' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] flex-shrink-0" style={{ background: 'var(--bg-card)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,152,255,0.15)' }}>
            <Map className="w-4 h-4 text-[var(--accent-text)]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Roadmap</h1>
            <p className="text-xs text-[var(--text-tertiary)]">{milestones.length} milestones · {milestones.flatMap((m) => m.items).length} items</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--bg-subtle)' }}>
            {([
              { key: 'list', icon: Layers, title: 'List' },
              { key: 'gantt', icon: Calendar, title: 'Gantt' },
            ] as { key: ViewMode; icon: React.ElementType; title: string }[]).map(({ key, icon: Icon, title }) => (
              <button key={key} onClick={() => setViewMode(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all"
                style={{
                  background: viewMode === key ? 'var(--bg-card)' : 'transparent',
                  color: viewMode === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow: viewMode === key ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                }}>
                <Icon className="w-3.5 h-3.5" />{title}
              </button>
            ))}
          </div>
          <AIActionBar workspace="plan" productId={productId} compact />
          <button
            onClick={() => setShowAddMilestone(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-90"
            style={{ background: 'var(--accent-text)', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" />New Milestone
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {/* Stats */}
        <SummaryStats milestones={milestones} />

        {/* Gantt view */}
        {viewMode === 'gantt' && (
          <div className="relative">
            <GanttChart milestones={filtered} />
          </div>
        )}

        {/* AI Insight */}
        {showAI && <AISuggestions milestones={milestones} onDismiss={() => setShowAI(false)} />}

        {/* Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--bg-subtle)' }}>
            {statusOptions.map((o) => (
              <button key={o.key} onClick={() => setStatusFilter(o.key)}
                className="px-3 py-1.5 text-xs rounded-lg font-medium transition-all"
                style={{
                  background: statusFilter === o.key ? 'var(--bg-card)' : 'transparent',
                  color: statusFilter === o.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  boxShadow: statusFilter === o.key ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                }}>
                {o.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">{filtered.length} milestone{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Milestones */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Map className="w-8 h-8 text-[var(--text-tertiary)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No milestones yet</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Create your first milestone to start planning your roadmap.</p>
            <button onClick={() => setShowAddMilestone(true)}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 text-xs font-medium rounded-xl"
              style={{ background: 'var(--accent-text)', color: '#fff' }}>
              <Plus className="w-3.5 h-3.5" />New Milestone
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                expanded={expandedIds.has(m.id)}
                onToggle={() => toggleExpand(m.id)}
                onAddItem={(mid) => setAddingItemTo(mid)}
                onItemStatusToggle={handleItemStatusToggle}
                onDelete={handleDeleteMilestone}
              />
            ))}
          </div>
        )}

        {/* Unscheduled Graph Features Backlog */}
        {unscheduledFeatures.length > 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-subtle)]">
              <Zap size={12} className="text-[var(--text-tertiary)]" />
              <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Unscheduled from Planner
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]">
                {unscheduledFeatures.length}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
                — drag to a milestone or click to assign
              </span>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {unscheduledFeatures.map((node) => (
                <div
                  key={node.id}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--accent)] transition-all cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  <span className="text-[11px] text-[var(--text-primary)] font-medium">{node.label}</span>
                  {/* Quick-assign dropdown */}
                  <div className="hidden group-hover:flex items-center gap-1 ml-1">
                    {milestones.slice(0, 4).map((m) => (
                      <button
                        key={m.id}
                        title={`Add to ${m.title}`}
                        onClick={() => handleScheduleFeature(node.id, m.id)}
                        className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-125"
                        style={{ borderColor: m.color, background: `${m.color}30` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddMilestone && (
        <AddMilestoneModal
          onAdd={handleAddMilestone}
          onClose={() => setShowAddMilestone(false)}
          colorIndex={milestones.length}
        />
      )}
      {addingItemTo && (
        <AddItemModal
          milestoneId={addingItemTo}
          onAdd={(item) => { handleAddItem(addingItemTo, item); setAddingItemTo(null) }}
          onClose={() => setAddingItemTo(null)}
        />
      )}
    </div>
  )
}
