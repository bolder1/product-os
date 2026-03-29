'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Plus,
  Search,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertCircle,
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
  low: 'bg-[#64748B]/20 text-[#94A3B8]',
  normal: 'bg-[#3B82F6]/20 text-[#60A5FA]',
  high: 'bg-[#F59E0B]/20 text-[#FBBF24]',
  urgent: 'bg-[#EF4444]/20 text-[#F87171]',
}

const TYPE_COLORS: Record<string, string> = {
  release: 'bg-[#8B5CF6]/20 text-[#A78BFA]',
  design: 'bg-[#EC4899]/20 text-[#F472B6]',
  workflow: 'bg-[#6366F1]/20 text-[#818CF8]',
  page: 'bg-[#14B8A6]/20 text-[#2DD4BF]',
  component: 'bg-[#F97316]/20 text-[#FB923C]',
  general: 'bg-[#64748B]/20 text-[#94A3B8]',
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
// Step Visualizer
// ---------------------------------------------------------------------------

function StepChain({ steps, currentIndex, status }: { steps: ApprovalStep[]; currentIndex: number; status: ApprovalStatus }) {
  const sorted = [...steps].sort((a, b) => a.order - b.order)

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {sorted.map((step, idx) => {
        const isCurrent = idx === currentIndex && status === 'pending'
        const isApproved = step.status === 'approved'
        const isRejected = step.status === 'rejected'

        let dotClass = 'bg-white/[0.12] border-white/[0.08]'
        let icon = <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />

        if (isApproved) {
          dotClass = 'bg-[#10B981]/20 border-[#10B981]/40'
          icon = <Check className="w-3 h-3 text-[#10B981]" />
        } else if (isRejected) {
          dotClass = 'bg-[#EF4444]/20 border-[#EF4444]/40'
          icon = <X className="w-3 h-3 text-[#EF4444]" />
        } else if (isCurrent) {
          dotClass = 'bg-[#F59E0B]/20 border-[#F59E0B]/40 ring-2 ring-[#F59E0B]/30'
          icon = <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
        }

        return (
          <div key={step.id} className="flex items-center gap-1 shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${dotClass}`}>
                {icon}
              </div>
              <span className={`text-[9px] leading-tight text-center max-w-[60px] truncate ${isCurrent ? 'text-[#F59E0B] font-medium' : 'text-[#64748B]'}`}>
                {step.approverRole}
              </span>
            </div>
            {idx < sorted.length - 1 && (
              <ArrowRight className="w-3 h-3 text-white/[0.12] shrink-0 -mt-3" />
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
  index,
  onApprove,
  onReject,
}: {
  request: ApprovalRequest
  index: number
  onApprove: (req: ApprovalRequest) => void
  onReject: (req: ApprovalRequest) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const currentStep = request.steps[request.currentStepIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
    >
      <div className="p-4 space-y-3">
        {/* Top row: badges + time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${TYPE_COLORS[request.type] ?? TYPE_COLORS.general}`}>
              {request.type}
            </span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${PRIORITY_COLORS[request.priority]}`}>
              {request.priority}
            </span>
            {request.status !== 'pending' && (
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize ${
                request.status === 'approved' ? 'bg-[#10B981]/20 text-[#10B981]' :
                request.status === 'rejected' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                'bg-white/[0.06] text-[#64748B]'
              }`}>
                {request.status}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#64748B] shrink-0">{timeAgo(request.createdAt)}</span>
        </div>

        {/* Title + description */}
        <div>
          <h3 className="text-sm font-medium text-[#F1F5F9] leading-snug">{request.title}</h3>
          {request.description && (
            <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{request.description}</p>
          )}
        </div>

        {/* Requested by */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#6366F1]/20 flex items-center justify-center">
            <span className="text-[9px] font-bold text-[#818CF8]">{request.requestedBy.initials}</span>
          </div>
          <span className="text-[11px] text-[#94A3B8]">{request.requestedBy.name}</span>
        </div>

        {/* Step chain */}
        <StepChain steps={request.steps} currentIndex={request.currentStepIndex} status={request.status} />

        {/* Actions row */}
        <div className="flex items-center justify-between gap-2">
          {request.status === 'pending' && currentStep && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onApprove(request)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 transition-colors"
              >
                <Check className="w-3 h-3" /> Approve
              </button>
              <button
                onClick={() => onReject(request)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 transition-colors"
              >
                <X className="w-3 h-3" /> Reject
              </button>
            </div>
          )}
          {request.status !== 'pending' && <div />}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#94A3B8] transition-colors ml-auto"
          >
            {expanded ? 'Less' : 'Details'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-2">
              {request.steps
                .sort((a, b) => a.order - b.order)
                .map((step) => (
                  <div key={step.id} className="flex items-start gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      step.status === 'approved' ? 'bg-[#10B981]/20' :
                      step.status === 'rejected' ? 'bg-[#EF4444]/20' :
                      'bg-white/[0.06]'
                    }`}>
                      {step.status === 'approved' && <Check className="w-2.5 h-2.5 text-[#10B981]" />}
                      {step.status === 'rejected' && <X className="w-2.5 h-2.5 text-[#EF4444]" />}
                      {step.status === 'pending' && <Clock className="w-2.5 h-2.5 text-[#64748B]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F1F5F9]">
                        {step.label}{' '}
                        <span className="text-[#64748B]">({step.approverRole})</span>
                      </p>
                      {step.approverName && (
                        <p className="text-[#64748B]">Decided by {step.approverName}</p>
                      )}
                      {step.comment && (
                        <p className="text-[#94A3B8] italic">&quot;{step.comment}&quot;</p>
                      )}
                      {step.decidedAt && (
                        <p className="text-[#64748B]">{timeAgo(step.decidedAt)}</p>
                      )}
                    </div>
                  </div>
                ))}
              {request.studio && (
                <p className="text-[11px] text-[#64748B] pt-1">Studio: {request.studio}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
    // Reset
    setTitle('')
    setDescription('')
    setType('general')
    setPriority('normal')
    setSteps(DEFAULT_CHAINS.general.map((s) => ({ ...s, id: generateStepId() })))
    onClose()
  }

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0B1120] shadow-2xl overflow-hidden"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-[#F1F5F9]">New Approval Request</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#94A3B8] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Release v2.3 approval"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs approval..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/50 transition-colors resize-none"
            />
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Type</label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as ApprovalType)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#F1F5F9] outline-none focus:border-[#6366F1]/50 transition-colors appearance-none cursor-pointer"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t} className="bg-[#0B1120] text-[#F1F5F9]">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ApprovalRequest['priority'])}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#F1F5F9] outline-none focus:border-[#6366F1]/50 transition-colors appearance-none cursor-pointer"
              >
                {(['low', 'normal', 'high', 'urgent'] as const).map((p) => (
                  <option key={p} value={p} className="bg-[#0B1120] text-[#F1F5F9]">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Approval steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#94A3B8]">Approval Chain</label>
              <button onClick={addStep} className="flex items-center gap-1 text-[10px] text-[#6366F1] hover:text-[#818CF8] transition-colors">
                <Plus className="w-3 h-3" /> Add Step
              </button>
            </div>
            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#64748B] w-4 text-center shrink-0">{idx + 1}</span>
                  <input
                    value={step.label}
                    onChange={(e) => updateStep(step.id, 'label', e.target.value)}
                    placeholder="Step label"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/50 transition-colors"
                  />
                  <select
                    value={step.approverRole}
                    onChange={(e) => updateStep(step.id, 'approverRole', e.target.value)}
                    className="w-28 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] outline-none focus:border-[#6366F1]/50 transition-colors appearance-none cursor-pointer"
                  >
                    {['Admin', 'Manager', 'BA', 'QA', 'Designer', 'FE', 'BE'].map((r) => (
                      <option key={r} value={r} className="bg-[#0B1120] text-[#F1F5F9]">{r}</option>
                    ))}
                  </select>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(step.id)} className="text-[#64748B] hover:text-[#EF4444] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.04] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#6366F1] hover:bg-[#5558E6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Create Request
          </button>
        </div>
      </motion.div>
    </motion.div>
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
    <div className="flex flex-col h-full gap-5">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#6366F1]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Approval Queue</h1>
            <p className="text-xs text-[#64748B]">
              {pendingCount} pending of {requests.length} total
            </p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#6366F1] hover:bg-[#5558E6] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* ---- Filters row ---- */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status tabs */}
        <div className="flex items-center gap-1 border-b border-white/[0.06] -mb-px">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key
            const count = statusCounts[tab.key] ?? 0
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-[#6366F1]' : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {tab.label}
                <span className={`ml-1 text-[10px] ${isActive ? 'text-[#6366F1]/70' : 'text-[#64748B]/60'}`}>
                  {count}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="approval-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366F1] rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#64748B]" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] outline-none focus:border-[#6366F1]/50 transition-colors appearance-none cursor-pointer"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p} className="bg-[#0B1120] text-[#F1F5F9]">
                {p === 'all' ? 'All Priorities' : p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search approvals..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/50 transition-colors"
          />
        </div>
      </div>

      {/* ---- Request list ---- */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-[#6366F1]" />
            </div>
            <p className="text-sm font-medium text-[#F1F5F9] mb-1">No approval requests</p>
            <p className="text-xs text-[#64748B] max-w-xs">
              {requests.length === 0
                ? 'Create your first approval request to start managing review workflows.'
                : 'No requests match your current filters. Try adjusting your search or filters.'}
            </p>
            {requests.length === 0 && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white bg-[#6366F1] hover:bg-[#5558E6] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Request
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`${statusFilter}-${priorityFilter}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((request, idx) => (
                <ApprovalCard
                  key={request.id}
                  request={request}
                  index={idx}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ---- Create Modal ---- */}
      <AnimatePresence>
        {modalOpen && (
          <CreateApprovalModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            productId={productId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
