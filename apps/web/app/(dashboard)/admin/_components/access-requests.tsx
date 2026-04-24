'use client'

import { motion } from 'framer-motion'
import {
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from 'lucide-react'
import { useState } from 'react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

interface AccessRequest {
  id: string
  userName: string
  avatar: string
  currentRole: string
  currentRoleColor: string
  requestedStudio: string
  reason: string
  timestamp: string
}

interface PastDecision {
  id: string
  userName: string
  avatar: string
  requestedStudio: string
  decision: 'approved' | 'denied'
  decidedBy: string
  timestamp: string
}

const pendingRequests: AccessRequest[] = [
  {
    id: 'r1',
    userName: 'Alex Chen',
    avatar: 'AC',
    currentRole: 'Frontend Dev',
    currentRoleColor: '#06B6D4',
    requestedStudio: 'Design Studio',
    reason: 'Need access to review design tokens and component specs for the new dashboard implementation.',
    timestamp: '2 hours ago',
  },
  {
    id: 'r2',
    userName: 'Priya Patel',
    avatar: 'PP',
    currentRole: 'Product Designer',
    currentRoleColor: '#EC4899',
    requestedStudio: 'Code Studio',
    reason: 'Want to preview generated code for my component designs and check code quality.',
    timestamp: '5 hours ago',
  },
  {
    id: 'r3',
    userName: 'David Lee',
    avatar: 'DL',
    currentRole: 'Business Analyst',
    currentRoleColor: '#8B5CF6',
    requestedStudio: 'Releases',
    reason: 'Need to track release timelines for quarterly business review and stakeholder reports.',
    timestamp: '1 day ago',
  },
  {
    id: 'r4',
    userName: 'Emma Wilson',
    avatar: 'EW',
    currentRole: 'QA Engineer',
    currentRoleColor: '#F59E0B',
    requestedStudio: 'Workflow Studio',
    reason: 'Reviewing automated workflow triggers to set up test automation pipelines.',
    timestamp: '2 days ago',
  },
]

const pastDecisions: PastDecision[] = [
  {
    id: 'p1',
    userName: 'Mike Johnson',
    avatar: 'MJ',
    requestedStudio: 'Analytics',
    decision: 'approved',
    decidedBy: 'Surajit Das',
    timestamp: '3 days ago',
  },
  {
    id: 'p2',
    userName: 'Sarah Kim',
    avatar: 'SK',
    requestedStudio: 'Admin Panel',
    decision: 'denied',
    decidedBy: 'Surajit Das',
    timestamp: '5 days ago',
  },
  {
    id: 'p3',
    userName: 'Olivia Brown',
    avatar: 'OB',
    requestedStudio: 'Brand Studio',
    decision: 'approved',
    decidedBy: 'Sarah Kim',
    timestamp: '1 week ago',
  },
]

export default function AccessRequests() {
  const [showHistory, setShowHistory] = useState(false)

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      {/* Header with bulk action */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeUp}
        custom={0}
      >
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Pending Requests</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{pendingRequests.length} requests awaiting review</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm hover:bg-emerald-500/20 transition">
          <Check className="w-4 h-4" />
          Approve All
        </button>
      </motion.div>

      {/* Pending request cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pendingRequests.map((request, i) => (
          <motion.div
            key={request.id}
            className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-all"
            variants={fadeUp}
            custom={i + 1}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: `${request.currentRoleColor}40` }}
                >
                  {request.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{request.userName}</div>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${request.currentRoleColor}15`,
                      color: request.currentRoleColor,
                    }}
                  >
                    {request.currentRole}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                <Clock className="w-3 h-3" />
                {request.timestamp}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-[var(--text-tertiary)] mb-1">Requesting access to</div>
              <span className="text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-lg">
                {request.requestedStudio}
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 line-clamp-2">
              &ldquo;{request.reason}&rdquo;
            </p>

            <div className="flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition">
                <Check className="w-4 h-4" />
                Approve
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm font-medium hover:bg-rose-500/20 transition">
                <X className="w-4 h-4" />
                Deny
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Past decisions */}
      <motion.div variants={fadeUp} custom={5}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition mb-3"
        >
          <motion.div animate={{ rotate: showHistory ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
          Past Decisions ({pastDecisions.length})
        </button>

        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            {pastDecisions.map((decision, i) => (
              <div
                key={decision.id}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  i < pastDecisions.length - 1 ? 'border-b border-white/[0.04]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
                    {decision.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--text-primary)]">{decision.userName}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">requested</span>
                      <span className="text-sm text-[var(--accent)]">{decision.requestedStudio}</span>
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      by {decision.decidedBy} &middot; {decision.timestamp}
                    </div>
                  </div>
                </div>
                <div>
                  {decision.decision === 'approved' ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Approved
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full">
                      <XCircle className="w-3 h-3" />
                      Denied
                    </span>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
