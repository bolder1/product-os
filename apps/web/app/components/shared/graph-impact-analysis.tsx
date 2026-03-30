'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitBranch,
  AlertTriangle,
  ArrowRight,
  Search,
  Zap,
  X,
} from 'lucide-react'
import { useGraphStore, type GraphNode, type GraphEdge, type NodeKind } from '../../lib/graph-store'

interface GraphImpactAnalysisProps {
  productId: string
  isOpen: boolean
  onClose: () => void
}

interface ImpactChain {
  node: GraphNode
  depth: number
  edgeKind: string
  direction: 'upstream' | 'downstream'
}

const NODE_KIND_COLORS: Record<string, string> = {
  component: '#EC4899',
  page: '#06B6D4',
  token: '#64748B',
  entity: '#10B981',
  workflow: '#F59E0B',
  feature: '#8B5CF6',
  module: '#3B82F6',
  journey: '#F97316',
}

export function GraphImpactAnalysis({ productId, isOpen, onClose }: GraphImpactAnalysisProps) {
  const allNodes = useGraphStore((s) => s.nodes)
  const allEdges = useGraphStore((s) => s.edges)

  const productNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId),
    [allNodes, productId]
  )
  const productEdges = useMemo(
    () => allEdges.filter((e) => e.productId === productId),
    [allEdges, productId]
  )

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return productNodes.slice(0, 20)
    const q = searchQuery.toLowerCase()
    return productNodes.filter((n) =>
      n.label.toLowerCase().includes(q) || n.kind.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [productNodes, searchQuery])

  // Compute impact chains for the selected node
  const impactChains = useMemo(() => {
    if (!selectedNodeId) return { upstream: [] as ImpactChain[], downstream: [] as ImpactChain[] }

    const visited = new Set<string>()
    const upstream: ImpactChain[] = []
    const downstream: ImpactChain[] = []

    // BFS downstream (what depends on this node)
    function bfsDown(nodeId: string, depth: number) {
      if (depth > 4) return
      for (const edge of productEdges) {
        if (edge.sourceId === nodeId && !visited.has(edge.targetId)) {
          visited.add(edge.targetId)
          const target = productNodes.find((n) => n.id === edge.targetId)
          if (target) {
            downstream.push({ node: target, depth, edgeKind: edge.kind, direction: 'downstream' })
            bfsDown(edge.targetId, depth + 1)
          }
        }
      }
    }

    // BFS upstream (what this node depends on)
    function bfsUp(nodeId: string, depth: number) {
      if (depth > 4) return
      for (const edge of productEdges) {
        if (edge.targetId === nodeId && !visited.has(edge.sourceId)) {
          visited.add(edge.sourceId)
          const source = productNodes.find((n) => n.id === edge.sourceId)
          if (source) {
            upstream.push({ node: source, depth, edgeKind: edge.kind, direction: 'upstream' })
            bfsUp(edge.sourceId, depth + 1)
          }
        }
      }
    }

    visited.add(selectedNodeId)
    bfsDown(selectedNodeId, 1)

    visited.clear()
    visited.add(selectedNodeId)
    bfsUp(selectedNodeId, 1)

    return { upstream, downstream }
  }, [selectedNodeId, productNodes, productEdges])

  const selectedNode = selectedNodeId ? productNodes.find((n) => n.id === selectedNodeId) : null
  const totalImpacted = impactChains.upstream.length + impactChains.downstream.length

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="w-[680px] max-h-[80vh] rounded-2xl border border-white/[0.08] bg-[#0A0E23] shadow-2xl overflow-hidden flex flex-col"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-semibold text-[#F1F5F9]">Impact Analysis</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#64748B]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes to analyze impact..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#8B5CF6]/40"
              />
            </div>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Node list */}
            <div className="w-[240px] shrink-0 border-r border-white/[0.06] overflow-y-auto">
              {filteredNodes.length === 0 ? (
                <p className="text-xs text-[#64748B] text-center py-6">
                  {productNodes.length === 0 ? 'No graph nodes yet' : 'No matches'}
                </p>
              ) : (
                filteredNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors ${
                      selectedNodeId === node.id
                        ? 'bg-[#8B5CF6]/10 border-r-2 border-[#8B5CF6]'
                        : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: NODE_KIND_COLORS[node.kind] || '#64748B' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#F1F5F9] truncate">{node.label}</p>
                      <p className="text-[0.5625rem] text-[#475569]">{node.kind}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Impact view */}
            <div className="flex-1 overflow-y-auto p-5">
              {!selectedNode ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <GitBranch className="w-8 h-8 text-[#475569] mb-2" />
                  <p className="text-sm text-[#64748B]">Select a node</p>
                  <p className="text-xs text-[#475569] mt-0.5">See what changes when this node is modified</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected node */}
                  <div className="rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/5 p-3 text-center">
                    <p className="text-sm font-medium text-[#F1F5F9]">{selectedNode.label}</p>
                    <p className="text-[0.625rem] text-[#8B5CF6]">{selectedNode.kind}</p>
                  </div>

                  {/* Impact summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                      <p className="text-lg font-bold text-amber-400">{totalImpacted}</p>
                      <p className="text-[0.625rem] text-[#64748B]">Total Impacted</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                      <p className="text-lg font-bold text-blue-400">{impactChains.upstream.length}</p>
                      <p className="text-[0.625rem] text-[#64748B]">Dependencies</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                      <p className="text-lg font-bold text-rose-400">{impactChains.downstream.length}</p>
                      <p className="text-[0.625rem] text-[#64748B]">Dependents</p>
                    </div>
                  </div>

                  {/* Downstream (what will break) */}
                  {impactChains.downstream.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <p className="text-xs font-medium text-rose-400">
                          Downstream Impact ({impactChains.downstream.length})
                        </p>
                      </div>
                      <div className="space-y-1">
                        {impactChains.downstream.map((chain, i) => (
                          <div
                            key={`down-${chain.node.id}-${i}`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.02]"
                            style={{ marginLeft: (chain.depth - 1) * 16 }}
                          >
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: NODE_KIND_COLORS[chain.node.kind] || '#64748B' }}
                            />
                            <span className="text-xs text-[#F1F5F9]">{chain.node.label}</span>
                            <span className="text-[0.5625rem] text-[#475569]">({chain.node.kind})</span>
                            <span className="text-[0.5625rem] text-[#475569] ml-auto">
                              via {chain.edgeKind.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upstream (what this depends on) */}
                  {impactChains.upstream.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                        <p className="text-xs font-medium text-blue-400">
                          Upstream Dependencies ({impactChains.upstream.length})
                        </p>
                      </div>
                      <div className="space-y-1">
                        {impactChains.upstream.map((chain, i) => (
                          <div
                            key={`up-${chain.node.id}-${i}`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.02]"
                            style={{ marginLeft: (chain.depth - 1) * 16 }}
                          >
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: NODE_KIND_COLORS[chain.node.kind] || '#64748B' }}
                            />
                            <span className="text-xs text-[#F1F5F9]">{chain.node.label}</span>
                            <span className="text-[0.5625rem] text-[#475569]">({chain.node.kind})</span>
                            <span className="text-[0.5625rem] text-[#475569] ml-auto">
                              via {chain.edgeKind.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {totalImpacted === 0 && (
                    <p className="text-xs text-[#64748B] text-center py-4">
                      This node has no connections in the graph — no impact propagation.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
