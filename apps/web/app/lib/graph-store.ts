'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types (mirrors packages/graph schema)
// ---------------------------------------------------------------------------

export type NodeKind =
  | 'product' | 'plan' | 'template_bundle' | 'module' | 'feature' | 'journey'
  | 'page' | 'route' | 'screen' | 'workflow' | 'entity' | 'field'
  | 'component' | 'variant' | 'token' | 'asset' | 'task' | 'approval'
  | 'insight' | 'release' | 'connector_binding' | 'mcp_binding'
  | 'skill_action' | 'computer_action'

export type EdgeKind =
  | 'contains' | 'depends_on' | 'references' | 'implements'
  | 'inherits' | 'triggers' | 'routes_to' | 'uses_token'
  | 'uses_component' | 'assigned_to' | 'approves' | 'blocks'

export interface GraphNode {
  id: string
  kind: NodeKind
  label: string
  productId: string
  data: Record<string, unknown>
  status?: string
  createdAt: string
  updatedAt: string
}

export interface GraphEdge {
  id: string
  kind: EdgeKind
  sourceId: string
  targetId: string
  productId: string
  data?: Record<string, unknown>
  createdAt: string
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]

  // Node operations
  addNode: (node: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>) => GraphNode
  updateNode: (id: string, updates: Partial<GraphNode>) => void
  deleteNode: (id: string) => void
  getNode: (id: string) => GraphNode | undefined
  getNodesByKind: (productId: string, kind: NodeKind) => GraphNode[]
  getNodesByProduct: (productId: string) => GraphNode[]

  // Edge operations
  addEdge: (edge: Omit<GraphEdge, 'id' | 'createdAt'>) => GraphEdge
  deleteEdge: (id: string) => void
  getEdgesFrom: (nodeId: string) => GraphEdge[]
  getEdgesTo: (nodeId: string) => GraphEdge[]
  getConnected: (nodeId: string, edgeKind?: EdgeKind) => GraphNode[]

  // Bulk operations
  scaffoldProduct: (productId: string, name: string) => void
  bulkAddNodes: (nodes: Omit<GraphNode, 'id' | 'createdAt' | 'updatedAt'>[]) => GraphNode[]

  // Clear
  clearProduct: (productId: string) => void
}

let nodeCounter = 0
let edgeCounter = 0

function nodeId(): string {
  nodeCounter += 1
  return `node-${Date.now()}-${nodeCounter}`
}

function edgeId(): string {
  edgeCounter += 1
  return `edge-${Date.now()}-${edgeCounter}`
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],

      addNode: (data) => {
        const now = new Date().toISOString()
        const node: GraphNode = { ...data, id: nodeId(), createdAt: now, updatedAt: now }
        set((state) => ({ nodes: [...state.nodes, node] }))
        return node
      },

      updateNode: (id, updates) => {
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        }))
      },

      deleteNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          edges: state.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
        }))
      },

      getNode: (id) => get().nodes.find((n) => n.id === id),

      getNodesByKind: (productId, kind) =>
        get().nodes.filter((n) => n.productId === productId && n.kind === kind),

      getNodesByProduct: (productId) =>
        get().nodes.filter((n) => n.productId === productId),

      addEdge: (data) => {
        const edge: GraphEdge = { ...data, id: edgeId(), createdAt: new Date().toISOString() }
        set((state) => ({ edges: [...state.edges, edge] }))
        return edge
      },

      deleteEdge: (id) => {
        set((state) => ({ edges: state.edges.filter((e) => e.id !== id) }))
      },

      getEdgesFrom: (nodeId) => get().edges.filter((e) => e.sourceId === nodeId),

      getEdgesTo: (nodeId) => get().edges.filter((e) => e.targetId === nodeId),

      getConnected: (nId, edgeKind) => {
        const { edges, nodes } = get()
        const connectedIds = new Set<string>()
        for (const e of edges) {
          if (edgeKind && e.kind !== edgeKind) continue
          if (e.sourceId === nId) connectedIds.add(e.targetId)
          if (e.targetId === nId) connectedIds.add(e.sourceId)
        }
        return nodes.filter((n) => connectedIds.has(n.id))
      },

      scaffoldProduct: (productId, name) => {
        const now = new Date().toISOString()
        const productNode: GraphNode = {
          id: nodeId(),
          kind: 'product',
          label: name,
          productId,
          data: { name, status: 'active' },
          createdAt: now,
          updatedAt: now,
        }
        const planNode: GraphNode = {
          id: nodeId(),
          kind: 'plan',
          label: `${name} Plan`,
          productId,
          data: { status: 'draft' },
          createdAt: now,
          updatedAt: now,
        }
        const planEdge: GraphEdge = {
          id: edgeId(),
          kind: 'contains',
          sourceId: productNode.id,
          targetId: planNode.id,
          productId,
          createdAt: now,
        }

        set((state) => ({
          nodes: [...state.nodes, productNode, planNode],
          edges: [...state.edges, planEdge],
        }))
      },

      bulkAddNodes: (nodesData) => {
        const now = new Date().toISOString()
        const newNodes = nodesData.map((nd) => ({
          ...nd,
          id: nodeId(),
          createdAt: now,
          updatedAt: now,
        }))
        set((state) => ({ nodes: [...state.nodes, ...newNodes] }))
        return newNodes
      },

      clearProduct: (productId) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.productId !== productId),
          edges: state.edges.filter((e) => e.productId !== productId),
        }))
      },
    }),
    {
      name: 'product-os-graph',
    }
  )
)
