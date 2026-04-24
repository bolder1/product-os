'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Sparkles, ArrowRight, ArrowLeft, X, Pencil, Trash2, Link2 } from 'lucide-react'
import {
  type GraphNode,
  type GraphEdge,
  type EdgeKind,
  NODE_KIND_COLORS,
  NODE_KIND_LABELS,
} from '../_data/mock-graph'
import { NodeAISuggestPanel } from './node-ai-suggest-panel'
import { nodeStudioHref } from '../../_lib/node-studio-link'

interface NodeDetailPanelProps {
  node: GraphNode
  edges: GraphEdge[]
  allNodes: GraphNode[]
  productId: string
  onSelectNode: (id: string) => void
  onClose: () => void
  onEdit: (node: GraphNode) => void
  onDelete: (nodeId: string) => void
  onConnect: (node: GraphNode) => void
  onDeleteEdge: (edgeId: string) => void
  onCreateEdge: (sourceId: string, targetId: string, edgeKind: EdgeKind) => void
}

export function NodeDetailPanel({
  node,
  edges,
  allNodes,
  productId,
  onSelectNode,
  onClose,
  onEdit,
  onDelete,
  onConnect,
  onDeleteEdge,
  onCreateEdge,
}: NodeDetailPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const color = NODE_KIND_COLORS[node.kind]
  const router = useRouter()
  const params = useParams<{ orgSlug: string; productSlug: string }>()

  const studioLink = nodeStudioHref(
    `/${params.orgSlug}/${params.productSlug}`,
    node.kind,
    node.id,
  )
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]))

  const incomingEdges = edges.filter((e) => e.target === node.id)
  const outgoingEdges = edges.filter((e) => e.source === node.id)

  // edges as simple objects for the AI panel
  const edgesForAI = edges.map((e) => ({ id: e.id, source: e.source, target: e.target, kind: e.kind }))

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(node.id)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 px-3 py-3 border-b border-[var(--border-default)] shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {node.label.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight truncate">{node.label}</h3>
          <span
            className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-1 uppercase tracking-wide"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {NODE_KIND_LABELS[node.kind]}
          </span>
        </div>
        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors shrink-0 mt-0.5">
          <X size={13} />
        </button>
      </div>

      {/* Swappable body: detail view OR AI suggest panel */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {aiOpen ? (
            <motion.div
              key="ai"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex flex-col"
            >
              <NodeAISuggestPanel
                node={node}
                allNodes={allNodes}
                allEdges={edgesForAI}
                productId={productId}
                onClose={() => setAiOpen(false)}
                onConnect={(sourceId, targetId, edgeKind) => {
                  onCreateEdge(sourceId, targetId, edgeKind as EdgeKind)
                  setAiOpen(false)
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 overflow-y-auto flex flex-col divide-y divide-[var(--border-default)]"
            >
              {/* Properties */}
              {Object.keys(node.data).length > 0 && (
                <div className="px-3 py-2.5 flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">Properties</span>
                  <div className="flex flex-col gap-1">
                    {Object.entries(node.data).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[var(--text-tertiary)] capitalize shrink-0">{key}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium truncate text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming */}
              <div className="px-3 py-2.5 flex flex-col gap-1.5">
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                  Incoming ({incomingEdges.length})
                </span>
                {incomingEdges.length === 0 ? (
                  <span className="text-[10px] text-[var(--text-tertiary)] italic">None</span>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {incomingEdges.map((edge) => {
                      const sourceNode = nodeMap.get(edge.source)
                      if (!sourceNode) return null
                      const srcColor = NODE_KIND_COLORS[sourceNode.kind]
                      return (
                        <div key={edge.id} className="group flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectNode(edge.source)}
                            className="flex items-center gap-1.5 flex-1 min-w-0 text-left hover:text-[var(--text-primary)] text-[var(--text-secondary)] transition-colors"
                          >
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: srcColor }} />
                            <ArrowLeft size={9} className="text-[var(--text-tertiary)] shrink-0" />
                            <span className="text-[10px] truncate">{sourceNode.label}</span>
                            <span className="text-[9px] text-[var(--text-tertiary)] shrink-0">({edge.kind.replace(/_/g, ' ')})</span>
                          </button>
                          <button
                            onClick={() => onDeleteEdge(edge.id)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
                            title="Remove connection"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Outgoing */}
              <div className="px-3 py-2.5 flex flex-col gap-1.5">
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                  Outgoing ({outgoingEdges.length})
                </span>
                {outgoingEdges.length === 0 ? (
                  <span className="text-[10px] text-[var(--text-tertiary)] italic">None</span>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {outgoingEdges.map((edge) => {
                      const targetNode = nodeMap.get(edge.target)
                      if (!targetNode) return null
                      const tgtColor = NODE_KIND_COLORS[targetNode.kind]
                      return (
                        <div key={edge.id} className="group flex items-center gap-1.5">
                          <button
                            onClick={() => onSelectNode(edge.target)}
                            className="flex items-center gap-1.5 flex-1 min-w-0 text-left hover:text-[var(--text-primary)] text-[var(--text-secondary)] transition-colors"
                          >
                            <ArrowRight size={9} className="text-[var(--text-tertiary)] shrink-0" />
                            <span className="text-[10px] truncate">{targetNode.label}</span>
                            <div className="w-1.5 h-1.5 rounded-full shrink-0 ml-auto" style={{ backgroundColor: tgtColor }} />
                            <span className="text-[9px] text-[var(--text-tertiary)] shrink-0">({edge.kind.replace(/_/g, ' ')})</span>
                          </button>
                          <button
                            onClick={() => onDeleteEdge(edge.id)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
                            title="Remove connection"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons — always visible */}
      <div className="shrink-0 border-t border-[var(--border-default)] px-3 py-2 flex flex-col gap-1.5">
        {/* CRUD row */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(node)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)] transition-all"
          >
            <Pencil size={10} />
            Edit
          </button>
          <button
            onClick={() => onConnect(node)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)] transition-all"
          >
            <Link2 size={10} />
            Connect
          </button>
          <button
            onClick={handleDeleteClick}
            onBlur={() => setConfirmDelete(false)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ml-auto ${
              confirmDelete
                ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                : 'text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Trash2 size={10} />
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>

        {/* Utility row */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(studioLink.href)}
            title={`Open in ${studioLink.label}`}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--accent-text)] hover:bg-[var(--accent-bg)] transition-all"
          >
            <ExternalLink size={10} />
            {studioLink.label}
          </button>
          <button
            onClick={() => setAiOpen((p) => !p)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
              aiOpen
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                : 'text-[var(--accent-text)] hover:bg-[var(--accent-bg)]'
            }`}
          >
            <Sparkles size={10} />
            {aiOpen ? 'Hide AI' : 'AI: Analyze'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
