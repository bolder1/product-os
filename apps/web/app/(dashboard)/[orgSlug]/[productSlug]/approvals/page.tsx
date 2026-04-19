'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  Shield,
  Plus,
  Search,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  Trash2,
  Filter,
} from 'lucide-react'
import {
  useApprovalStore,
  type ApprovalRequest,
  type ApprovalStatus,
  type ApprovalType,
  type ApprovalStep,
} from '../../../../lib/approval-store'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type FilterStatus = 'all' | ApprovalStatus

const STATUS_TABS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

const PRIORITY_OPTIONS = ['all', 'low', 'normal', 'high', 'urgent'] as const

const TYPE_OPTIONS: ApprovalType[] = ['release', 'design', 'workflow', 'page', 'component', 'general']

const DEFAULT_CHAINS: Record<string, { label: string; approverRole: string }[]> = {
  release: [
    { label: 'QA Review', approverRole: 'QA' },
    { label: 'Manager Sign-off', approverRole: 'Manager' },
    { label: 'Admin Approval', approverRole: 'Admin' },
  ],
  design: [
    { label: 'Design Lead Review', approverRole: 'Designer' },
    { label: 'Manager Approval', approverRole: 'Manager' },
  ],
  workflow: [
    { label: 'BA Review', approverRole: 'BA' },
    { label: 'Manager Approval', approverRole: 'Manager' },
  ],
  page: [
    { label: 'Content Review', approverRole: 'BA' },
    { label: 'Design Review', approverRole: 'Designer' },
  ],
  component: [
    { label: 'FE Review', approverRole: 'FE' },
    { label: 'Design Review', approverRole: 'Designer' },
  ],
  general: [{ label: 'Manager Approval', approverRole: 'Manager' }],
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]',
  normal: 'bg-[var(--accent-muted)] text-[var(--accent-text)]',
  high: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]',
  urgent: 'bg-[var(--color-error-muted)] text-[var(--color-error)]',
}

