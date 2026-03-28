'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ShieldCheck, Sparkles } from 'lucide-react'
import { type Approval, mockApprovals } from './_data/mock-approvals'
import { ApprovalCard } from './_components/approval-card'
import { ApprovalDetail } from './_components/approval-detail'
import { ApprovalCreateModal } from './_components/approval-create-modal'

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected' | 'changes_requested'

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'changes_requested', label: 'Changes Requested' },
]

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>(mockApprovals)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const filteredApprovals = useMemo(() => {
    if (activeTab === 'all') return approvals
    return approvals.filter((a) => a.status === activeTab)
  }, [approvals, activeTab])

  const selectedApproval = useMemo(
    () => approvals.find((a) => a.id === selectedId) ?? null,
    [approvals, selectedId]
  )

  const handleCreate = useCallback(
    (data: Omit<Approval, 'id' | 'createdAt' | 'timeline'>) => {
      const now = new Date().toISOString()
      const newApproval: Approval = {
        ...data,
        id: `apr-${String(Date.now()).slice(-6)}`,
        createdAt: now,
        timeline: [
          {
            id: `e-${Date.now()}`,
            action: 'created',
            actor: data.requester.name,
            timestamp: now,
          },
        ],
      }
      setApprovals((prev) => [newApproval, ...prev])
    },
    []
  )

  const handleAction = useCallback(
    (action: 'approve' | 'reject' | 'changes_requested', comment: string) => {
      if (!selectedId) return
      const now = new Date().toISOString()

      setApprovals((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId) return a

          const newStatus =
            action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes_requested'

          const newTimeline = [
            ...a.timeline,
            {
              id: `e-${Date.now()}`,
              action: action === 'approve' ? 'approved' as const : action === 'reject' ? 'rejected' as const : 'changes_requested' as const,
              actor: 'You',
              comment: comment || undefined,
              timestamp: now,
            },
          ]

          return { ...a, status: newStatus, timeline: newTimeline }
        })
      )
      setSelectedId(null)
    },
    [selectedId]
  )

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Approvals</h1>
            <p className="text-xs text-[#64748B]">
              {filteredApprovals.length} request{filteredApprovals.length !== 1 ? 's' : ''}
              {activeTab !== 'all' ? ` (filtered from ${approvals.length})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI: Route approvals
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#F59E0B] hover:bg-[#D97706] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] -mx-1 px-1">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.key
          const count =
            tab.key === 'all'
              ? approvals.length
              : approvals.filter((a) => a.status === tab.key).length

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-[#F59E0B]' : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 text-[10px] ${
                  isActive ? 'text-[#F59E0B]/70' : 'text-[#64748B]/70'
                }`}
              >
                {count}
              </span>
              {isActive && (
                <motion.div
                  layoutId="approvals-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B] rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {filteredApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <p className="text-sm text-[#94A3B8]">No {activeTab === 'all' ? '' : activeTab.replace('_', ' ')} approvals</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredApprovals.map((approval, index) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onClick={() => setSelectedId(approval.id)}
                index={index}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedApproval && (
          <ApprovalDetail
            approval={selectedApproval}
            onClose={() => setSelectedId(null)}
            onAction={handleAction}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <ApprovalCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
