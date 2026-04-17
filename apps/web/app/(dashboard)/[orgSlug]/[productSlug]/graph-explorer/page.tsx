'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Sparkles, Share2, X, RefreshCw, CheckCircle2, Plus } from 'lucide-react'
import { useProduct } from '../layout'
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
import { AddNodeModal, EditNodeModal, AddEdgeModal } from './_components/node-crud-modals'
import { AIAnalysisPanel } from './_components/ai-analysis-panel'
import { AIScaffoldModal } from './_components/ai-scaffold-modal'
import { trpc } from '../../../../lib/trpc'

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
  const searchParams = useSearchParams()
  const product = useProduct()
  const productId = product?.id ?? (params.productSlug as string)

  // ── Queries ──────────────────────────────────────────────────────────────
  const enabled = !!product?.id
  const nodesQuery = trpc.graph.getNodes.useQuery(
    { productId: product?.id ?? '' },
    { enabled, staleTime: 0 },
  )
  const edgesQuery = trpc.graph.getEdges.useQuery(
    { productId: product?.id ?? '' },
    { enabled, staleTime: 0 },
  )

  // ── Mutations ────────────────────────────────────────────────────────────
  const createNodeMutation = trpc.graph.createNode.useMutation({
    onSuccess: () => { nodesQuery.refetch() },
  })
  const updateNodeMutation = trpc.graph.updateNode.useMutation({
    onSuccess: () => { nodesQuery.refetch() },
  })
  const deleteNodeMutation = trpc.graph.deleteNode.useMutation({
    onSuccess: () => { nodesQuery.refetch(); edgesQuery.refetch() },
  })
  const createEdgeMutation = trpc.graph.createEdge.useMutation({
    onSuccess: () => { edgesQuery.refetch() },
  })
  const deleteEdgeMutation = trpc.graph.deleteEdge.useMutation({
    onSuccess: () => { edgesQuery.refetch() },
  })

  // ── Store hydration ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!nodesQuery.data) return
    const rows = nodesQuery.data as Array<{ id: string; kind: string; label: string; data: unknown; productId: string; createdAt: unknown; updatedAt: unknown }>
    useGraphStore.setState((s) => {
      const existing = new Map(s.nodes.map((n) => [n.id, n]))
      for (const r of rows) {
        existing.set(r.id, {
          id: r.id,
          kind: r.kind as NodeKind,
          label: r.label,
          data: (r.data ?? {}) as Record<string, unknown>,
          productId: r.productId,
          createdAt: (r.createdAt as string) ?? '',
          updatedAt: (r.updatedAt as string) ?? '',
        })
      }
      return { nodes: Array.from(existing.values()) }
    })
  }, [nodesQuery.data])

  useEffect(() => {
    if (!edgesQuery.data) return
    const rows = edgesQuery.data as Array<{ id: string; kind: string; sourceId: string; targetId: string; productId: string; createdAt: unknown }>
    useGraphStore.setState((s) => {
      const existing = new Map(s.edges.map((e) => [e.id, e]))
      for (const r of rows) {
        existing.set(r.id, {
          id: r.id,
          kind: r.kind as EdgeKind,
          sourceId: r.sourceId,
          targetId: r.targetId,
          productId: r.productId,
          createdAt: (r.createdAt as string) ?? '',
        })
      }
      return { edges: Array.from(existing.values()) }
    })
  }, [edgesQuery.data])

  // ── Success banner ───────────────────────────────────────────────────────
  const fromParam = searchParams?.get('from')
  const fromTemplate = fromParam === 'template'
  const fromPlanner = fromParam === 'planner'
  const [showBanner, setShowBanner] = useState(fromTemplate || fromPlanner)
  useEffect(() => {
    if (!showBanner) return
    const t = setTimeout(() => setShowBanner(false), 5000)
    return () => clearTimeout(t)
  }, [showBanner])

  const isRefreshing = nodesQuery.isFetching || edgesQuery.isFetching
  const handleRefresh = useCallback(() => {
    nodesQuery.refetch()
    edgesQuery.refetch()
  }, [nodesQuery, edgesQuery])

  // ── Store selectors ──────────────────────────────────────────────────────
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

  // ── Layout / filter state ────────────────────────────────────────────────
  const buildInitialPositions = useCallback(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const node of graphNodes) {
      positions[node.id] = { x: node.x, y: node.y }
    }
    return positions
  }, [graphNodes])

  const [activeNodeKinds, setActiveNodeKinds] = useState<Set<NodeKind>>(new Set(ALL_NODE_KINDS))
  const [activeEdgeKinds, setActiveEdgeKinds] = useState<Set<EdgeKind>>(new Set(ALL_EDGE_KINDS))
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

  // ── Modal / panel state ───────────────────────────────────────────────────
  const [addNodeOpen, setAddNodeOpen] = useState(false)
  const [editNode, setEditNode] = useState<LocalGraphNode | null>(null)
  const [connectSourceNode, setConnectSourceNode] = useState<LocalGraphNode | null>(null)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [scaffoldOpen, setScaffoldOpen] = useState(false)

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleCreateNode = useCallback(
    async (label: string, kind: NodeKind, data: Record<string, string>) => {
      if (!product?.id) return
      const node = await createNodeMutation.mutateAsync({
        productId: product.id,
        kind,
        label,
        data,
        position: { x: CENTER_X, y: CENTER_Y },
      })
      // Place new node at canvas center
      setNodePositions((prev) => ({ ...prev, [node.id]: { x: CENTER_X, y: CENTER_Y } }))
    },
    [product?.id, createNodeMutation]
  )

  const handleUpdateNode = useCallback(
    async (id: string, label: string, data: Record<string, string>) => {
      await updateNodeMutation.mutateAsync({ id, label, data })
    },
    [updateNodeMutation]
  )

  const handleDeleteNode = useCallback(
    async (nodeId: string) => {
      await deleteNodeMutation.mutateAsync({ id: nodeId })
      setSelectedNodeId(null)
      // Optimistic: remove from store immediately
      useGraphStore.setState((s) => ({
        nodes: s.nodes.filter((n) => n.id !== nodeId),
        edges: s.edges.filter((e) => e.sourceId !== nodeId && e.targetId !== nodeId),
      }))
    },
    [deleteNodeMutation]
  )

  const handleCreateEdge = useCallback(
    async (sourceId: string, targetId: string, kind: EdgeKind) => {
      if (!product?.id) return
      await createEdgeMutation.mutateAsync({ productId: product.id, sourceId, targetId, kind })
    },
    [product?.id, createEdgeMutation]
  )

  const handleDeleteEdge = useCallback(
    async (edgeId: string) => {
      await deleteEdgeMutation.mutateAsync({ id: edgeId })
      // Optimistic: remove from store immediately
      useGraphStore.setState((s) => ({
        edges: s.edges.filter((e) => e.id !== edgeId),
      }))
    },
    [deleteEdgeMutation]
  )

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* Template apply success banner */}
      {showBanner && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 border-b border-[#10B981]/20 text-[#10B981] text-[11px] shrink-0">
          <CheckCircle2 size={13} />
          {fromPlanner ? (
            <>
              <span className="font-medium">Product launched!</span>
              <span className="text-[#10B981]/70">Your plan has been committed — features, entities and tasks are now in the graph.</span>
            </>
          ) : (
            <>
              <span className="font-medium">Template applied successfully!</span>
              <span className="text-[#10B981]/70">Your product graph now includes all template nodes and edges below.</span>
            </>
          )}
          <button onClick={() => setShowBanner(false)} className="ml-auto text-[#10B981]/60 hover:text-[#10B981]"><X size={12} /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 shrink-0 h-[var(--toolbar-h)] border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-2">
          <Share2 size={14} className="text-[var(--text-secondary)]" />
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">Graph Explorer</span>
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {graphNodes.length} nodes · {graphEdges.length} edges
          </span>
          {hasStoreData ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)]">live</span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-tertiary)]">sample</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="tool-btn text-[var(--text-tertiary)]"
            title="Refresh graph from DB"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-[10px]">{isRefreshing ? 'Syncing…' : 'Refresh'}</span>
          </button>
          <button
            onClick={() => setAddNodeOpen(true)}
            className="tool-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Add a new node"
          >
            <Plus size={12} />
            <span className="text-[10px]">Add Node</span>
          </button>
          <button
            onClick={() => setScaffoldOpen(true)}
            className="tool-btn text-[var(--accent-text)]"
            title="Generate graph from description"
          >
            <Sparkles size={12} />
            AI: Generate
          </button>
          <button
            onClick={() => setAiPanelOpen((v) => !v)}
            className={`tool-btn transition-colors ${aiPanelOpen ? 'text-[#A78BFA] bg-[#8B5CF6]/10' : 'text-[var(--accent-text)]'}`}
          >
            <Sparkles size={12} />
            AI: Analyze
          </button>
        </div>
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
          <div className="shrink-0 w-[260px] border-l border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col">
            <NodeDetailPanel
              node={selectedNode}
              edges={graphEdges}
              allNodes={graphNodes}
              productId={productId}
              onSelectNode={setSelectedNodeId}
              onClose={() => setSelectedNodeId(null)}
              onEdit={(n) => setEditNode(n)}
              onDelete={handleDeleteNode}
              onConnect={(n) => setConnectSourceNode(n)}
              onDeleteEdge={handleDeleteEdge}
              onCreateEdge={handleCreateEdge}
            />
          </div>
        )}

        {/* AI Analysis panel */}
        <AnimatePresence>
          {aiPanelOpen && product?.id && (
            <AIAnalysisPanel
              key="ai-analysis"
              productId={product.id}
              nodes={graphNodes}
              edges={graphEdges}
              onClose={() => setAiPanelOpen(false)}
              onSelectNode={setSelectedNodeId}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {scaffoldOpen && product?.id && (
          <AIScaffoldModal
            key="ai-scaffold"
            productId={product.id}
            onClose={() => setScaffoldOpen(false)}
            onSuccess={() => { nodesQuery.refetch(); edgesQuery.refetch() }}
          />
        )}
        {addNodeOpen && (
          <AddNodeModal
            key="add-node"
            onClose={() => setAddNodeOpen(false)}
            onSubmit={handleCreateNode}
          />
        )}
        {editNode && (
          <EditNodeModal
            key="edit-node"
            node={editNode}
            onClose={() => setEditNode(null)}
            onSubmit={handleUpdateNode}
          />
        )}
        {connectSourceNode && (
          <AddEdgeModal
            key="add-edge"
            sourceNode={connectSourceNode}
            allNodes={graphNodes}
            onClose={() => setConnectSourceNode(null)}
            onSubmit={handleCreateEdge}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
