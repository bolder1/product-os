'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, CheckSquare, Square, Sparkles } from 'lucide-react'

interface ReleaseCreateModalProps {
  open: boolean
  onClose: () => void
  latestVersion: string
}

// Recent modifications that could be included in a release
const recentChanges = [
  { id: 'rc-1', name: 'AI Workflow Engine', type: 'component' },
  { id: 'rc-2', name: 'Task Router API', type: 'api' },
  { id: 'rc-3', name: 'Template Adapter', type: 'component' },
  { id: 'rc-4', name: 'Graph Query Optimizer', type: 'api' },
  { id: 'rc-5', name: 'Design Token Schema Update', type: 'config' },
  { id: 'rc-6', name: 'Dashboard Layout Refresh', type: 'page' },
  { id: 'rc-7', name: 'Publishing Pipeline Fix', type: 'api' },
  { id: 'rc-8', name: 'Sidebar Navigation Update', type: 'component' },
]

function incrementVersion(version: string): string {
  const parts = version.replace('v', '').split('.').map(Number)
  parts[2] = (parts[2] ?? 0) + 1
  return `v${parts.join('.')}`
}

export function ReleaseCreateModal({ open, onClose, latestVersion }: ReleaseCreateModalProps) {
  const suggestedVersion = useMemo(() => incrementVersion(latestVersion), [latestVersion])
  const [version, setVersion] = useState(suggestedVersion)
  const [title, setTitle] = useState('')
  const [selectedChanges, setSelectedChanges] = useState<string[]>([])

  const toggleChange = (id: string) => {
    setSelectedChanges((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedChanges.length === recentChanges.length) {
      setSelectedChanges([])
    } else {
      setSelectedChanges(recentChanges.map((c) => c.id))
    }
  }

  const handleCreate = () => {
    // In a real app this would create the release
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[var(--bg-base)] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[var(--color-success)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">New Release</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--text-tertiary)]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Version */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Version (semver)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--text-primary)] font-mono placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--color-success)]/50 transition-colors"
                    placeholder="v0.0.0"
                  />
                  <button
                    onClick={() => setVersion(suggestedVersion)}
                    className="px-3 py-2 rounded-lg text-[10px] text-[var(--color-success)] bg-[var(--color-success)]/10 hover:bg-[var(--color-success)]/20 border border-[var(--color-success)]/20 transition-colors whitespace-nowrap"
                  >
                    Auto: {suggestedVersion}
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Release Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--color-success)]/50 transition-colors"
                  placeholder="e.g., AI-Powered Workflows"
                />
              </div>

              {/* Changes to include */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    Include Changes ({selectedChanges.length}/{recentChanges.length})
                  </label>
                  <button
                    onClick={toggleAll}
                    className="text-[10px] text-[var(--color-success)] hover:text-[var(--color-success)] transition-colors"
                  >
                    {selectedChanges.length === recentChanges.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="max-h-48 overflow-auto space-y-1 rounded-xl border border-white/[0.06] p-2">
                  {recentChanges.map((change) => {
                    const isSelected = selectedChanges.includes(change.id)
                    return (
                      <button
                        key={change.id}
                        onClick={() => toggleChange(change.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-[var(--color-success)]/10 border border-[var(--color-success)]/20'
                            : 'hover:bg-white/[0.03] border border-transparent'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[var(--color-success)] flex-shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
                        )}
                        <span className="text-xs text-[var(--text-primary)] flex-1">{change.name}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] bg-white/[0.05] px-1.5 py-0.5 rounded">
                          {change.type}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-white/[0.08]">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
                AI: Suggest title
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!version.trim() || !title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-success)] hover:bg-[var(--color-success)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Draft
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
