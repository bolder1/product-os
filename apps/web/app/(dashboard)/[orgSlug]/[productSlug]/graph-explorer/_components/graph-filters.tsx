'use client'

import { motion } from 'framer-motion'
import { Search, RotateCcw, Eye, EyeOff } from 'lucide-react'
import {
  type NodeKind,
  type EdgeKind,
  NODE_KIND_COLORS,
  NODE_KIND_LABELS,
  EDGE_KIND_LABELS,
} from '../_data/mock-graph'

interface GraphFiltersProps {
  activeNodeKinds: Set<NodeKind>
  onToggleNodeKind: (kind: NodeKind) => void
  activeEdgeKinds: Set<EdgeKind>
  onToggleEdgeKind: (kind: EdgeKind) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  showLabels: boolean
  onToggleLabels: () => void
  onResetLayout: () => void
}

const allNodeKinds: NodeKind[] = [
  'module',
  'feature',
  'page',
  'entity',
  'component',
  'workflow',
  'token',
  'journey',
]

const allEdgeKinds: EdgeKind[] = [
  'contains',
  'depends_on',
  'implements',
  'uses_component',
  'routes_to',
]

export function GraphFilters({
  activeNodeKinds,
  onToggleNodeKind,
  activeEdgeKinds,
  onToggleEdgeKind,
  searchQuery,
  onSearchChange,
  showLabels,
  onToggleLabels,
  onResetLayout,
}: GraphFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 flex-wrap"
    >
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-3 py-2 rounded-lg text-xs text-[#F1F5F9] bg-white/[0.03] border border-white/[0.08] placeholder:text-[#64748B] focus:outline-none focus:border-[#8B5CF6]/40 focus:ring-1 focus:ring-[#8B5CF6]/20 w-48 transition-colors"
        />
      </div>

      {/* Node type filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {allNodeKinds.map((kind) => {
          const active = activeNodeKinds.has(kind)
          const color = NODE_KIND_COLORS[kind]
          return (
            <button
              key={kind}
              onClick={() => onToggleNodeKind(kind)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                active
                  ? 'bg-white/[0.08] text-[#F1F5F9]'
                  : 'bg-white/[0.02] text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full transition-opacity"
                style={{ backgroundColor: color, opacity: active ? 1 : 0.3 }}
              />
              {NODE_KIND_LABELS[kind]}
            </button>
          )
        })}
      </div>

      {/* Edge type filters */}
      <div className="flex items-center gap-1 flex-wrap">
        {allEdgeKinds.map((kind) => {
          const active = activeEdgeKinds.has(kind)
          return (
            <button
              key={kind}
              onClick={() => onToggleEdgeKind(kind)}
              className={`px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                active
                  ? 'bg-white/[0.06] text-[#94A3B8]'
                  : 'bg-white/[0.02] text-[#64748B]/50 hover:text-[#64748B]'
              }`}
            >
              {EDGE_KIND_LABELS[kind]}
            </button>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={onToggleLabels}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[#94A3B8] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
        >
          {showLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          Labels
        </button>
        <button
          onClick={onResetLayout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[#94A3B8] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>
    </motion.div>
  )
}
