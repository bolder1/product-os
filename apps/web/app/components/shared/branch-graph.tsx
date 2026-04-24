'use client'

import { useMemo } from 'react'
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
  main: 'var(--accent)',
  develop: 'var(--accent)',
  staging: 'var(--color-warning)',
}

function getBranchColor(name: string): string {
  return BRANCH_COLORS[name] || `hsl(${Math.abs(hashString(name)) % 360}, 50%, 55%)`
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

const NODE_RADIUS = 4
const ROW_HEIGHT = 36
const LANE_WIDTH = 20
const LEFT_PAD = 16

export function BranchGraph({ versions, branches, activeBranch, onSelectVersion }: BranchGraphProps) {
  const lanes = useMemo(() => assignLanes(versions, branches), [versions, branches])

  // Sort versions chronologically (newest first)
  const sortedVersions = useMemo(
    () =>
      [...versions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [versions]
  )

  const svgHeight = sortedVersions.length * ROW_HEIGHT + 32
  const totalLanes = Math.max(lanes.size, 1)
  const svgWidth = LEFT_PAD + totalLanes * LANE_WIDTH + 8

  // Build a map of version id -> row index
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
  const rowY = (idx: number) => 16 + idx * ROW_HEIGHT

  // Build edge lines (parent -> child connections)
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
              strokeWidth={1}
              strokeOpacity={0.12}
            />
          )
        })}

        {/* Edge connections */}
        {edges.map((edge, i) => {
          if (edge.x1 === edge.x2) {
            return (
              <line
                key={`edge-${i}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={edge.color}
                strokeWidth={1.5}
                strokeOpacity={0.45}
              />
            )
          }
          const midY = (edge.y1 + edge.y2) / 2
          return (
            <path
              key={`edge-${i}`}
              d={`M ${edge.x1} ${edge.y1} C ${edge.x1} ${midY}, ${edge.x2} ${midY}, ${edge.x2} ${edge.y2}`}
              stroke={edge.color}
              strokeWidth={1.5}
              strokeOpacity={0.45}
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
                r={isMerge || isBranchPoint ? NODE_RADIUS + 1.5 : NODE_RADIUS}
                fill={isActive ? color : 'var(--bg-surface)'}
                stroke={color}
                strokeWidth={1.5}
                className="cursor-pointer"
                onClick={() => onSelectVersion?.(version)}
              />
              {isMerge && (
                <circle cx={x} cy={y} r={1.5} fill={color} />
              )}
            </g>
          )
        })}
      </svg>

      {/* Labels next to graph */}
      <div className="flex flex-col shrink-0 ml-1.5" style={{ paddingTop: 16 - 9 }}>
        {sortedVersions.map((version) => {
          const isMerge = version.label.startsWith('Merge:')
          const isBranch = version.label.startsWith('Branch:')
          const color = getBranchColor(version.branchName)

          return (
            <button
              key={version.id}
              onClick={() => onSelectVersion?.(version)}
              className="flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded hover:bg-[var(--surface-hover)] transition-colors"
              style={{ height: ROW_HEIGHT }}
            >
              {isMerge ? (
                <GitMerge size={11} style={{ color }} />
              ) : isBranch ? (
                <GitBranch size={11} style={{ color }} />
              ) : (
                <GitCommit size={11} style={{ color }} />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                  {version.label}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {version.branchName} · {version.createdBy.name}
                </p>
              </div>
            </button>
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
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
        <div className="flex items-center gap-2 mb-0.5">
          <GitMerge size={13} style={{ color }} />
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">Merge Preview</span>
        </div>
        <p className="text-[11px] text-[var(--text-secondary)]">
          Merging <span className="font-medium" style={{ color }}>{sourceBranch.name}</span> into{' '}
          <span className="font-medium text-[var(--accent-text)]">main</span>
        </p>
      </div>

      {/* Changes summary */}
      <div className="px-3 py-3 space-y-2">
        {diff ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-center">
                <p className="text-sm font-bold text-emerald-400">{diff.added.length}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Added</p>
              </div>
              <div className="rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-center">
                <p className="text-sm font-bold text-amber-400">{diff.modified.length}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Modified</p>
              </div>
              <div className="rounded border border-[var(--border-default)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-center">
                <p className="text-sm font-bold text-red-400">{diff.removed.length}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Removed</p>
              </div>
            </div>

            {/* Node lists */}
            {diff.added.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-emerald-400 mb-1">+ Added nodes</p>
                {diff.added.slice(0, 5).map((n) => (
                  <p key={n.id} className="text-[10px] text-[var(--text-secondary)] pl-2">
                    {n.label} <span className="text-[var(--text-tertiary)]">({n.kind})</span>
                  </p>
                ))}
                {diff.added.length > 5 && (
                  <p className="text-[10px] text-[var(--text-tertiary)] pl-2">...and {diff.added.length - 5} more</p>
                )}
              </div>
            )}

            {diff.modified.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-amber-400 mb-1">~ Modified nodes</p>
                {diff.modified.slice(0, 5).map((n) => (
                  <p key={n.id} className="text-[10px] text-[var(--text-secondary)] pl-2">
                    {n.label} <span className="text-[var(--text-tertiary)]">({n.kind})</span>
                  </p>
                ))}
              </div>
            )}

            {diff.removed.length > 0 && (
              <div>
                <p className="text-[10px] font-medium text-red-400 mb-1">- Removed nodes</p>
                {diff.removed.slice(0, 5).map((n) => (
                  <p key={n.id} className="text-[10px] text-[var(--text-secondary)] pl-2">
                    {n.label} <span className="text-[var(--text-tertiary)]">({n.kind})</span>
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">No changes to compare</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-3 py-2.5 border-t border-[var(--border-default)]">
        <button
          onClick={onCancel}
          className="tool-btn"
        >
          Cancel
        </button>
        <button
          onClick={onConfirmMerge}
          className="tool-btn-primary flex items-center gap-1.5"
        >
          <GitMerge size={11} />
          Confirm Merge
        </button>
      </div>
    </div>
  )
}
