'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Diff, ArrowLeft, RotateCcw, Plus, Minus, Pencil } from 'lucide-react'
import { useVersionStore, type Version, type VersionDiff } from '../../lib/version-store'
import type { GraphNode, NodeKind } from '../../lib/graph-store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupByKind<T extends { kind: NodeKind }>(nodes: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {}
  for (const n of nodes) {
    if (!groups[n.kind]) groups[n.kind] = []
    groups[n.kind].push(n)
  }
  return groups
}

function kindLabel(kind: string): string {
  return kind
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface VersionDiffModalProps {
  isOpen: boolean
  onClose: () => void
  version1: Version | null
  version2: Version | null
}

export function VersionDiffModal({ isOpen, onClose, version1, version2 }: VersionDiffModalProps) {
  const { compareVersions, restoreVersion, closePanel } = useVersionStore()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  if (!version1 || !version2) return null

  const diff = compareVersions(version1.id, version2.id)
  if (!diff) return null

  const addedByKind = groupByKind(diff.added)
  const removedByKind = groupByKind(diff.removed)
  const modifiedByKind = groupByKind(diff.modified.map((m) => m.after))

  const totalChanges = diff.added.length + diff.removed.length + diff.modified.length

  function handleRestore(versionId: string) {
    setRestoringId(versionId)
    restoreVersion(versionId)
    setTimeout(() => {
      setRestoringId(null)
      onClose()
    }, 600)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-xl border border-white/[0.08] bg-[#060918] shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.03]">
                  <Diff size={18} className="text-[#8B5CF6]" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#F1F5F9]">Version Diff</h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {totalChanges} change{totalChanges !== 1 ? 's' : ''} between versions
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-[#64748B] hover:text-[#94A3B8]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Version labels */}
            <div className="grid grid-cols-2 gap-4 px-6 py-3 border-b border-white/[0.08] bg-white/[0.01]">
              <div>
                <span className="text-[0.6875rem] uppercase tracking-wider text-[#64748B]">From</span>
                <p className="text-xs text-[#94A3B8] font-medium mt-0.5 truncate">{version1.label}</p>
                <p className="text-[0.625rem] text-[#475569]">
                  {new Date(version1.createdAt).toLocaleString()} &middot; {version1.branchName}
                </p>
              </div>
              <div>
                <span className="text-[0.6875rem] uppercase tracking-wider text-[#64748B]">To</span>
                <p className="text-xs text-[#94A3B8] font-medium mt-0.5 truncate">{version2.label}</p>
                <p className="text-[0.625rem] text-[#475569]">
                  {new Date(version2.createdAt).toLocaleString()} &middot; {version2.branchName}
                </p>
              </div>
            </div>

            {/* Diff body */}
            <div className="overflow-auto max-h-[50vh] px-6 py-4 space-y-4">
              {/* Summary bar */}
              <div className="flex items-center gap-4 text-xs">
                {diff.added.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Plus size={12} />
                    {diff.added.length} added
                  </span>
                )}
                {diff.removed.length > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <Minus size={12} />
                    {diff.removed.length} removed
                  </span>
                )}
                {diff.modified.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Pencil size={12} />
                    {diff.modified.length} modified
                  </span>
                )}
              </div>

              {/* Added nodes */}
              {Object.entries(addedByKind).map(([kind, nodes]) => (
                <div key={`added-${kind}`} className="space-y-1.5">
                  <h3 className="text-[0.6875rem] uppercase tracking-wider text-emerald-400/80 flex items-center gap-1.5">
                    <Plus size={11} />
                    Added {kindLabel(kind)} ({nodes.length})
                  </h3>
                  <div className="space-y-1">
                    {nodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/[0.06] border border-emerald-500/[0.12]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-xs text-emerald-300">{node.label}</span>
                        <span className="text-[0.625rem] text-emerald-500/60 ml-auto">{node.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Removed nodes */}
              {Object.entries(removedByKind).map(([kind, nodes]) => (
                <div key={`removed-${kind}`} className="space-y-1.5">
                  <h3 className="text-[0.6875rem] uppercase tracking-wider text-red-400/80 flex items-center gap-1.5">
                    <Minus size={11} />
                    Removed {kindLabel(kind)} ({nodes.length})
                  </h3>
                  <div className="space-y-1">
                    {nodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/[0.06] border border-red-500/[0.12]"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="text-xs text-red-300 line-through">{node.label}</span>
                        <span className="text-[0.625rem] text-red-500/60 ml-auto">{node.id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Modified nodes */}
              {Object.entries(modifiedByKind).map(([kind, nodes]) => (
                <div key={`modified-${kind}`} className="space-y-1.5">
                  <h3 className="text-[0.6875rem] uppercase tracking-wider text-amber-400/80 flex items-center gap-1.5">
                    <Pencil size={11} />
                    Modified {kindLabel(kind)} ({nodes.length})
                  </h3>
                  <div className="space-y-1">
                    {nodes.map((node) => {
                      const before = diff.modified.find((m) => m.after.id === node.id)?.before
                      return (
                        <div
                          key={node.id}
                          className="px-3 py-1.5 rounded-md bg-amber-500/[0.06] border border-amber-500/[0.12]"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="text-xs text-amber-300">{node.label}</span>
                            {before && before.label !== node.label && (
                              <span className="text-[0.625rem] text-amber-500/60">
                                (was: {before.label})
                              </span>
                            )}
                            <span className="text-[0.625rem] text-amber-500/60 ml-auto">{node.id}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {totalChanges === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Diff size={32} className="text-[#475569] mb-3" />
                  <p className="text-sm text-[#64748B]">No differences found</p>
                  <p className="text-xs text-[#475569] mt-1">These versions are identical</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.08] bg-white/[0.01]">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={() => handleRestore(version2.id)}
                disabled={restoringId !== null}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
              >
                <RotateCcw size={14} />
                {restoringId ? 'Restoring...' : 'Restore This Version'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
