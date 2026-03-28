'use client'

import { motion } from 'framer-motion'
import { Check, X, Clock, GitBranch, Users } from 'lucide-react'
import type { Approval, ApprovalApprover } from '../_data/mock-approvals'

const statusConfig: Record<
  Approval['status'],
  { color: string; bg: string; label: string }
> = {
  pending: { color: '#F59E0B', bg: 'bg-[#F59E0B]/10', label: 'Pending' },
  approved: { color: '#10B981', bg: 'bg-[#10B981]/10', label: 'Approved' },
  rejected: { color: '#F43F5E', bg: 'bg-[#F43F5E]/10', label: 'Rejected' },
  changes_requested: { color: '#3B82F6', bg: 'bg-[#3B82F6]/10', label: 'Changes Requested' },
}

const typeLabels: Record<string, string> = {
  feature: 'Feature',
  component: 'Component',
  page: 'Page',
  schema: 'Schema',
  palette: 'Palette',
  layout: 'Layout',
}

function DecisionIcon({ decision }: { decision: ApprovalApprover['decision'] }) {
  switch (decision) {
    case 'approved':
      return <Check className="w-2.5 h-2.5 text-[#10B981]" />
    case 'rejected':
      return <X className="w-2.5 h-2.5 text-[#F43F5E]" />
    case 'changes_requested':
      return <GitBranch className="w-2.5 h-2.5 text-[#3B82F6]" />
    default:
      return <Clock className="w-2.5 h-2.5 text-[#64748B]" />
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface ApprovalCardProps {
  approval: Approval
  onClick: () => void
  index: number
}

export function ApprovalCard({ approval, onClick, index }: ApprovalCardProps) {
  const status = statusConfig[approval.status]

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="w-full text-left bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-[#F59E0B]/30 hover:bg-white/[0.05] transition-colors cursor-pointer group"
    >
      {/* Top row: name + type badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-[#F1F5F9] leading-tight group-hover:text-[#F59E0B] transition-colors">
          {approval.objectName}
        </h3>
        <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8]">
          {typeLabels[approval.objectType] ?? approval.objectType}
        </span>
      </div>

      {/* Requester */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ backgroundColor: approval.requester.color }}
        >
          {approval.requester.initials}
        </div>
        <span className="text-xs text-[#94A3B8]">
          {approval.requester.name}
        </span>
        <span className="text-[10px] text-[#64748B]">
          requested {timeAgo(approval.createdAt)}
        </span>
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${status.bg}`}
          style={{ color: status.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          {status.label}
        </span>
        <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
          <Users className="w-3 h-3" />
          {approval.routing}
        </div>
      </div>

      {/* Approver avatars */}
      <div className="flex items-center gap-1.5">
        {approval.approvers.map((a) => (
          <div key={a.name} className="relative">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-[#060918]"
              style={{ backgroundColor: a.color }}
            >
              {a.initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#060918] flex items-center justify-center">
              <DecisionIcon decision={a.decision} />
            </div>
          </div>
        ))}
        <span className="text-[10px] text-[#64748B] ml-1">
          {approval.approvers.filter((a) => a.decision !== 'pending').length}/{approval.approvers.length} decided
        </span>
      </div>
    </motion.button>
  )
}
