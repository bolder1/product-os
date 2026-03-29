'use client'

import { useState, useCallback, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Sparkles, Share2 } from 'lucide-react'
import {
  mockGraphData,
  type NodeKind,
  type EdgeKind,
} from './_data/mock-graph'
import { GraphCanvas } from './_components/graph-canvas'
import { GraphFilters } from './_components/graph-filters'
import { NodeDetailPanel } from './_components/node-detail-panel'

const ALL_NODE_KINDS: NodeKind[] = [
  'module',
  'feature',
  'page',
  'entity',
  'component',
  'workflow',
  'token',
  'journey',
]

const ALL_EDGE_KINDS: EdgeKind[] = [
  'contains',
  'depends_on',
  'implements',
  'uses_component',
  'routes_to',
]

function buildInitialPositions() {
  const positions: Record<string, { x: number; y: number }> = {}
  for (const node of mockGraphData.nodes) {
    positions[node.id] = { x: node.x, y: node.y }
  }
  return positions
}

export default function GraphExplorerPage() {
  const [activeNodeKinds, setActiveNodeKinds] = useState<Set<NodeKind>>(
    new Set(ALL_NODE_KINDS)
  )
  const [activeEdgeKinds, setActiveEdgeKinds] = useState<Set<EdgeKind>>(
    new Set(ALL_EDGE_KINDS)
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showLabels, setShowLabels] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodePositions, setNodePositions] = useState(buildInitialPositions)

  const toggleNodeKind = useCallback((kind: NodeKind) => {
    setActiveNodeKinds((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) {
        next.delete(kind)
      } else {
        next.add(kind)
      }
      return next
    })
  }, [])

  const toggleEdgeKind = useCallback((kind: EdgeKind) => {
    setActiveEdgeKinds((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) {
        next.delete(kind)
      } else {
        next.add(kind)
      }
      return next
    })
  }, [])

  const handleUpdateNodePosition = useCallback(
    (id: string, x: number, y: number) => {
      setNodePositions((prev) => ({ ...prev, [id]: { x, y } }))
    },
    []
  )

  const handleResetLayout = useCallback(() => {
    setNodePositions(buildInitialPositions())
    setActiveNodeKinds(new Set(ALL_NODE_KINDS))
    setActiveEdgeKinds(new Set(ALL_EDGE_KINDS))
    setSearchQuery('')
    setSelectedNodeId(null)
  }, [])

  const selectedNode = useMemo(
    () => (selectedNodeId ? mockGraphData.nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId]
  )

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Graph Explorer</h1>
            <p className="text-xs text-[#64748B]">
              {mockGraphData.nodes.length} nodes, {mockGraphData.edges.length} edges
            </p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          AI: Analyze Graph
        </button>
      </div>

      {/* Filters */}
      <GraphFilters
        activeNodeKinds={activeNodeKinds}
        onToggleNodeKind={toggleNodeKind}
        activeEdgeKinds={activeEdgeKinds}
        onToggleEdgeKind={toggleEdgeKind}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((p) => !p)}
        onResetLayout={handleResetLayout}
      />

      {/* Canvas */}
      <GraphCanvas
        nodes={mockGraphData.nodes}
        edges={mockGraphData.edges}
        activeNodeKinds={activeNodeKinds}
        activeEdgeKinds={activeEdgeKinds}
        searchQuery={searchQuery}
        showLabels={showLabels}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        nodePositions={nodePositions}
        onUpdateNodePosition={handleUpdateNodePosition}
      />

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            edges={mockGraphData.edges}
            allNodes={mockGraphData.nodes}
            onSelectNode={setSelectedNodeId}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
