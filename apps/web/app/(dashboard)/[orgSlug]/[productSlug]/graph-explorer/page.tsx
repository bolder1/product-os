'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Sparkles, Share2 } from 'lucide-react'
import {
  mockGraphData,
  type NodeKind,
  type EdgeKind,
  type GraphNode as LocalGraphNode,
  type GraphEdge as LocalGraphEdge,
} from './_data/mock-graph'
import { useGraphStore } from '../../../../lib/graph-store'
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

// ---------------------------------------------------------------------------
// Layout helper: arrange nodes in kind-based clusters around a center point
// ---------------------------------------------------------------------------
const CENTER_X = 550
const CENTER_Y = 400
const GROUP_RADIUS = 280
const NODE_SPACING = 70

function computeLayout(nodes: { id: string; kind: string }[]): Record<string, { x: number; y: number }> {
  const groups: Record<string, string[]> = {}
  for (const n of nodes) {
    ;(groups[n.kind] ??= []).push(n.id)
  }

  const kindKeys = Object.keys(groups)
  const positions: Record<string, { x: number; y: number }> = {}

  kindKeys.forEach((kind, groupIdx) => {
    const groupAngle = (2 * Math.PI * groupIdx) / kindKeys.length
    const groupCenterX = CENTER_X + GROUP_RADIUS * Math.cos(groupAngle)
    const groupCenterY = CENTER_Y + GROUP_RADIUS * Math.sin(groupAngle)
    const ids = groups[kind]

    ids.forEach((id, i) => {
      const nodeAngle = (2 * Math.PI * i) / ids.length
      const nodeRadius = ids.length === 1 ? 0 : NODE_SPACING
      positions[id] = {
        x: Math.round(groupCenterX + nodeRadius * Math.cos(nodeAngle)),
        y: Math.round(groupCenterY + nodeRadius * Math.sin(nodeAngle)),
      }
    })
  })

  return positions
}

// ---------------------------------------------------------------------------
// Convert store nodes/edges → local component format
// ---------------------------------------------------------------------------
function storeNodesToLocal(
  storeNodes: { id: string; kind: string; label: string; data: Record<string, unknown> }[],
  layout: Record<string, { x: number; y: number }>
): LocalGraphNode[] {
  return storeNodes.map((n) => ({
    id: n.id,
    kind: n.kind as NodeKind,
    label: n.label,
    x: layout[n.id]?.x ?? CENTER_X,
    y: layout[n.id]?.y ?? CENTER_Y,
    data: Object.fromEntries(
      Object.entries(n.data).map(([k, v]) => [k, String(v)])
    ),
  }))
}

function storeEdgesToLocal(
  storeEdges: { id: string; kind: string; sourceId: string; targetId: string }[]
): LocalGraphEdge[] {
  return storeEdges.map((e) => ({
    id: e.id,
    kind: e.kind as EdgeKind,
    source: e.sourceId,
    target: e.targetId,
  }))
}

export default function GraphExplorerPage() {
  const params = useParams()
  const productId = params.productSlug as string

  // Read flat arrays from the store (never call methods in selectors)
  const allStoreNodes = useGraphStore((s) => s.nodes)
  const allStoreEdges = useGraphStore((s) => s.edges)

  // Filter to current product
  const productStoreNodes = useMemo(
    () => allStoreNodes.filter((n) => n.productId === productId),
    [allStoreNodes, productId]
  )
  const productStoreEdges = useMemo(
    () => allStoreEdges.filter((e) => e.productId === productId),
    [allStoreEdges, productId]
  )

  // Determine if we have real data or should fall back to mock
  const hasStoreData = productStoreNodes.length > 0

  // Compute layout for store nodes
  const storeLayout = useMemo(
    () => (hasStoreData ? computeLayout(productStoreNodes) : {}),
    [hasStoreData, productStoreNodes]
  )

  // Build the final nodes/edges for the child components
  const graphNodes: LocalGraphNode[] = useMemo(
    () => (hasStoreData ? storeNodesToLocal(productStoreNodes, storeLayout) : mockGraphData.nodes),
    [hasStoreData, productStoreNodes, storeLayout]
  )
  const graphEdges: LocalGraphEdge[] = useMemo(
    () => (hasStoreData ? storeEdgesToLocal(productStoreEdges) : mockGraphData.edges),
    [hasStoreData, productStoreEdges]
  )

  // Build initial positions from whichever data source we're using
  const buildInitialPositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const node of graphNodes) {
      positions[node.id] = { x: node.x, y: node.y }
    }
    return positions
  }, [graphNodes])

  const [activeNodeKinds, setActiveNodeKinds] = useState<Set<NodeKind>>(
    new Set(ALL_NODE_KINDS)
  )
  const [activeEdgeKinds, setActiveEdgeKinds] = useState<Set<EdgeKind>>(
    new Set(ALL_EDGE_KINDS)
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showLabels, setShowLabels] = useState(true)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodePositions, setNodePositions] = useState(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const node of mockGraphData.nodes) {
      positions[node.id] = { x: node.x, y: node.y }
    }
    return positions
  })

  // Sync positions when graph data source changes
  const positionsRef = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const node of graphNodes) {
      positions[node.id] = { x: node.x, y: node.y }
    }
    return positions
  }, [graphNodes])

  // Merge: keep user-dragged positions, fill in defaults for new nodes
  const mergedPositions = useMemo(() => {
    const merged: Record<string, { x: number; y: number }> = {}
    for (const node of graphNodes) {
      merged[node.id] = nodePositions[node.id] ?? positionsRef[node.id]
    }
    return merged
  }, [graphNodes, nodePositions, positionsRef])

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
  }, [buildInitialPositions])

  const selectedNode = useMemo(
    () => (selectedNodeId ? graphNodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [selectedNodeId, graphNodes]
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
              {graphNodes.length} nodes, {graphEdges.length} edges
              {!hasStoreData && ' (demo data)'}
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
        nodes={graphNodes}
        edges={graphEdges}
        activeNodeKinds={activeNodeKinds}
        activeEdgeKinds={activeEdgeKinds}
        searchQuery={searchQuery}
        showLabels={showLabels}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        nodePositions={mergedPositions}
        onUpdateNodePosition={handleUpdateNodePosition}
      />

      {/* Node detail panel */}
      <AnimatePresence>
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            edges={graphEdges}
            allNodes={graphNodes}
            onSelectNode={setSelectedNodeId}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
