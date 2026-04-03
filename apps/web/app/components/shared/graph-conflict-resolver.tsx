'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  AlertTriangle,
  Link2Off,
  GitMerge,
  Trash2,
  ArrowRight,
  CheckCircle2,
  X,
  RefreshCw,
  Zap,
  Shield,
} from 'lucide-react'
import { useGraphStore, type GraphNode, type GraphEdge } from '../../lib/graph-store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ConflictType =
  | 'dangling-edge'
  | 'orphan-node'
  | 'circular-dep'
  | 'duplicate-label'
  | 'stale-reference'
  | 'kind-mismatch'

export interface GraphConflict {
  id: string
  type: ConflictType
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  nodeIds: string[]
  edgeIds: string[]
  suggestion: string
  autoFixable: boolean
}

// ---------------------------------------------------------------------------
// Conflict detection engine
// ---------------------------------------------------------------------------

function detectConflicts(
  nodes: GraphNode[],
  edges: GraphEdge[],
  productId: string
): GraphConflict[] {
  const pn = nodes.filter((n) => n.productId === productId)
  const pe = edges.filter((e) =>
    pn.some((n) => n.id === e.sourceId) || pn.some((n) => n.id === e.targetId)
  )
  const nodeIds = new Set(pn.map((n) => n.id))
  const conflicts: GraphConflict[] = []

  // 1. Dangling edges
  for (const edge of pe) {
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) {
      conflicts.push({
        id: `dangling-${edge.id}`,
        type: 'dangling-edge',
        severity: 'critical',
        title: 'Dangling edge reference',
        description: `Edge "${edge.kind}" connects to a node that no longer exists.`,
        nodeIds: [edge.sourceId, edge.targetId].filter((id) => !nodeIds.has(id)),
        edgeIds: [edge.id],
        suggestion: 'Remove this orphaned edge to clean up the graph.',
        autoFixable: true,
      })
    }
  }

  // 2. Orphan nodes
  const rootKinds = new Set(['plan', 'product'])
  const connectedIds = new Set(pe.flatMap((e) => [e.sourceId, e.targetId]))
  for (const node of pn) {
    if (!rootKinds.has(node.kind) && !connectedIds.has(node.id)) {
      conflicts.push({
        id: `orphan-${node.id}`,
        type: 'orphan-node',
        severity: 'warning',
        title: `Orphan: ${node.label}`,
        description: `${node.kind} "${node.label}" has no connections. It may be unused.`,
        nodeIds: [node.id],
        edgeIds: [],
        suggestion: 'Connect this node to related elements or remove it.',
        autoFixable: false,
      })
    }
  }

  // 3. Duplicate labels within same kind
  const kindLabelMap = new Map<string, GraphNode[]>()
  for (const node of pn) {
    const key = `${node.kind}::${node.label.toLowerCase().trim()}`
    const list = kindLabelMap.get(key) ?? []
    list.push(node)
    kindLabelMap.set(key, list)
  }
  for (const [, dupes] of kindLabelMap) {
    if (dupes.length > 1) {
      conflicts.push({
        id: `dupe-${dupes[0].id}`,
        type: 'duplicate-label',
        severity: 'warning',
        title: `Duplicate: ${dupes[0].label}`,
        description: `${dupes.length} ${dupes[0].kind} nodes share the same label "${dupes[0].label}".`,
        nodeIds: dupes.map((n) => n.id),
        edgeIds: [],
        suggestion: 'Merge duplicates or rename to distinguish them.',
        autoFixable: false,
      })
    }
  }

  // 4. Circular dependency detection (depth-limited DFS)
  const adjacency = new Map<string, string[]>()
  for (const edge of pe) {
    if (edge.kind === 'depends_on' || edge.kind === 'requires') {
      const list = adjacency.get(edge.sourceId) ?? []
      list.push(edge.targetId)
      adjacency.set(edge.sourceId, list)
    }
  }
  const visited = new Set<string>()
  const inStack = new Set<string>()
  function dfs(id: string, path: string[]): string[] | null {
    if (inStack.has(id)) return [...path, id]
    if (visited.has(id)) return null
    visited.add(id)
    inStack.add(id)
    for (const next of adjacency.get(id) ?? []) {
      const cycle = dfs(next, [...path, id])
      if (cycle) return cycle
    }
    inStack.delete(id)
    return null
  }
  for (const startId of adjacency.keys()) {
    if (!visited.has(startId)) {
      const cycle = dfs(startId, [])
      if (cycle) {
        conflicts.push({
          id: `cycle-${cycle[0]}`,
          type: 'circular-dep',
          severity: 'critical',
          title: 'Circular dependency detected',
          description: `Cycle: ${cycle.map((id) => pn.find((n) => n.id === id)?.label ?? id).join(' > ')}`,
          nodeIds: cycle,
          edgeIds: [],
          suggestion: 'Break the cycle by removing one dependency edge.',
          autoFixable: false,
        })
        break
      }
    }
  }

  return conflicts
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface GraphConflictResolverProps {
  productId: string
  open: boolean
  onClose: () => void
}