const TYPE_COLORS: Record<string, string> = {
  release: 'bg-[#a78bfa]/10 text-[#a78bfa]',
  design: 'bg-[#f472b6]/10 text-[#f472b6]',
  workflow: 'bg-[#818cf8]/10 text-[#818cf8]',
  page: 'bg-[var(--color-success-muted)] text-[var(--color-success)]',
  component: 'bg-[#fb923c]/10 text-[#fb923c]',
  general: 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

let stepIdCounter = 0
function generateStepId() {
  stepIdCounter += 1
  return `step-${Date.now()}-${stepIdCounter}`
}

// ---------------------------------------------------------------------------
// Step Chain
// ---------------------------------------------------------------------------

function StepChain({ steps, currentIndex, status }: { steps: ApprovalStep[]; currentIndex: number; status: ApprovalStatus }) {
  const sorted = [...steps].sort((a, b) => a.order - b.order)

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {sorted.map((step, idx) => {
        const isCurrent = idx === currentIndex && status === 'pending'
        const isApproved = step.status === 'approved'
        const isRejected = step.status === 'rejected'

        let dotBg = 'bg-[var(--bg-elevated)] border-[var(--border-default)]'
        let icon = <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)]" />

        if (isApproved) {
          dotBg = 'bg-[var(--color-success-muted)] border-[var(--color-success)]/30'
          icon = <Check className="w-2.5 h-2.5 text-[var(--color-success)]" />
        } else if (isRejected) {
          dotBg = 'bg-[var(--color-error-muted)] border-[var(--color-error)]/30'
          icon = <X className="w-2.5 h-2.5 text-[var(--color-error)]" />
        } else if (isCurrent) {
          dotBg = 'bg-[var(--color-warning-muted)] border-[var(--color-warning)]/30'
          icon = <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
        }

        return (
          <div key={step.id} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${dotBg}`}>
                {icon}
              </div>
              <span className={`text-[9px] leading-tight text-center max-w-[56px] truncate ${isCurrent ? 'text-[var(--color-warning)] font-medium' : 'text-[var(--text-tertiary)]'}`}>
                {step.approverRole}
              </span>
            </div>
            {idx < sorted.length - 1 && (
              <ArrowRight className="w-2.5 h-2.5 text-[var(--text-tertiary)]/50 shrink-0 -mt-3" />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Approval Card
// ---------------------------------------------------------------------------

function ApprovalCard({
  request,
  onApprove,
  onReject,
}: {
  request: ApprovalRequest
  onApprove: (req: ApprovalRequest) => void
  onReject: (req: ApprovalRequest) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const currentStep = request.steps[request.currentStepIndex]

  return (
    <div className="border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors">
      <div className="p-3 space-y-2">
        {/* Top row: badges + time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <span className={`px-1.5 py-px text-[10px] font-medium capitalize ${TYPE_COLORS[request.type] ?? TYPE_COLORS.general}`}>
              {request.type}
            </span>
            <span className={`px-1.5 py-px text-[10px] font-medium capitalize ${PRIORITY_COLORS[request.priority]}`}>
              {request.priority}
            </span>
            {request.status !== 'pending' && (
              <span className={`px-1.5 py-px text-[10px] font-medium capitalize ${
                request.status === 'approved' ? 'bg-[var(--color-success-muted)] text-[var(--color-success)]' :
                request.status === 'rejected' ? 'bg-[var(--color-error-muted)] text-[var(--color-error)]' :
                'bg-[var(--border-subtle)] text-[var(--text-tertiary)]'
              }`}>
                {request.status}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">{timeAgo(request.createdAt)}</span>
        </div>

        {/* Title + description */}
        <div>
          <h3 className="text-[12px] font-medium text-[var(--text-primary)] leading-snug">{request.title}</h3>
          {request.description && (
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{request.description}</p>
          )}
        </div>

        {/* Requested by */}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-[var(--accent-muted)] flex items-center justify-center">
            <span className="text-[8px] font-bold text-[var(--accent-text)]">{request.requestedBy.initials}</span>
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">{request.requestedBy.name}</span>
        </div>

        {/* Step chain */}
        <StepChain steps={request.steps} currentIndex={request.currentStepIndex} status={request.status} />

        {/* Actions row */}
        <div className="flex items-center justify-between gap-2">
          {request.status === 'pending' && currentStep && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onApprove(request)}
                className="tool-btn py-0.5 px-2 text-[10px] text-[var(--color-success)] border-[var(--color-success)]/20 bg-[var(--color-success)]/5 hover:bg-[var(--color-success-muted)]"
              >
                <Check className="w-2.5 h-2.5" /> Approve
              </button>
              <button
                onClick={() => onReject(request)}
                className="tool-btn py-0.5 px-2 text-[10px] text-[var(--color-error)] border-[var(--color-error)]/20 bg-[var(--color-error)]/5 hover:bg-[var(--color-error-muted)]"
              >
                <X className="w-2.5 h-2.5" /> Reject
              </button>
            </div>
          )}
          {request.status !== 'pending' && <div />}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors ml-auto"
          >
            {expanded ? 'Less' : 'Details'}
            {expanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border-default)] space-y-1.5">
          {request.steps
            .sort((a, b) => a.order - b.order)
            .map((step) => (
              <div key={step.id} className="flex items-start gap-1.5 text-[11px]">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  step.status === 'approved' ? 'bg-[var(--color-success-muted)]' :
                  step.status === 'rejected' ? 'bg-[var(--color-error-muted)]' :
                  'bg-[var(--border-subtle)]'
                }`}>
                  {step.status === 'approved' && <Check className="w-2 h-2 text-[var(--color-success)]" />}
                  {step.status === 'rejected' && <X className="w-2 h-2 text-[var(--color-error)]" />}
                  {step.status === 'pending' && <Clock className="w-2 h-2 text-[var(--text-tertiary)]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-primary)]">
                    {step.label}{' '}
                    <span className="text-[var(--text-tertiary)]">({step.approverRole})</span>
                  </p>
                  {step.approverName && (
                    <p className="text-[var(--text-tertiary)]">Decided by {step.approverName}</p>
                  )}
                  {step.comment && (
                    <p className="text-[var(--text-secondary)] italic">&quot;{step.comment}&quot;</p>
                  )}
                  {step.decidedAt && (
                    <p className="text-[var(--text-tertiary)]">{timeAgo(step.decidedAt)}</p>
                  )}
                </div>
              </div>
            ))}
          {request.studio && (
            <p className="text-[10px] text-[var(--text-tertiary)] pt-1">Studio: {request.studio}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Approval Modal
// ---------------------------------------------------------------------------

interface ModalStep {
  id: string
  label: string
  approverRole: string
}

function CreateApprovalModal({ open, onClose, productId }: { open: boolean; onClose: () => void; productId: string }) {
  const createRequest = useApprovalStore((s) => s.createRequest)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<ApprovalType>('general')
  const [priority, setPriority] = useState<ApprovalRequest['priority']>('normal')
  const [steps, setSteps] = useState<ModalStep[]>(() =>
    DEFAULT_CHAINS.general.map((s) => ({ ...s, id: generateStepId() }))
  )

  const handleTypeChange = (newType: ApprovalType) => {
    setType(newType)
    const chain = DEFAULT_CHAINS[newType] ?? DEFAULT_CHAINS.general
    setSteps(chain.map((s) => ({ ...s, id: generateStepId() })))
  }

  const addStep = () => {
    setSteps((prev) => [...prev, { id: generateStepId(), label: '', approverRole: 'Manager' }])
  }

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id))
  }

  const updateStep = (id: string, field: 'label' | 'approverRole', value: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const canSubmit = title.trim() && steps.length > 0 && steps.every((s) => s.label.trim() && s.approverRole.trim())

  const handleSubmit = () => {
    if (!canSubmit) return
    createRequest({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      productId,
      studio: type,
      requestedBy: { id: 'current-user', name: 'You', initials: 'YO' },
      steps: steps.map((s, idx) => ({
        id: s.id,
        label: s.label,
        approverRole: s.approverRole,
        status: 'pending' as const,
        order: idx,
      })),
      priority,
    })
    setTitle('')
    setDescription('')
    setType('general')
    setPriority('normal')
    setSteps(DEFAULT_CHAINS.general.map((s) => ({ ...s, id: generateStepId() })))
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
          <h2 className="text-[13px] font-medium text-[var(--text-primary)]">New Approval Request</h2>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Title */}
          <div>
            <label className="tool-section-label block mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Release v2.3 approval"
              className="tool-input w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="tool-section-label block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs approval..."
              rows={3}
              className="tool-input w-full resize-none"
            />
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="tool-section-label block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as ApprovalType)}
                className="tool-input w-full appearance-none cursor-pointer"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="tool-section-label block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ApprovalRequest['priority'])}
                className="tool-input w-full appearance-none cursor-pointer"
              >
                {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                  <option key={p} value={p} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Approval steps */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="tool-section-label">Approval Chain</label>
              <button onClick={addStep} className="tool-btn py-0 px-1.5 text-[10px] text-[var(--accent-text)] border-[var(--accent-text)]/20">
                <Plus className="w-2.5 h-2.5" /> Add Step
              </button>
            </div>
            <div className="space-y-1.5">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[var(--text-tertiary)] w-3 text-center shrink-0">{idx + 1}</span>
                  <input
                    value={step.label}
                    onChange={(e) => updateStep(step.id, 'label', e.target.value)}
                    placeholder="Step label"
                    className="tool-input flex-1 py-1 text-[11px]"
                  />
                  <select
                    value={step.approverRole}
                    onChange={(e) => updateStep(step.id, 'approverRole', e.target.value)}
                    className="tool-input w-24 py-1 text-[11px] appearance-none cursor-pointer"
                  >
                    {['Admin', 'Manager', 'BA', 'QA', 'Designer', 'FE', 'BE'].map((r) => (
                      <option key={r} value={r} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">{r}</option>
                    ))}
                  </select>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(step.id)} className="text-[var(--text-tertiary)] hover:text-[var(--color-error)] transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[var(--border-default)]">
          <button onClick={onClose} className="tool-btn">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="tool-btn tool-btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Request
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ApprovalsPage() {
  const params = useParams()
  const productId = (params?.productSlug as string) ?? ''

  const allRequests = useApprovalStore((s) => s.requests)
  const requests = useMemo(() => allRequests.filter((r) => r.productId === productId), [allRequests, productId])
  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests])
  const decideStep = useApprovalStore((s) => s.decideStep)

  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useMemo(() => {
    let result = requests
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter)
    }
    if (priorityFilter !== 'all') {
      result = result.filter((r) => r.priority === priorityFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.requestedBy.name.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [requests, statusFilter, priorityFilter, search])

  const handleApprove = useCallback(
    (req: ApprovalRequest) => {
      const step = req.steps[req.currentStepIndex]
      if (step) decideStep(req.id, step.id, 'approved', undefined, 'You')
    },
    [decideStep]
  )

  const handleReject = useCallback(
    (req: ApprovalRequest) => {
      const step = req.steps[req.currentStepIndex]
      if (step) decideStep(req.id, step.id, 'rejected', undefined, 'You')
    },
    [decideStep]
  )

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: requests.length }
    for (const r of requests) {
      counts[r.status] = (counts[r.status] ?? 0) + 1
    }
    return counts
  }, [requests])

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="h-[var(--toolbar-h)] min-h-[32px] flex items-center gap-2 px-2 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <Shield className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
        <span className="text-[11px] font-medium text-[var(--text-primary)] shrink-0">Approvals</span>
        {pendingCount > 0 && (
          <span className="text-[10px] text-[var(--accent-text)] bg-[var(--accent-muted)] px-1.5 py-px font-medium">
            {pendingCount} pending
          </span>
        )}

        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1" />

        {/* Status tabs */}
        <div className="tool-tabs border-b-0 gap-0">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key
            const count = statusCounts[tab.key] ?? 0
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`tool-tab py-1 px-2 text-[10px] ${isActive ? 'active' : ''}`}
              >
                {tab.label}
                <span className={`ml-0.5 text-[9px] ${isActive ? 'text-[var(--accent-text)]/70' : 'text-[var(--text-tertiary)]'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex-1" />

        {/* Priority filter */}
        <div className="flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3 text-[var(--text-tertiary)]" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="tool-input py-0.5 px-1.5 text-[10px] appearance-none cursor-pointer"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="tool-input pl-6 pr-2 py-0.5 w-[140px] text-[11px]"
          />
        </div>

        <AIActionBar workspace="operate" productId={productId} compact />

        {/* New request */}
        <button
          onClick={() => setModalOpen(true)}
          className="tool-btn tool-btn-primary py-0.5 px-2 text-[10px]"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {/* ── Request list ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 bg-[var(--bg-workspace)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <Shield className="w-5 h-5 text-[var(--text-tertiary)]" />
            <p className="text-[12px] text-[var(--text-secondary)]">No approval requests</p>
            <p className="text-[11px] text-[var(--text-tertiary)] max-w-xs">
              {requests.length === 0
                ? 'Create your first approval request to start managing review workflows.'
                : 'No requests match your current filters.'}
            </p>
            {requests.length === 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="tool-btn tool-btn-primary text-[11px] mt-1"
              >
                <Plus className="w-3 h-3" />
                New Request
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-1.5">
            {filtered.map((request) => (
              <ApprovalCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {modalOpen && (
        <CreateApprovalModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          productId={productId}
        />
      )}
    </div>
  )
}
