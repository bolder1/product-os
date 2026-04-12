'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Sparkles, ArrowRight, ArrowLeft, X } from 'lucide-react'
import {
  type GraphNode,
  type GraphEdge,
  NODE_KIND_COLORS,
  NODE_KIND_LABELS,
} from '../_data/mock-graph'

interface NodeDetailPanelProps {
  node: GraphNode
  edges: GraphEdge[]
  allNodes: GraphNode[]
  onSelectNode: (id: string) => void
  onClose: () => void
}

export function NodeDetailPanel({
  node,
  edges,
  allNodes,
  onSelectNode,
  onClose,
}: NodeDetailPanelProps) {
  const color = NODE_KIND_COLORS[node.kind]
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]))

  const incomingEdges = edges.filter((e) => e.target === node.id)
  const outgoingEdges = edges.filter((e) => e.source === node.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {node.label.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-[#F1F5F9] truncate">{node.label}</h3>
          <span
            className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {NODE_KIND_LABELS[node.kind]}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#64748B] hover:text-[#94A3B8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Properties */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[#64748B]">Properties</span>
          <div className="flex flex-col gap-1.5">
            {Object.entries(node.data).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-[#64748B] capitalize">{key}</span>
                <span className="text-xs text-[#94A3B8] font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incoming connections */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
            Incoming ({incomingEdges.length})
          </span>
          <div className="flex flex-col gap-1">
            {incomingEdges.length === 0 && (
              <span className="text-xs text-[#64748B]">No incoming edges</span>
            )}
            {incomingEdges.map((edge) => {
              const sourceNode = nodeMap.get(edge.source)
              if (!sourceNode) return null
              return (
                <button
                  key={edge.id}
                  onClick={() => onSelectNode(edge.source)}
                  className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors text-left"
                >
                  <ArrowLeft className="w-3 h-3 text-[#64748B] shrink-0" />
                  <span className="truncate">{sourceNode.label}</span>
                  <span className="text-[#64748B] text-[10px]">({edge.kind.replace('_', ' ')})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Outgoing connections */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
            Outgoing ({outgoingEdges.length})
          </span>
          <div className="flex flex-col gap-1">
            {outgoingEdges.length === 0 && (
              <span className="text-xs text-[#64748B]">No outgoing edges</span>
            )}
            {outgoingEdges.map((edge) => {
              const targetNode = nodeMap.get(edge.target)
              if (!targetNode) return null
              return (
                <button
                  key={edge.id}
                  onClick={() => onSelectNode(edge.target)}
                  className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors text-left"
                >
                  <ArrowRight className="w-3 h-3 text-[#64748B] shrink-0" />
                  <span className="truncate">{targetNode.label}</span>
                  <span className="text-[#64748B] text-[10px]">({edge.kind.replace('_', ' ')})</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 transition-colors">
          <ExternalLink className="w-3 h-3" />
          View in Studio
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 transition-colors">
          <Sparkles className="w-3 h-3" />
          AI: Analyze dependencies
        </button>
      </div>
    </motion.div>
  )
}
