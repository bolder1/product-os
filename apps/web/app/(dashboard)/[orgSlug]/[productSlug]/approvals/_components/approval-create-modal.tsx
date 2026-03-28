'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, ChevronDown } from 'lucide-react'
import { mockGraphNodes, mockTeamMembers } from '../_data/mock-approvals'
import type { Approval } from '../_data/mock-approvals'

interface ApprovalCreateModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: Omit<Approval, 'id' | 'createdAt' | 'timeline'>) => void
}

export function ApprovalCreateModal({ open, onClose, onCreate }: ApprovalCreateModalProps) {
  const [selectedNode, setSelectedNode] = useState('')
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([])
  const [routing, setRouting] = useState<'sequential' | 'parallel'>('parallel')
  const [message, setMessage] = useState('')
  const [nodeDropdownOpen, setNodeDropdownOpen] = useState(false)
  const [approverDropdownOpen, setApproverDropdownOpen] = useState(false)

  const handleSubmit = () => {
    const node = mockGraphNodes.find((n) => n.id === selectedNode)
    if (!node || selectedApprovers.length === 0) return

    const approvers = selectedApprovers.map((id) => {
      const member = mockTeamMembers.find((m) => m.id === id)!
      return {
        name: member.name,
        initials: member.initials,
        color: member.color,
        decision: 'pending' as const,
      }
    })

    onCreate({
      objectName: node.name,
      objectType: node.type as Approval['objectType'],
      status: 'pending',
      requester: { name: 'Surajit Das', initials: 'SD', color: '#8B5CF6' },
      approvers,
      routing,
      message,
    })

    // Reset
    setSelectedNode('')
    setSelectedApprovers([])
    setRouting('parallel')
    setMessage('')
    onClose()
  }

  const toggleApprover = (id: string) => {
    setSelectedApprovers((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const selectedNodeObj = mockGraphNodes.find((n) => n.id === selectedNode)
  const isValid = selectedNode && selectedApprovers.length > 0

  return (
    <AnimatePresence>
      {open && (
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
            className="relative w-full max-w-lg bg-[#0A0F1E] border border-white/[0.08] rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-semibold text-[#F1F5F9]">New Approval Request</h2>
                <p className="text-xs text-[#64748B] mt-0.5">Submit an object for review</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Object selector */}
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-2">Object</label>
                <div className="relative">
                  <button
                    onClick={() => setNodeDropdownOpen(!nodeDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-[#F1F5F9] hover:border-white/[0.15] transition-colors"
                  >
                    <span className={selectedNodeObj ? 'text-[#F1F5F9]' : 'text-[#64748B]'}>
                      {selectedNodeObj ? selectedNodeObj.name : 'Select an object...'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform ${nodeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {nodeDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-20 w-full mt-1 bg-[#0D1225] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden"
                      >
                        {mockGraphNodes.map((node) => (
                          <button
                            key={node.id}
                            onClick={() => {
                              setSelectedNode(node.id)
                              setNodeDropdownOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors ${
                              selectedNode === node.id ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'text-[#F1F5F9]'
                            }`}
                          >
                            <span className="flex-1 text-left">{node.name}</span>
                            <span className="text-[10px] uppercase tracking-wider text-[#64748B]">{node.type}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Approvers multi-select */}
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-2">
                  Approvers ({selectedApprovers.length} selected)
                </label>
                <div className="relative">
                  <button
                    onClick={() => setApproverDropdownOpen(!approverDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm hover:border-white/[0.15] transition-colors"
                  >
                    {selectedApprovers.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedApprovers.map((id) => {
                          const m = mockTeamMembers.find((tm) => tm.id === id)!
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: m.color + '20', color: m.color }}
                            >
                              {m.initials}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-[#64748B]">Select approvers...</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-[#64748B] transition-transform flex-shrink-0 ml-2 ${approverDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {approverDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute z-20 w-full mt-1 bg-[#0D1225] border border-white/[0.08] rounded-xl shadow-xl overflow-hidden"
                      >
                        {mockTeamMembers.map((member) => {
                          const selected = selectedApprovers.includes(member.id)
                          return (
                            <button
                              key={member.id}
                              onClick={() => toggleApprover(member.id)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.05] transition-colors ${
                                selected ? 'bg-[#F59E0B]/5' : ''
                              }`}
                            >
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                                style={{ backgroundColor: member.color }}
                              >
                                {member.initials}
                              </div>
                              <span className="flex-1 text-left text-[#F1F5F9]">{member.name}</span>
                              {selected && <Check className="w-3.5 h-3.5 text-[#F59E0B]" />}
                            </button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Routing type */}
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-2">Routing</label>
                <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
                  <button
                    onClick={() => setRouting('parallel')}
                    className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                      routing === 'parallel'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        : 'text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    Parallel
                  </button>
                  <button
                    onClick={() => setRouting('sequential')}
                    className={`flex-1 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                      routing === 'sequential'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        : 'text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    Sequential
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what needs approval and any context..."
                  rows={3}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#F1F5F9] placeholder-[#64748B] resize-none focus:outline-none focus:border-[#F59E0B]/40 transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isValid
                    ? 'bg-[#F59E0B] hover:bg-[#D97706] text-white cursor-pointer'
                    : 'bg-white/[0.06] text-[#64748B] cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                Submit Request
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
