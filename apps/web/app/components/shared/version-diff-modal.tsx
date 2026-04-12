'use client'

import { useState } from 'react'
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

  if (!isOpen || !version1 || !version2) return null

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[80vh] overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2.5">
            <Diff size={15} className="text-[var(--accent-text)]" />
            <div>
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Version Diff</h2>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                {totalChanges} change{totalChanges !== 1 ? 's' : ''} between versions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--surface-hover)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Version labels */}
        <div className="grid grid-cols-2 gap-4 px-4 py-2.5 border-b border-[var(--border-default)]">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">From</span>
            <p className="text-[12px] text-[var(--text-primary)] font-medium mt-0.5 truncate">{version1.label}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">
              {new Date(version1.createdAt).toLocaleString()} &middot; {version1.branchName}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">To</span>
            <p className="text-[12px] text-[var(--text-primary)] font-medium mt-0.5 truncate">{version2.label}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">
              {new Date(version2.createdAt).toLocaleString()} &middot; {version2.branchName}
            </p>
          </div>
        </div>

        {/* Diff body */}
        <div className="overflow-auto max-h-[50vh] px-4 py-3 space-y-3">
          {/* Summary bar */}
          <div className="flex items-center gap-4 text-[11px]">
            {diff.added.length > 0 && (
              <span className="flex items-center gap-1 text-emerald-400">
                <Plus size={11} />
                {diff.added.length} added
              </span>
            )}
            {diff.removed.length > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <Minus size={11} />
                {diff.removed.length} removed
              </span>
            )}
            {diff.modified.length > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Pencil size={11} />
                {diff.modified.length} modified
              </span>
            )}
          </div>

          {/* Added nodes */}
          {Object.entries(addedByKind).map(([kind, nodes]) => (
            <div key={`added-${kind}`} className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-wider text-emerald-400/80 flex items-center gap-1.5">
                <Plus size={10} />
                Added {kindLabel(kind)} ({nodes.length})
              </h3>
              <div className="space-y-0.5">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded border border-emerald-500/[0.12] bg-emerald-500/[0.04]"
                  >
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-emerald-300">{node.label}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] ml-auto font-mono">{node.id}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Removed nodes */}
          {Object.entries(removedByKind).map(([kind, nodes]) => (
            <div key={`removed-${kind}`} className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-wider text-red-400/80 flex items-center gap-1.5">
                <Minus size={10} />
                Removed {kindLabel(kind)} ({nodes.length})
              </h3>
              <div className="space-y-0.5">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded border border-red-500/[0.12] bg-red-500/[0.04]"
                  >
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                    <span className="text-[11px] text-red-300 line-through">{node.label}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] ml-auto font-mono">{node.id}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Modified nodes */}
          {Object.entries(modifiedByKind).map(([kind, nodes]) => (
            <div key={`modified-${kind}`} className="space-y-1">
              <h3 className="text-[10px] uppercase tracking-wider text-amber-400/80 flex items-center gap-1.5">
                <Pencil size={10} />
                Modified {kindLabel(kind)} ({nodes.length})
              </h3>
              <div className="space-y-0.5">
                {nodes.map((node) => {
                  const before = diff.modified.find((m) => m.after.id === node.id)?.before
                  return (
                    <div
                      key={node.id}
                      className="px-2.5 py-1 rounded border border-amber-500/[0.12] bg-amber-500/[0.04]"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-amber-400" />
                        <span className="text-[11px] text-amber-300">{node.label}</span>
                        {before && before.label !== node.label && (
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            (was: {before.label})
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--text-tertiary)] ml-auto font-mono">{node.id}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {totalChanges === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Diff size={28} className="text-[var(--text-tertiary)] mb-2" />
              <p className="text-[12px] text-[var(--text-secondary)]">No differences found</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">These versions are identical</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-default)] bg-[var(--bg-elevated)]">
          <button
            onClick={onClose}
            className="tool-btn flex items-center gap-1.5"
          >
            <ArrowLeft size={12} />
            Back
          </button>
          <button
            onClick={() => handleRestore(version2.id)}
            disabled={restoringId !== null}
            className="tool-btn-primary flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw size={12} />
            {restoringId ? 'Restoring...' : 'Restore This Version'}
          </button>
        </div>
      </div>
    </div>
  )
}
