'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, X, ArrowRight } from 'lucide-react'
import type { ElementDef } from '../_data/mock-screens'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ExtractComponentModalProps {
  open: boolean
  onClose: () => void
  selectedElements: ElementDef[]
  onExtract: (name: string, category: string) => void
}

const CATEGORIES = ['Layout', 'Form', 'Data', 'Feedback', 'Navigation'] as const

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function ExtractComponentModal({ open, onClose, selectedElements, onExtract }: ExtractComponentModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('Layout')
  const [extracting, setExtracting] = useState(false)

  // Infer a default name from elements
  const inferredName = selectedElements.length === 1
    ? `${selectedElements[0].type}Component`
    : `Group_${selectedElements.length}`

  const handleExtract = async () => {
    const finalName = name.trim() || inferredName
    setExtracting(true)
    await onExtract(finalName, category)
    setExtracting(false)
    setName('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[380px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-[13px] font-medium text-[var(--text-primary)]">Extract to Component</span>
              </div>
              <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-elevated)] transition-colors">
                <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-4">
              {/* Selection summary */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                <div className="flex items-center gap-1">
                  {selectedElements.slice(0, 3).map((el) => (
                    <span
                      key={el.id}
                      className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[var(--accent)]/10 text-[var(--accent)]"
                    >
                      {el.type}
                    </span>
                  ))}
                  {selectedElements.length > 3 && (
                    <span className="text-[9px] text-[var(--text-tertiary)]">+{selectedElements.length - 3} more</span>
                  )}
                </div>
                <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)]" />
                <Box className="w-3.5 h-3.5 text-[var(--accent)]" />
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Component Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={inferredName}
                  className="w-full h-8 px-2.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/40"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Category
                </label>
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        category === cat
                          ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
                This will create a new component in the Component Builder with {selectedElements.length} element{selectedElements.length !== 1 ? 's' : ''}.
                The original elements will be replaced with a component instance reference.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-default)] bg-[var(--bg-elevated)]/50">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-md text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="px-3 py-1.5 rounded-md text-[11px] font-medium bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent)]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {extracting ? 'Extracting...' : 'Extract Component'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
