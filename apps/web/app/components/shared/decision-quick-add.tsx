'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Plus, X } from 'lucide-react'
import { useDecisionStore } from '../../lib/decision-store'

// ---------------------------------------------------------------------------
// Decision Quick-Add — compact floating widget for any studio
// ---------------------------------------------------------------------------

interface DecisionQuickAddProps {
  productId: string
  studio: string
  /** Optionally link to the current entity being viewed */
  linkedEntity?: { id: string; type: string; label: string }
}

export function DecisionQuickAdd({
  productId,
  studio,
  linkedEntity,
}: DecisionQuickAddProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [rationale, setRationale] = useState('')

  const addDecision = useDecisionStore((s) => s.addDecision)

  const handleSubmit = useCallback(() => {
    const trimmedTitle = title.trim()
    const trimmedRationale = rationale.trim()
    if (!trimmedTitle) return

    addDecision({
      productId,
      title: trimmedTitle,
      rationale: trimmedRationale,
      alternatives: [],
      studio,
      tags: [],
      relatedEntities: linkedEntity ? [linkedEntity] : [],
    })

    setTitle('')
    setRationale('')
    setOpen(false)
  }, [title, rationale, productId, studio, linkedEntity, addDecision])

  return (
    <div className="relative">
      {/* Trigger button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#F59E0B] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 transition-colors"
      >
        <Scale size={13} />
        Log Decision
      </motion.button>

      {/* Quick form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-[#0A0F1E] border border-white/[0.08] rounded-xl shadow-2xl z-50 p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                  <Scale size={13} className="text-[#F59E0B]" />
                </div>
                <span className="text-sm font-medium text-[#F1F5F9]">
                  Quick Decision
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md hover:bg-white/[0.06] text-[#64748B]"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What was decided?"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#F59E0B]/40 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">
                  Rationale
                </label>
                <textarea
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Why was this decision made?"
                  rows={2}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#F59E0B]/40 transition-colors resize-none"
                />
              </div>

              {/* Studio indicator */}
              <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[#94A3B8] capitalize">
                  {studio}
                </span>
                {linkedEntity && (
                  <>
                    <span>&rarr;</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[#94A3B8] truncate max-w-[120px]">
                      {linkedEntity.label}
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={14} />
                Log Decision
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
