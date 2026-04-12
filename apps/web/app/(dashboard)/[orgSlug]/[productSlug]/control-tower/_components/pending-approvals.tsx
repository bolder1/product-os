'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { useProduct } from '../../layout'
import { useApprovalStore } from '../../../../../lib/approval-store'

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const fallbackApprovals = [
  { object: 'Component: DataTable', requester: 'Alice', timeAgo: '25m ago' },
  { object: 'Page: Checkout Flow', requester: 'Bob', timeAgo: '1h ago' },
  { object: 'Feature: Notifications', requester: 'Carol', timeAgo: '3h ago' },
]

export function PendingApprovals() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug
  const allRequests = useApprovalStore((s) => s.requests)
  const storeRequests = useMemo(() => allRequests.filter((r) => r.productId === productId), [allRequests, productId])

  const approvals = useMemo(() => {
    const pending = storeRequests.filter((r) => r.status === 'pending')
    if (pending.length > 0) {
      return pending.slice(0, 5).map((r) => ({
        object: r.title,
        requester: r.requestedBy.name,
        timeAgo: timeAgo(r.createdAt),
        id: r.id,
        stepId: r.steps[r.currentStepIndex]?.id,
      }))
    }
    return fallbackApprovals.map((a) => ({ ...a, id: '', stepId: '' }))
  }, [storeRequests])

  const decideStep = useApprovalStore((s) => s.decideStep)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
        <span className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">
          Pending Approvals
        </span>
        <span className="text-xs bg-[#8B5CF6]/10 text-[#8B5CF6] px-2 py-0.5 rounded-full font-medium">
          {approvals.length}
        </span>
      </div>

      <div className="flex-1 space-y-1">
        {approvals.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 + i * 0.08, duration: 0.3 }}
            className="py-3 border-b border-white/[0.04] last:border-0"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F1F5F9] truncate">{item.object}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">
                  Requested by {item.requester} &middot; {item.timeAgo}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-2.5 ml-4">
              <button
                onClick={() => item.id && item.stepId && decideStep(item.id, item.stepId, 'approved', undefined, 'You')}
                className="text-[11px] px-3 py-1 rounded-md bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 transition-colors font-medium"
              >
                Approve
              </button>
              <button className="text-[11px] px-3 py-1 rounded-md bg-white/[0.05] text-[#94A3B8] hover:bg-white/[0.08] transition-colors font-medium">
                Review
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
