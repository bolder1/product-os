'use client'

import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useApprovalStore } from '../../../../../lib/approval-store'

export function ApprovalQueue() {
  const requests = useApprovalStore((s) => s.requests)
  const pending = requests.filter((r) => r.status === 'pending')

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-medium tracking-widest uppercase text-[var(--text-tertiary)]">
          Approvals
        </h2>
        {pending.length > 0 && (
          <motion.span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-warning)]/15 text-[var(--color-warning)]"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {pending.length} pending
          </motion.span>
        )}
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
          <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10 l4 4 8-8" stroke="var(--color-success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">No approvals waiting</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1">
          {pending.map((req, i) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 240, damping: 20 }}
              className="p-3 rounded-lg border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/[0.04] cursor-pointer"
              whileHover={{ backgroundColor: 'rgba(232,168,48,0.07)', borderColor: 'rgba(232,168,48,0.35)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] leading-snug font-medium">
                    {req.title}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">
                    Requested by {req.requestedBy.name}
                  </p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-warning)]/15 text-[var(--color-warning)] font-medium flex-shrink-0 capitalize">
                  {req.type}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--text-tertiary)]">
                <Clock size={10} />
                <span>Step {req.currentStepIndex + 1} of {req.steps.length}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
