'use client'

/**
 * ApprovalsGate — inline approval widget usable in any workspace.
 *
 * Shows the current approval state of an entity and allows
 * approvers to approve/reject directly in-context.
 *
 * Usage:
 *   <ApprovalsGate entityId={nodeId} entityLabel="Feature X" productId={productId} />
 */

import { useMemo, useCallback } from 'react'
import { useApprovalStore, type ApprovalRequest } from '../../lib/approval-store'
import { useAuthStore } from '../../lib/auth-store'
import { eventBus, makeActor } from '../../lib/event-bus'
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'none'

interface ApprovalsGateProps {
  entityId: string
  entityLabel: string
  productId: string
  /** If compact, shows a small badge instead of full card */
  compact?: boolean
  /** Called after decision is made */
  onDecision?: (decision: 'approved' | 'rejected') => void
}

const STATUS_CONFIG: Record<ApprovalStatus, { icon: React.ReactNode; label: string; color: string }> = {
  none:      { icon: <Clock size={12} />,        label: 'No approval',  color: 'text-[var(--text-tertiary)]' },
  pending:   { icon: <AlertCircle size={12} />,  label: 'Pending',      color: 'text-[var(--color-warning)]' },
  approved:  { icon: <CheckCircle2 size={12} />, label: 'Approved',     color: 'text-[var(--color-success)]' },
  rejected:  { icon: <XCircle size={12} />,      label: 'Rejected',     color: 'text-[var(--color-error)]' },
  cancelled: { icon: <XCircle size={12} />,      label: 'Cancelled',    color: 'text-[var(--text-tertiary)]' },
}

export function ApprovalsGate({ entityId, entityLabel, productId, compact, onDecision }: ApprovalsGateProps) {
  const requests = useApprovalStore((s) => s.requests)
  const decideStep = useApprovalStore((s) => s.decideStep)
  const userId = useAuthStore((s) => s.user?.id ?? 'anon')
  const userName = useAuthStore((s) => s.user?.name ?? 'Unknown')
  const userRole = useAuthStore((s) => s.user?.role ?? 'viewer')

  const approval = useMemo(
    () => requests.find((r) => r.entityId === entityId && r.productId === productId),
    [requests, entityId, productId]
  )

  const status: ApprovalStatus = approval ? approval.status as ApprovalStatus : 'none'
  const { icon, label, color } = STATUS_CONFIG[status]
  const canDecide = ['admin', 'manager'].includes(userRole) && status === 'pending'

  const handleDecision = useCallback((decision: 'approved' | 'rejected') => {
    if (!approval) return
    // Decide the current active step
    const currentStep = approval.steps[approval.currentStepIndex]
    if (currentStep) {
      decideStep(approval.id, currentStep.id, decision, undefined, userName)
    }

    eventBus.emit({
      type: 'approval.decided',
      productId,
      approvalId: approval.id,
      entityId,
      entityLabel,
      decision,
      actor: makeActor(userId, userName),
    })

    onDecision?.(decision)
  }, [approval, decideStep, userId, userName, productId, entityId, entityLabel, onDecision])

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] ${color}`} title={label}>
        {icon}
        <span>{label}</span>
      </span>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] p-3 flex items-center gap-3">
      <span className={color}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-[var(--text-primary)]">Approval</p>
        <p className={`text-[11px] ${color}`}>{label}</p>
        {approval?.steps[approval.currentStepIndex]?.approverName && (
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">by {approval.steps[approval.currentStepIndex].approverName}</p>
        )}
      </div>
      {canDecide && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleDecision('approved')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 transition-colors"
            aria-label="Approve"
          >
            <CheckCircle2 size={11} />
            Approve
          </button>
          <button
            onClick={() => handleDecision('rejected')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20 transition-colors"
            aria-label="Reject"
          >
            <XCircle size={11} />
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
