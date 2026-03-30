'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { GitCommit, GitMerge, GitBranch } from 'lucide-react'
import type { Version, Branch } from '../../lib/version-store'

// ---------------------------------------------------------------------------
// Branch Graph — visual git-style branch visualization
// ---------------------------------------------------------------------------

interface BranchGraphProps {
  versions: Version[]
  branches: Branch[]
  activeBranch: string
  onSelectVersion?: (version: Version) => void
}

const BRANCH_COLORS: Record<string, string> = {
  main: '#10B981',
  develop: '#3B82F6',
  staging: '#F59E0B',
}

function getBranchColor(name: string): string {
  return BRANCH_COLORS[name] || `hsl(${Math.abs(hashString(name)) % 360}, 70%, 60%)`
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

// Assign each branch a "lane" (x-column) for the graph
function assignLanes(versions: Version[], branches: Branch[]): Map<string, number> {
  const lanes = new Map<string, number>()
  lanes.set('main', 0)

  const activeBranches = branches.filter((b) => b.status === 'active')
  const mergedBranches = branches.filter((b) => b.status === 'merged')

  let lane = 1
  for (const b of activeBranches) {
    if (!lanes.has(b.name)) {
      lanes.set(b.name, lane++)
    }
  }
  for (const b of mergedBranches) {
    if (!lanes.has(b.name)) {
      lanes.set(b.name, lane++)
    }
  }

  // Check for branch names in versions that aren't in the branches list
  for (const v of versions) {
    if (!lanes.has(v.branchName)) {
      lanes.set(v.branchName, lane++)
    }
  }

  return lanes
}

const NODE_RADIUS = 5
const ROW_HEIGHT = 48
const LANE_WIDTH = 24
const LEFT_PAD = 20

export function BranchGraph({ versions, branches, activeBranch, onSelectVersion }: BranchGraphProps) {
  const lanes = useMemo(() => assignLanes(versions, branches), [versions, branches])

  // Sort versions chronologically (oldest first for bottom-up rendering, then reverse for top-down display)
  const sortedVersions = useMemo(
    () =>
      [...versions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [versions]
  )

  const svgHeight = sortedVersions.length * ROW_HEIGHT + 40
  const totalLanes = Math.max(lanes.size, 1)
  const svgWidth = LEFT_PAD + totalLanes * LANE_WIDTH + 10

  // Build a map of version id → row index
  const versionRowMap = useMemo(() => {
    const map = new Map<string, number>()
    sortedVersions.forEach((v, idx) => {
      map.set(v.id, idx)
    })
    return map
  }, [sortedVersions])

  // Helper: get x position for a branch lane
  const laneX = (branchName: string) => LEFT_PAD + (lanes.get(branchName) ?? 0) * LANE_WIDTH
  // Helper: get y position for a row
  const rowY = (idx: number) => 20 + idx * ROW_HEIGHT

  // Build edge lines (parent → child connections)
  const edges = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number; color: string; isMerge: boolean }[] = []

    for (const version of sortedVersions) {
      if (!version.parentId) continue
      const childRow = versionRowMap.get(version.id)
      const parentRow = versionRowMap.get(version.parentId)
      if (childRow === undefined || parentRow === undefined) continue

      const childX = laneX(version.branchName)
      const childY = rowY(childRow)

      const parent = sortedVersions.find((v) => v.id === version.parentId)
      if (!parent) continue

      const parentX = laneX(parent.branchName)
      const parentY = rowY(parentRow)

      const isMerge = version.label.startsWith('Merge:')
      const isBranch = version.label.startsWith('Branch:')
      const color = isMerge || isBranch ? getBranchColor(version.branchName) : getBranchColor(parent.branchName)

      result.push({ x1: parentX, y1: parentY, x2: childX, y2: childY, color, isMerge })
    }

    return result
  }, [sortedVersions, versionRowMap, lanes]) // eslint-disable-line react-hooks/exhaustive-deps

  if (sortedVersions.length === 0) return null

  return (
    <div className="flex w-full overflow-x-auto">
      {/* SVG graph */}
      <svg
        width={svgWidth}
        height={svgHeight}
        className="shrink-0"
        style={{ minWidth: svgWidth }}
      >
        {/* Vertical branch lines (faint) */}
        {Array.from(lanes.entries()).map(([branchName, lane]) => {
          const x = LEFT_PAD + lane * LANE_WIDTH
          const branchVersionRows = sortedVersions
            .map((v, i) => (v.branchName === branchName ? i : -1))
            .filter((i) => i >= 0)
          if (branchVersionRows.length < 2) return null
          const minRow = Math.min(...branchVersionRows)
          const maxRow = Math.max(...branchVersionRows)
          return (
            <line
              key={`lane-${branchName}`}
              x1={x}
              y1={rowY(minRow)}
              x2={x}
              y2={rowY(maxRow)}
              stroke={getBranchColor(branchName)}
              strokeWidth={1.5}
              strokeOpacity={0.15}
            />
          )
        })}

        {/* Edge connections */}
        {edges.map((edge, i) => {
          if (edge.x1 === edge.x2) {
            // Straight line (same branch)
            return (
              <line
                key={`edge-${i}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={edge.color}
                strokeWidth={2}
                strokeOpacity={0.5}
              />
            )
          }
          // Curved line (cross-branch)
          const midY = (edge.y1 + edge.y2) / 2
          return (
            <path
              key={`edge-${i}`}
              d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
              stroke={edge.color}
              strokeWidth={2}
              strokeOpacity={0.5}
              fill="none"
              strokeDasharray={edge.isMerge ? '4 2' : undefined}
            />
          )
        })}

        {/* Version dots */}
        {sortedVersions.map((version, idx) => {
          const x = laneX(version.branchName)
          const y = rowY(idx)
          const isMerge = version.label.startsWith('Merge:')
          const isBranchPoint = version.label.startsWith('Branch:')
          const color = getBranchColor(version.branchName)
          const isActive = version.branchName === activeBranch

          return (
            <g key={version.id}>
              <circle
                cx={x}
                cy={y}
                r={isMerge || isBranchPoint ? NODE_RADIUS + 2 : NODE_RADIUS}
                fill={isActive ? color : '#0A0E23'}
                stroke={color}
                strokeWidth={2}
                className="cursor-pointer"
                onClick={() => onSelectVersion?.(version)}
              />
              {isMerge && (
                <circle cx={x} cy={y} r={2} fill={color} />
              )}
            </g>
          )
        })}
      </svg>

      {/* Labels next to graph */}
      <div className="flex flex-col shrink-0 ml-2" style={{ paddingTop: 20 - 10 }}>
        {sortedVersions.map((version, idx) => {
          const isMerge = version.label.startsWith('Merge:')
          const isBranch = version.label.startsWith('Branch:')
          const color = getBranchColor(version.branchName)

          return (
            <motion.button
              key={version.id}
              onClick={() => onSelectVersion?.(version)}
              className="flex items-center gap-2 text-left px-2 py-1 rounded hover:bg-white/[0.04] transition-colors"
              style={{ height: ROW_HEIGHT }}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
            >
              {isMerge ? (
                <GitMerge size={12} style={{ color }} />
              ) : isBranch ? (
                <GitBranch size={12} style={{ color }} />
              ) : (
                <GitCommit size={12} style={{ color }} />
              )}
              <div className="min-w-0">
                <p className="text-[0.6875rem] font-medium text-[#F1F5F9] truncate max-w-[200px]">
                  {version.label}
                </p>
                <p className="text-[0.5625rem] text-[#475569]">
                  {version.branchName} · {version.createdBy.name}
                </p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Merge Preview — shows what will change when merging a branch
// ---------------------------------------------------------------------------

interface MergePreviewProps {
  sourceBranch: Branch
  versions: Version[]
  onConfirmMerge: () => void
  onCancel: () => void
}

export function MergePreview({ sourceBranch, versions, onConfirmMerge, onCancel }: MergePreviewProps) {
  // Find the latest version on this branch
  const branchVersions = useMemo(
    () =>
      versions
        .filter((v) => v.branchName === sourceBranch.name)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [versions, sourceBranch.name]
  )

  // Find the main branch versions for comparison
  const mainVersions = useMemo(
    () =>
      versions
        .filter((v) => v.branchName === 'main')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [versions]
  )

  const latestBranch = branchVersions[0]
  const latestMain = mainVersions[0]

  // Compute diff between main and branch
  const diff = useMemo(() => {
    if (!latestBranch || !latestMain) return null
    const mainNodes = new Map(latestMain.snapshot.nodes.map((n) => [n.id, n]))
    const branchNodes = new Map(latestBranch.snapshot.nodes.map((n) => [n.id, n]))

    const added = latestBranch.snapshot.nodes.filter((n) => !mainNodes.has(n.id))
    const removed = latestMain.snapshot.nodes.filter((n) => !branchNodes.has(n.id))
    const modified = latestBranch.snapshot.nodes.filter((n) => {
      const mainNode = mainNodes.get(n.id)
      return mainNode && (mainNode.updatedAt !== n.updatedAt || mainNode.label !== n.label)
    })

    return { added, removed, modified }
  }, [latestBranch, latestMain])

  const color = getBranchColor(sourceBranch.name)

  return (
    <motion.div
      className="rounded-xl border border-white/[0.08] bg-[#0A0E23] overflow-hidden"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-white/[0.01]">
        <div className="flex items-center gap-2 mb-1">
          <GitMerge size={14} style={{ color }} />
          <span className="text-xs font-semibold text-[#F1F5F9]">Merge Preview</span>
        </div>
        <p className="text-[0.6875rem] text-[#64748B]">
          Merging <span className="font-medium" style={{ color }}>{sourceBranch.name}</span> into{' '}
          <span className="font-medium text-emerald-400">main</span>
        </p>
      </div>

      {/* Changes summary */}
      <div className="px-4 py-3 space-y-2">
        {diff ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-center">
                <p className="text-lg font-bold text-emerald-400">{diff.added.length}</p>
                <p className="text-[0.625rem] text-emerald-400/70">Added</p>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-center">
                <p className="text-lg font-bold text-amber-400">{diff.modified.length}</p>
                <p className="text-[0.625rem] text-amber-400/70">Modified</p>
              </div>
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-center">
                <p className="text-lg font-bold text-red-400">{diff.removed.length}</p>
                <p className="text-[0.625rem] text-red-400/70">Removed</p>
              </div>
            </div>

            {/* Node lists */}
            {diff.added.length > 0 && (
              <div>
                <p className="text-[0.625rem] font-medium text-emerald-400 mb-1">+ Added nodes</p>
                {diff.added.slice(0, 5).map((n) => (
                  <p key={n.id} className="text-[0.625rem] text-[#94A3B8] pl-2">
                    {n.label} <span className="text-[#475569]">({n.kind})</span>
                  </p>
                ))}
                {diff.added.length > 5 && (
                  <p className="text-[0.625rem] text-[#475569] pl-2">...and {diff.added.length - 5} more</p>
                )}
              </div>
            )}

            {diff.modified.length > 0 && (
              <div>
                <p className="text-[0.625rem] font-medium text-amber-400 mb-1">~ Modified nodes</p>
                {diff.modified.slice(0, 5).map((n) => (
                  <p key={n.id} className="text-[0.625rem] text-[#94A3B8] pl-2">
                    {n.label} <span className="text-[#475569]">({n.kind})</span>
                  </p>
                ))}
              </div>
            )}

            {diff.removed.length > 0 && (
              <div>
                <p className="text-[0.625rem] font-medium text-red-400 mb-1">- Removed nodes</p>
                {diff.removed.slice(0, 5).map((n) => (
                  <p key={n.id} className="text-[0.625rem] text-[#94A3B8] pl-2">
                    {n.label} <span className="text-[#475569]">({n.kind})</span>
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-[#64748B] text-center py-4">No changes to compare</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/[0.08]">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-md text-xs text-[#94A3B8] hover:bg-white/[0.06] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirmMerge}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
        >
          <GitMerge size={12} />
          Confirm Merge
        </button>
      </div>
    </motion.div>
  )
}
