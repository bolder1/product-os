'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, MessageSquare, Clock, GitBranch, Users, ArrowRight } from 'lucide-react'
import type { Approval, ApprovalApprover } from '../_data/mock-approvals'
import { ApprovalTimeline } from './approval-timeline'

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

function decisionLabel(d: ApprovalApprover['decision']): string {
  switch (d) {
    case 'approved': return 'Approved'
    case 'rejected': return 'Rejected'
    case 'changes_requested': return 'Changes Requested'
    default: return 'Pending'
  }
}

function decisionColor(d: ApprovalApprover['decision']): string {
  switch (d) {
    case 'approved': return '#10B981'
    case 'rejected': return '#F43F5E'
    case 'changes_requested': return '#3B82F6'
    default: return '#64748B'
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface ApprovalDetailProps {
  approval: Approval
  onClose: () => void
  onAction?: (action: 'approve' | 'reject' | 'changes_requested', comment: string) => void
}

export function ApprovalDetail({ approval, onClose, onAction }: ApprovalDetailProps) {
  const [comment, setComment] = useState('')
  const status = statusConfig[approval.status]

  const handleAction = (action: 'approve' | 'reject' | 'changes_requested') => {
    onAction?.(action, comment)
    setComment('')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0A0F1E] border border-white/[0.08] rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 pb-4 bg-[#0A0F1E] border-b border-white/[0.08]">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8]">
                  {typeLabels[approval.objectType] ?? approval.objectType}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${status.bg}`}
                  style={{ color: status.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                  {status.label}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[#F1F5F9]">{approval.objectName}</h2>
              <p className="text-xs text-[#64748B] mt-1">Created {formatDate(approval.createdAt)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Object info */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: approval.requester.color }}
                >
                  {approval.requester.initials}
                </div>
                <div>
                  <span className="text-sm font-medium text-[#F1F5F9]">{approval.requester.name}</span>
                  <span className="text-xs text-[#64748B] ml-2">Requester</span>
                </div>
              </div>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{approval.message}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-[#64748B]">
                <Users className="w-3 h-3" />
                <span className="capitalize">{approval.routing}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{approval.approvers.length} approver{approval.approvers.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Approvers */}
            <div>
              <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3">Approvers</h3>
              <div className="flex flex-col gap-2">
                {approval.approvers.map((a, i) => (
                  <motion.div
                    key={a.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: a.color }}
                    >
                      {a.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#F1F5F9]">{a.name}</span>
                        <span
                          className="text-[10px] font-medium rounded-full px-2 py-0.5"
                          style={{
                            color: decisionColor(a.decision),
                            backgroundColor: decisionColor(a.decision) + '15',
                          }}
                        >
                          {decisionLabel(a.decision)}
                        </span>
                      </div>
                      {a.comment && (
                        <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">{a.comment}</p>
                      )}
                      {a.decidedAt && (
                        <p className="text-[10px] text-[#64748B] mt-1">{formatDate(a.decidedAt)}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3">Timeline</h3>
              <ApprovalTimeline events={approval.timeline} />
            </div>

            {/* Action section (only for pending approvals) */}
            {approval.status === 'pending' && (
              <div className="border-t border-white/[0.08] pt-5">
                <h3 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3">Your Decision</h3>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment with your decision..."
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder-[#64748B] resize-none focus:outline-none focus:border-[#F59E0B]/40 transition-colors"
                />
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleAction('approve')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#10B981] hover:bg-[#059669] transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction('changes_requested')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Request Changes
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#F43F5E] hover:bg-[#E11D48] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
