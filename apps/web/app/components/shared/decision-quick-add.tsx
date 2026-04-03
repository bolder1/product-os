'use client'

import { useState, useCallback } from 'react'
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
      <button
        onClick={() => setOpen(!open)}
        className="tool-btn flex items-center gap-1.5"
      >
        <Scale size={12} />
        <span className="text-[11px]">Log Decision</span>
      </button>

      {/* Quick form */}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-xl z-50 p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Scale size={12} className="text-[var(--accent-text)]" />
              <span className="text-[13px] font-medium text-[var(--text-primary)]">
                Quick Decision
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-0.5 rounded hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
            >
              <X size={13} />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What was decided?"
                className="tool-input w-full"
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1 block">
                Rationale
              </label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why was this decision made?"
                rows={2}
                className="tool-input w-full resize-none"
              />
            </div>

            {/* Studio indicator */}
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
              <span className="tool-badge capitalize">
                {studio}
              </span>
              {linkedEntity && (
                <>
                  <span>&rarr;</span>
                  <span className="tool-badge truncate max-w-[120px]">
                    {linkedEntity.label}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="tool-btn-primary w-full flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={12} />
              Log Decision
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
