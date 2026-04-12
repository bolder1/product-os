'use client'

import { useState, useMemo } from 'react'
import {
  X,
  GitBranch,
  GitCommit,
  GitMerge,
  Clock,
  Plus,
  Diff,
  RotateCcw,
  History,
  ChevronDown,
} from 'lucide-react'
import {
  useVersionStore,
  type Version,
  type Branch,
} from '../../lib/version-store'
import { VersionDiffModal } from './version-diff-modal'
import { BranchGraph, MergePreview } from './branch-graph'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BranchPill({ name, isActive }: { name: string; isActive: boolean }) {
  const colors: Record<string, string> = {
    main: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    develop: 'bg-[var(--accent)]/20 text-[var(--accent-text)] border-[var(--accent)]/30',
    staging: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }
  const color = colors[name] || 'bg-purple-500/20 text-purple-400 border-purple-500/30'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-medium border ${color} ${
        isActive ? 'ring-1 ring-white/20' : ''
      }`}
    >
      <GitBranch size={10} />
      {name}
    </span>
  )
}

function TimelineEntry({
  version,
  isFirst,
  isLast,
  onViewDiff,
  onRestore,
  onCreateBranch,
  activeBranch,
}: {
  version: Version
  isFirst: boolean
  isLast: boolean
  onViewDiff: (version: Version) => void
  onRestore: (version: Version) => void
  onCreateBranch: (version: Version) => void
  activeBranch: string
}) {
  const isBranch = version.label.startsWith('Branch:')
  const isMerge = version.label.startsWith('Merge:')
  const isOnActiveBranch = version.branchName === activeBranch

  const Icon = isMerge ? GitMerge : isBranch ? GitBranch : GitCommit
  const iconColor = isMerge
    ? 'text-amber-400'
    : isBranch
    ? 'text-purple-400'
    : 'text-[var(--accent-text)]'

  const relativeTime = getRelativeTime(version.createdAt)

  return (
    <div className="relative flex gap-3 group">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-6 h-6 rounded-sm flex items-center justify-center border ${
            isFirst
              ? 'bg-[var(--accent)]/20 border-[var(--accent)]/40'
              : 'bg-[var(--bg-inset)] border-[var(--border-default)]'
          } z-10`}
        >
          <Icon size={12} className={isFirst ? 'text-[var(--accent-text)]' : iconColor} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-[var(--border-subtle)] min-h-[24px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 -mt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{version.label}</p>
            {version.description && (
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 line-clamp-2">
                {version.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <BranchPill name={version.branchName} isActive={isOnActiveBranch} />
              <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                <Clock size={9} />
                {relativeTime}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]">
                by {version.createdBy.name}
              </span>
            </div>
          </div>
        </div>

        {/* Actions -- visible on hover */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onViewDiff(version)}
            className="tool-btn flex items-center gap-1 text-[10px]"
          >
            <Diff size={11} />
            Diff
          </button>
          <button
            onClick={() => onRestore(version)}
            className="tool-btn flex items-center gap-1 text-[10px]"
          >
            <RotateCcw size={11} />
            Restore
          </button>
          <button
            onClick={() => onCreateBranch(version)}
            className="tool-btn flex items-center gap-1 text-[10px]"
          >
            <GitBranch size={11} />
            Branch
          </button>
        </div>
      </div>
    </div>
  )
}

function getRelativeTime(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Create Version dialog (inline)
// ---------------------------------------------------------------------------

function CreateVersionInline({
  onSubmit,
  onCancel,
}: {
  onSubmit: (label: string, description: string) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')

  return (
    <div className="px-3 py-3 border-b border-[var(--border-default)] space-y-2">
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Version label (e.g. v0.1.0)"
        autoFocus
        className="tool-input w-full py-1.5 text-[12px]"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="tool-input w-full py-1.5 text-[12px] resize-none"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="tool-btn px-3 py-1 text-[11px]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (label.trim()) {
              onSubmit(label.trim(), description.trim())
            }
          }}
          disabled={!label.trim()}
          className="tool-btn-primary px-3 py-1 text-[11px] disabled:opacity-40"
        >
          Create Version
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create Branch dialog (inline)
// ---------------------------------------------------------------------------

function CreateBranchInline({
  onSubmit,
  onCancel,
}: {
  onSubmit: (name: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')

  return (
    <div className="px-3 py-3 border-b border-[var(--border-default)] space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value.replace(/\s+/g, '-').toLowerCase())}
        placeholder="Branch name (e.g. feature/auth)"
        autoFocus
        className="tool-input w-full py-1.5 text-[12px]"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="tool-btn px-3 py-1 text-[11px]"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (name.trim()) onSubmit(name.trim())
          }}
          disabled={!name.trim()}
          className="tool-btn-primary px-3 py-1 text-[11px] disabled:opacity-40"
        >
          Create Branch
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

interface VersionHistoryPanelProps {
  productId: string
}

export function VersionHistoryPanel({ productId }: VersionHistoryPanelProps) {
  const isPanelOpen = useVersionStore((s) => s.isPanelOpen)
  const closePanel = useVersionStore((s) => s.closePanel)
  const storeSetActiveBranch = useVersionStore((s) => s.setActiveBranch)
  const storeCreateVersion = useVersionStore((s) => s.createVersion)
  const storeCreateBranch = useVersionStore((s) => s.createBranch)
  const storeMergeBranch = useVersionStore((s) => s.mergeBranch)
  const storeRestoreVersion = useVersionStore((s) => s.restoreVersion)
  const allVersions = useVersionStore((s) => s.versions)
  const allBranches = useVersionStore((s) => s.branches)
  const activeBranchMap = useVersionStore((s) => s.activeBranches)

  const versions = useMemo(
    () => allVersions
      .filter((v) => v.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allVersions, productId]
  )
  const branches = useMemo(
    () => allBranches.filter((b) => b.productId === productId),
    [allBranches, productId]
  )
  const activeBranch = activeBranchMap[productId] || 'main'

  const [showCreateVersion, setShowCreateVersion] = useState(false)
  const [showCreateBranch, setShowCreateBranch] = useState(false)
  const [branchSourceVersion, setBranchSourceVersion] = useState<Version | null>(null)
  const [showBranchSelector, setShowBranchSelector] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'graph'>('timeline')
  const [mergingBranch, setMergingBranch] = useState<Branch | null>(null)

  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffVersion, setDiffVersion] = useState<Version | null>(null)

  const diffParentVersion = useMemo(() => {
    if (!diffVersion?.parentId) return null
    return versions.find((v) => v.id === diffVersion.parentId) ?? null
  }, [diffVersion, versions])

  const activeBranches = branches.filter((b) => b.status === 'active')
  const mergedBranches = branches.filter((b) => b.status === 'merged')

  const filteredVersions = versions.filter((v) => v.branchName === activeBranch)

  function handleCreateVersion(label: string, description: string) {
    storeCreateVersion(productId, label, description)
    setShowCreateVersion(false)
  }

  function handleCreateBranch(name: string) {
    const sourceVersion = branchSourceVersion ?? filteredVersions[0]
    if (sourceVersion) {
      storeCreateBranch(name, sourceVersion.id)
    }
    setShowCreateBranch(false)
    setBranchSourceVersion(null)
  }

  function handleViewDiff(version: Version) {
    setDiffVersion(version)
    setDiffModalOpen(true)
  }

  function handleRestore(version: Version) {
    storeRestoreVersion(version.id)
  }

  function handleBranchFromVersion(version: Version) {
    setBranchSourceVersion(version)
    setShowCreateBranch(true)
  }

  function handleMergeBranch(branch: Branch) {
    setMergingBranch(branch)
  }

  function confirmMerge() {
    if (!mergingBranch) return
    const mainVersions = versions
      .filter((v) => v.branchName === 'main')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (mainVersions.length > 0) {
      storeMergeBranch(mergingBranch.id, mainVersions[0].id)
    }
    setMergingBranch(null)
  }

  if (!isPanelOpen) return (
    <VersionDiffModal
      isOpen={diffModalOpen}
      onClose={() => {
        setDiffModalOpen(false)
        setDiffVersion(null)
      }}
      version1={diffParentVersion}
      version2={diffVersion}
    />
  )

  return (
    <>
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-[380px] flex flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)]"
      >
        {/* Header */}
        <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            <History size={13} className="text-[var(--accent-text)]" />
            <h2 className="text-[13px] font-medium text-[var(--text-primary)]">Version History</h2>
          </div>
          <button
            onClick={closePanel}
            className="tool-btn p-1"
          >
            <X size={13} className="text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Active branch indicator */}
        <div className="px-3 py-2 border-b border-[var(--border-default)] bg-[var(--bg-inset)]">
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setShowBranchSelector(!showBranchSelector)}
                className="tool-btn flex items-center gap-2 px-2 py-1"
              >
                <GitBranch size={12} className="text-[var(--accent-text)]" />
                <span className="text-[11px] font-medium text-[var(--text-primary)]">{activeBranch}</span>
                <ChevronDown size={11} className="text-[var(--text-tertiary)]" />
              </button>

              {/* Branch selector dropdown */}
              {showBranchSelector && (
                <div
                  className="absolute top-full left-0 mt-1 w-52 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xl z-20"
                >
                  <div className="p-1">
                    <button
                      onClick={() => {
                        storeSetActiveBranch(productId, 'main')
                        setShowBranchSelector(false)
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-sm text-[12px] transition-colors ${
                        activeBranch === 'main'
                          ? 'bg-[var(--accent)]/10 text-[var(--accent-text)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <GitBranch size={12} />
                      main
                    </button>
                    {activeBranches.map((branch) => (
                      <div key={branch.id} className="flex items-center">
                        <button
                          onClick={() => {
                            storeSetActiveBranch(productId, branch.name)
                            setShowBranchSelector(false)
                          }}
                          className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-sm text-[12px] transition-colors ${
                            activeBranch === branch.name
                              ? 'bg-[var(--accent)]/10 text-[var(--accent-text)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                          }`}
                        >
                          <GitBranch size={12} />
                          {branch.name}
                        </button>
                        <button
                          onClick={() => {
                            handleMergeBranch(branch)
                            setShowBranchSelector(false)
                          }}
                          title="Merge into main"
                          className="tool-btn p-1"
                        >
                          <GitMerge size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {mergedBranches.length > 0 && (
                    <div className="border-t border-[var(--border-default)] p-1">
                      <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                        Merged
                      </p>
                      {mergedBranches.map((branch) => (
                        <div
                          key={branch.id}
                          className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--text-tertiary)]"
                        >
                          <GitMerge size={12} />
                          {branch.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setShowCreateVersion(true)
                  setShowCreateBranch(false)
                }}
                className="tool-btn flex items-center gap-1 px-2 py-1 text-[11px]"
              >
                <Plus size={11} />
                Version
              </button>
              <button
                onClick={() => {
                  setShowCreateBranch(true)
                  setShowCreateVersion(false)
                  setBranchSourceVersion(null)
                }}
                className="tool-btn flex items-center gap-1 px-2 py-1 text-[11px]"
              >
                <GitBranch size={11} />
                Branch
              </button>
            </div>
          </div>
        </div>

        {/* Create forms */}
        {showCreateVersion && (
          <CreateVersionInline
            onSubmit={handleCreateVersion}
            onCancel={() => setShowCreateVersion(false)}
          />
        )}
        {showCreateBranch && (
          <CreateBranchInline
            onSubmit={handleCreateBranch}
            onCancel={() => {
              setShowCreateBranch(false)
              setBranchSourceVersion(null)
            }}
          />
        )}

        {/* View mode toggle */}
        <div className="tool-tabs flex items-center gap-1 px-3 py-2 border-b border-[var(--border-default)]">
          <button
            onClick={() => setViewMode('timeline')}
            className={`tool-tab flex items-center gap-1 px-2.5 py-1 text-[11px] ${
              viewMode === 'timeline' ? 'active' : ''
            }`}
          >
            <Clock size={11} />
            Timeline
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`tool-tab flex items-center gap-1 px-2.5 py-1 text-[11px] ${
              viewMode === 'graph' ? 'active' : ''
            }`}
          >
            <GitBranch size={11} />
            Graph
          </button>
        </div>

        {/* Merge preview overlay */}
        {mergingBranch && (
          <div className="px-3 py-3">
            <MergePreview
              sourceBranch={mergingBranch}
              versions={versions}
              onConfirmMerge={confirmMerge}
              onCancel={() => setMergingBranch(null)}
            />
          </div>
        )}

        {/* Timeline / Graph */}
        <div className="flex-1 overflow-auto px-3 py-4">
          {viewMode === 'graph' ? (
            <BranchGraph
              versions={versions}
              branches={branches}
              activeBranch={activeBranch}
              onSelectVersion={(v) => {
                setDiffVersion(v)
                setDiffModalOpen(true)
              }}
            />
          ) : filteredVersions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <History size={20} className="text-[var(--text-tertiary)] mb-3" />
              <p className="text-[12px] text-[var(--text-secondary)]">No versions yet</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1 max-w-[200px]">
                Create your first version to start tracking changes to your product graph.
              </p>
              <button
                onClick={() => setShowCreateVersion(true)}
                className="tool-btn-primary mt-4 flex items-center gap-1.5 px-4 py-1.5 text-[11px]"
              >
                <Plus size={13} />
                Create First Version
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredVersions.map((version, idx) => (
                <TimelineEntry
                  key={version.id}
                  version={version}
                  isFirst={idx === 0}
                  isLast={idx === filteredVersions.length - 1}
                  activeBranch={activeBranch}
                  onViewDiff={handleViewDiff}
                  onRestore={handleRestore}
                  onCreateBranch={handleBranchFromVersion}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer stats */}
        {versions.length > 0 && (
          <div className="px-3 py-2 border-t border-[var(--border-default)] bg-[var(--bg-inset)]">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
              <span>{versions.length} version{versions.length !== 1 ? 's' : ''} total</span>
              <span>{activeBranches.length + 1} branch{activeBranches.length !== 0 ? 'es' : ''}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Diff modal */}
      <VersionDiffModal
        isOpen={diffModalOpen}
        onClose={() => {
          setDiffModalOpen(false)
          setDiffVersion(null)
        }}
        version1={diffParentVersion}
        version2={diffVersion}
      />
    </>
  )
}
