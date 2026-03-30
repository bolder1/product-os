'use client'

import { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  | 'dangling-edge'     // edge references node that doesn't exist
  | 'orphan-node'       // node with no edges at all
  | 'circular-dep'      // circular dependency chain
  | 'duplicate-label'   // same kind + label in product (likely accidental)
  | 'stale-reference'   // data.payload references a deleted node id
  | 'kind-mismatch'     // edge connects incompatible node kinds

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

  // 1. Dangling edges — edges pointing to non-existent nodes
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

  // 2. Orphan nodes — nodes with zero connections (except root kinds)
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

  // 4. Circular dependency detection (simplified — depth-limited DFS)
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
          description: `Cycle: ${cycle.map((id) => pn.find((n) => n.id === id)?.label ?? id).join(' → ')}`,
          nodeIds: cycle,
          edgeIds: [],
          suggestion: 'Break the cycle by removing one dependency edge.',
          autoFixable: false,
        })
        break // report first cycle only
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-[640px] max-h-[75vh] rounded-2xl border border-white/[0.1] bg-[#0A0F1E] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Graph Conflict Resolver</h2>
                <p className="text-[0.6875rem] text-[#64748B]">
                  {activeConflicts.length === 0 ? 'No conflicts detected' :
                    `${criticalCount} critical, ${warningCount} warning${activeConflicts.length > criticalCount + warningCount ? `, ${activeConflicts.length - criticalCount - warningCount} info` : ''}`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRescan}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-[#94A3B8] text-xs hover:bg-white/[0.08] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
                Rescan
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#64748B]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {scanning ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <RefreshCw className="w-6 h-6 text-[#6366F1] animate-spin" />
                <p className="text-sm text-[#94A3B8]">Scanning graph for conflicts...</p>
              </div>
            ) : activeConflicts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-sm text-[#94A3B8]">Your product graph is healthy</p>
                <p className="text-[0.6875rem] text-[#475569]">
                  No dangling edges, orphans, or circular dependencies detected.
                </p>
              </div>
            ) : (
              activeConflicts.map((conflict, i) => (
                <motion.div
                  key={conflict.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border p-4 ${
                    conflict.severity === 'critical'
                      ? 'border-rose-500/20 bg-rose-500/5'
                      : conflict.severity === 'warning'
                      ? 'border-amber-500/20 bg-amber-500/5'
                      : 'border-blue-500/20 bg-blue-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {conflict.type === 'dangling-edge' ? (
                        <Link2Off className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      ) : conflict.type === 'circular-dep' ? (
                        <GitMerge className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      ) : conflict.type === 'orphan-node' ? (
                        <Trash2 className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-[#F1F5F9]">{conflict.title}</p>
                        <p className="text-[0.6875rem] text-[#64748B] mt-0.5 leading-relaxed">
                          {conflict.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <ArrowRight className="w-3 h-3 text-[#475569]" />
                          <p className="text-[0.625rem] text-[#818CF8]">{conflict.suggestion}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {conflict.autoFixable && (
                        <button
                          onClick={() => handleAutoFix(conflict)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6366F1]/10 text-[#818CF8] text-[0.6875rem] font-medium hover:bg-[#6366F1]/20 transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          Auto-fix
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(conflict.id)}
                        className="px-2.5 py-1 rounded-lg text-[#475569] text-[0.6875rem] hover:bg-white/[0.04] transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer summary */}
          {activeConflicts.length > 0 && (
            <div className="border-t border-white/[0.06] px-6 py-3 flex items-center justify-between bg-white/[0.01]">
              <p className="text-[0.6875rem] text-[#64748B]">
                {conflicts.filter((c) => resolvedIds.has(c.id)).length} resolved &middot;{' '}
                {activeConflicts.length} remaining
              </p>
              <button
                onClick={() => {
                  for (const c of activeConflicts.filter((c) => c.autoFixable)) {
                    handleAutoFix(c)
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366F1] text-white text-xs font-medium hover:bg-[#5558E6] transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Auto-fix All ({activeConflicts.filter((c) => c.autoFixable).length})
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