export function GraphConflictResolver({ productId, open, onClose }: GraphConflictResolverProps) {
  const allNodes = useGraphStore((s) => s.nodes)
  const allEdges = useGraphStore((s) => s.edges)
  const deleteNode = useGraphStore((s) => s.deleteNode)
  const deleteEdge = useGraphStore((s) => s.deleteEdge)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [scanning, setScanning] = useState(false)

  const conflicts = useMemo(
    () => detectConflicts(allNodes, allEdges, productId),
    [allNodes, allEdges, productId]
  )

  const activeConflicts = useMemo(
    () => conflicts.filter((c) => !resolvedIds.has(c.id)),
    [conflicts, resolvedIds]
  )

  const criticalCount = activeConflicts.filter((c) => c.severity === 'critical').length
  const warningCount = activeConflicts.filter((c) => c.severity === 'warning').length

  const handleAutoFix = useCallback((conflict: GraphConflict) => {
    if (conflict.type === 'dangling-edge') {
      for (const eid of conflict.edgeIds) {
        deleteEdge(eid)
      }
    }
    setResolvedIds((prev) => new Set([...prev, conflict.id]))
  }, [deleteEdge])

  const handleDismiss = useCallback((id: string) => {
    setResolvedIds((prev) => new Set([...prev, id]))
  }, [])

  const handleRescan = useCallback(() => {
    setScanning(true)
    setResolvedIds(new Set())
    setTimeout(() => setScanning(false), 800)
  }, [])

  if (!open) return null

  const severityBorder = (s: string) =>
    s === 'critical' ? 'border-[var(--color-error)]/20' :
    s === 'warning' ? 'border-[var(--color-warning)]/20' :
    'border-[var(--color-info)]/20'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[620px] max-h-[75vh] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[var(--color-warning)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Graph Conflict Resolver</span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {activeConflicts.length === 0 ? 'No conflicts' :
                `${criticalCount} critical, ${warningCount} warning`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleRescan} className="tool-btn text-[11px]">
              <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
              Rescan
            </button>
            <button onClick={onClose} className="tool-btn p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-3 space-y-1.5">
          {scanning ? (
            <div className="flex items-center justify-center py-16 gap-2">
              <RefreshCw className="w-4 h-4 text-[var(--accent-text)] animate-spin" />
              <p className="text-[12px] text-[var(--text-secondary)]">Scanning graph for conflicts...</p>
            </div>
          ) : activeConflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
              <p className="text-[12px] text-[var(--text-secondary)]">Your product graph is healthy</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                No dangling edges, orphans, or circular dependencies detected.
              </p>
            </div>
          ) : (
            activeConflicts.map((conflict) => (
              <div
                key={conflict.id}
                className={`rounded-[var(--radius-md)] border p-3 ${severityBorder(conflict.severity)} bg-[var(--bg-inset)]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {conflict.type === 'dangling-edge' ? (
                      <Link2Off className="w-3.5 h-3.5 text-[var(--color-error)] mt-0.5 shrink-0" />
                    ) : conflict.type === 'circular-dep' ? (
                      <GitMerge className="w-3.5 h-3.5 text-[var(--color-error)] mt-0.5 shrink-0" />
                    ) : conflict.type === 'orphan-node' ? (
                      <Trash2 className="w-3.5 h-3.5 text-[var(--color-warning)] mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)] mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-[var(--text-primary)]">{conflict.title}</p>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                        {conflict.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)]" />
                        <p className="text-[10px] text-[var(--accent-text)]">{conflict.suggestion}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {conflict.autoFixable && (
                      <button
                        onClick={() => handleAutoFix(conflict)}
                        className="tool-btn text-[11px] text-[var(--accent-text)]"
                      >
                        <Zap className="w-3 h-3" />
                        Auto-fix
                      </button>
                    )}
                    <button
                      onClick={() => handleDismiss(conflict.id)}
                      className="tool-btn text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer summary */}
        {activeConflicts.length > 0 && (
          <div className="border-t border-[var(--border-default)] px-3 h-[var(--topbar-h)] flex items-center justify-between shrink-0">
            <p className="text-[11px] text-[var(--text-secondary)]">
              {conflicts.filter((c) => resolvedIds.has(c.id)).length} resolved &middot;{' '}
              {activeConflicts.length} remaining
            </p>
            <button
              onClick={() => {
                for (const c of activeConflicts.filter((c) => c.autoFixable)) {
                  handleAutoFix(c)
                }
              }}
              className="tool-btn tool-btn-primary text-[11px]"
            >
              <Zap className="w-3 h-3" />
              Auto-fix All ({activeConflicts.filter((c) => c.autoFixable).length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
