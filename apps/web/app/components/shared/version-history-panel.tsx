'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    develop: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    staging: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }
  const color = colors[name] || 'bg-purple-500/20 text-purple-400 border-purple-500/30'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-medium border ${color} ${
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
    : 'text-[#3B82F6]'

  const relativeTime = getRelativeTime(version.createdAt)

  return (
    <motion.div
      className="relative flex gap-3 group"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center border ${
            isFirst
              ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/40'
              : 'bg-white/[0.03] border-white/[0.08]'
          } z-10`}
        >
          <Icon size={13} className={isFirst ? 'text-[#8B5CF6]' : iconColor} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-white/[0.06] min-h-[24px]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 -mt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#F1F5F9] truncate">{version.label}</p>
            {version.description && (
              <p className="text-[0.6875rem] text-[#64748B] mt-0.5 line-clamp-2">
                {version.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <BranchPill name={version.branchName} isActive={isOnActiveBranch} />
              <span className="text-[0.625rem] text-[#475569] flex items-center gap-1">
                <Clock size={9} />
                {relativeTime}
              </span>
              <span className="text-[0.625rem] text-[#475569]">
                by {version.createdBy.name}
              </span>
            </div>
          </div>
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onViewDiff(version)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
          >
            <Diff size={11} />
            Diff
          </button>
          <button
            onClick={() => onRestore(version)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
          >
            <RotateCcw size={11} />
            Restore
          </button>
          <button
            onClick={() => onCreateBranch(version)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
          >
            <GitBranch size={11} />
            Branch
          </button>
        </div>
      </div>
    </motion.div>
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
    <motion.div
      className="px-4 py-3 border-b border-white/[0.08] space-y-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Version label (e.g. v0.1.0)"
        autoFocus
        className="w-full px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40 resize-none"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 rounded text-[0.6875rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
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
          className="px-3 py-1 rounded text-[0.6875rem] font-medium bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors disabled:opacity-40"
        >
          Create Version
        </button>
      </div>
    </motion.div>
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
    <motion.div
      className="px-4 py-3 border-b border-white/[0.08] space-y-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value.replace(/\s+/g, '-').toLowerCase())}
        placeholder="Branch name (e.g. feature/auth)"
        autoFocus
        className="w-full px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 rounded text-[0.6875rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (name.trim()) onSubmit(name.trim())
          }}
          disabled={!name.trim()}
          className="px-3 py-1 rounded text-[0.6875rem] font-medium bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors disabled:opacity-40"
        >
          Create Branch
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

interface VersionHistoryPanelProps {
  productId: string
}

export function VersionHistoryPanel({ productId }: VersionHistoryPanelProps) {
  // Stable selectors — never destructure entire store
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

  // Diff modal state
  const [diffModalOpen, setDiffModalOpen] = useState(false)
  const [diffVersion, setDiffVersion] = useState<Version | null>(null)

  // For diff, compare selected version against the one before it
  const diffParentVersion = useMemo(() => {
    if (!diffVersion?.parentId) return null
    return versions.find((v) => v.id === diffVersion.parentId) ?? null
  }, [diffVersion, versions])

  const activeBranches = branches.filter((b) => b.status === 'active')
  const mergedBranches = branches.filter((b) => b.status === 'merged')

  // Filter versions by active branch
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

  return (
    <>
      <AnimatePresence>
        {isPanelOpen && (
          <motion.aside
            className="fixed right-0 top-0 bottom-0 z-50 w-[380px] flex flex-col border-l border-white/[0.08] bg-[#060918] shadow-2xl"
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-white/[0.03]">
                  <History size={16} className="text-[#8B5CF6]" />
                </div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Version History</h2>
              </div>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-[#64748B] hover:text-[#94A3B8]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Active branch indicator */}
            <div className="px-4 py-2.5 border-b border-white/[0.08] bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <button
                    onClick={() => setShowBranchSelector(!showBranchSelector)}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-md hover:bg-white/[0.06] transition-colors"
                  >
                    <GitBranch size={13} className="text-[#8B5CF6]" />
                    <span className="text-xs font-medium text-[#F1F5F9]">{activeBranch}</span>
                    <ChevronDown size={12} className="text-[#64748B]" />
                  </button>

                  {/* Branch selector dropdown */}
                  <AnimatePresence>
                    {showBranchSelector && (
                      <motion.div
                        className="absolute top-full left-0 mt-1 w-52 rounded-lg border border-white/[0.08] bg-[#0A0E23] shadow-xl z-20"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        <div className="p-1">
                          {/* Always show main */}
                          <button
                            onClick={() => {
                              storeSetActiveBranch(productId, 'main')
                              setShowBranchSelector(false)
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                              activeBranch === 'main'
                                ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                                : 'text-[#94A3B8] hover:bg-white/[0.06]'
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
                                className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
                                  activeBranch === branch.name
                                    ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                                    : 'text-[#94A3B8] hover:bg-white/[0.06]'
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
                                className="p-1 rounded hover:bg-white/[0.06] text-[#64748B] hover:text-amber-400 transition-colors"
                              >
                                <GitMerge size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        {mergedBranches.length > 0 && (
                          <div className="border-t border-white/[0.06] p-1">
                            <p className="px-3 py-1 text-[0.6rem] uppercase tracking-wider text-[#475569]">
                              Merged
                            </p>
                            {mergedBranches.map((branch) => (
                              <div
                                key={branch.id}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#475569]"
                              >
                                <GitMerge size={12} />
                                {branch.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setShowCreateVersion(true)
                      setShowCreateBranch(false)
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.6875rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
                  >
                    <Plus size={12} />
                    Version
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateBranch(true)
                      setShowCreateVersion(false)
                      setBranchSourceVersion(null)
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.6875rem] text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
                  >
                    <GitBranch size={12} />
                    Branch
                  </button>
                </div>
              </div>
            </div>

            {/* Create forms */}
            <AnimatePresence>
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
            </AnimatePresence>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.6875rem] transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] font-medium'
                    : 'text-[#64748B] hover:bg-white/[0.06]'
                }`}
              >
                <Clock size={12} />
                Timeline
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[0.6875rem] transition-colors ${
                  viewMode === 'graph'
                    ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] font-medium'
                    : 'text-[#64748B] hover:bg-white/[0.06]'
                }`}
              >
                <GitBranch size={12} />
                Graph
              </button>
            </div>

            {/* Merge preview overlay */}
            {mergingBranch && (
              <div className="px-4 py-3">
                <MergePreview
                  sourceBranch={mergingBranch}
                  versions={versions}
                  onConfirmMerge={confirmMerge}
                  onCancel={() => setMergingBranch(null)}
                />
              </div>
            )}

            {/* Timeline / Graph */}
            <div className="flex-1 overflow-auto px-4 py-4">
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
                  <div className="p-3 rounded-xl bg-white/[0.03] mb-3">
                    <History size={24} className="text-[#475569]" />
                  </div>
                  <p className="text-sm text-[#64748B]">No versions yet</p>
                  <p className="text-xs text-[#475569] mt-1 max-w-[200px]">
                    Create your first version to start tracking changes to your product graph.
                  </p>
                  <button
                    onClick={() => setShowCreateVersion(true)}
                    className="mt-4 flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
                  >
                    <Plus size={14} />
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
              <div className="px-4 py-2 border-t border-white/[0.08] bg-white/[0.01]">
                <div className="flex items-center justify-between text-[0.625rem] text-[#475569]">
                  <span>{versions.length} version{versions.length !== 1 ? 's' : ''} total</span>
                  <span>{activeBranches.length + 1} branch{activeBranches.length !== 0 ? 'es' : ''}</span>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

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
