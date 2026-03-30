'use client'

import { motion } from 'framer-motion'
import { Check, X, Clock, MessageSquare, Plus, Eye } from 'lucide-react'
import type { ApprovalEvent } from '../_data/mock-approvals'

const actionConfig: Record<
  string,
  { color: string; bg: string; icon: React.ElementType; label: string }
> = {
  created: { color: '#94A3B8', bg: 'bg-[#94A3B8]/20', icon: Plus, label: 'Created' },
  reviewed: { color: '#3B82F6', bg: 'bg-[#3B82F6]/20', icon: Eye, label: 'Reviewed' },
  approved: { color: '#10B981', bg: 'bg-[#10B981]/20', icon: Check, label: 'Approved' },
  rejected: { color: '#F43F5E', bg: 'bg-[#F43F5E]/20', icon: X, label: 'Rejected' },
  changes_requested: { color: '#3B82F6', bg: 'bg-[#3B82F6]/20', icon: MessageSquare, label: 'Changes Requested' },
  commented: { color: '#94A3B8', bg: 'bg-[#94A3B8]/20', icon: MessageSquare, label: 'Commented' },
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface ApprovalTimelineProps {
  events: ApprovalEvent[]
}

export function ApprovalTimeline({ events }: ApprovalTimelineProps) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/[0.08]" />

      <div className="flex flex-col gap-4">
        {events.map((event, index) => {
          const config = actionConfig[event.action] ?? actionConfig.commented!
          const Icon = config!.icon

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              className="relative flex gap-3"
            >
              {/* Dot */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.08 + 0.1, type: 'spring', stiffness: 300 }}
                className={`absolute -left-6 top-0.5 w-[22px] h-[22px] rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 z-10`}
              >
                <Icon className="w-3 h-3" style={{ color: config.color }} />
              </motion.div>

              {/* Content */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[#F1F5F9]">{event.actor}</span>
                  <span className="text-xs font-medium" style={{ color: config.color }}>
                    {config.label}
                  </span>
                  <span className="text-xs text-[#64748B]">{formatTimestamp(event.timestamp)}</span>
                </div>
                {event.comment && (
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{event.comment}</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
