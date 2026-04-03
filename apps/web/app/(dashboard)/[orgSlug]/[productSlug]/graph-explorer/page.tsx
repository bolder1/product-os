'use client'

import { useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Sparkles, Share2, X } from 'lucide-react'
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
// Layout helper
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
// Store converters
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

  const allStoreNodes = useGraphStore((s) => s.nodes)
  const allStoreEdges = useGraphStore((s) => s.edges)

  const productStoreNodes = useMemo(
    () => allStoreNodes.filter((n) => n.productId === productId),
    [allStoreNodes, productId]
  )
  const productStoreEdges = useMemo(
    () => allStoreEdges.filter((e) => e.productId === productId),
    [allStoreEdges, productId]
  )

  const hasStoreData = productStoreNodes.length > 0

  const storeLayout = useMemo(
    () => (hasStoreData ? computeLayout(productStoreNodes) : {}),
    [hasStoreData, productStoreNodes]
  )

  const graphNodes: LocalGraphNode[] = useMemo(
    () => (hasStoreData ? storeNodesToLocal(productStoreNodes, storeLayout) : mockGraphData.nodes),
    [hasStoreData, productStoreNodes, storeLayout]
  )
  const graphEdges: LocalGraphEdge[] = useMemo(
    () => (hasStoreData ? storeEdgesToLocal(productStoreEdges) : mockGraphData.edges),
    [hasStoreData, productStoreEdges]
  )

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

  const positionsRef = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const node of graphNodes) {
      positions[node.id] = { x: node.x, y: node.y }
    }
    return positions
  }, [graphNodes])

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
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }, [])

  const toggleEdgeKind = useCallback((kind: EdgeKind) => {
    setActiveEdgeKinds((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
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
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 shrink-0 h-[var(--toolbar-h)] border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <Share2 size={14} className="text-[var(--text-secondary)]" />
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            Graph Explorer
          </span>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {graphNodes.length} nodes, {graphEdges.length} edges
            {!hasStoreData && ' (demo data)'}
          </span>
        </div>

        <button className="tool-btn text-[var(--accent-text)]">
          <Sparkles size={12} />
          AI: Analyze Graph
        </button>
      </div>

      {/* Filters */}
      <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
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
      </div>

      {/* Canvas + optional detail panel */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Full-bleed canvas */}
        <div className="flex-1 min-w-0">
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
        </div>

        {/* Node detail panel */}
        {selectedNode && (
          <div className="shrink-0 overflow-y-auto w-[280px] border-l border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center justify-between px-3 h-[var(--toolbar-h)] border-b border-[var(--border-default)]">
              <span className="tool-section-label" style={{ padding: 0 }}>
                Node Detail
              </span>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="tool-btn px-1 py-0.5 border-none bg-transparent"
              >
                <X size={12} />
              </button>
            </div>
            <NodeDetailPanel
              node={selectedNode}
              edges={graphEdges}
              allNodes={graphNodes}
              onSelectNode={setSelectedNodeId}
              onClose={() => setSelectedNodeId(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
