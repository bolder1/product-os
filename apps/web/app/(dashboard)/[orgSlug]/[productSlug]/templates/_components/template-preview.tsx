'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Play, Circle } from 'lucide-react'
import { useMemo } from 'react'
import type { Template, TemplateNode } from '../_data/templates'

const kindColors: Record<string, string> = {
  module: '#3B82F6',
  feature: '#8B5CF6',
  page: '#06B6D4',
  entity: '#10B981',
  component: '#F59E0B',
  token: '#EC4899',
  workflow: '#10B981',
  screen: '#06B6D4',
  variant: '#F43F5E',
  journey: '#8B5CF6',
  asset: '#64748B',
}

interface TemplatePreviewProps {
  template: Template | null
  onClose: () => void
  onApply: (template: Template) => void
}

function MiniGraph({ nodes }: { nodes: TemplateNode[] }) {
  const positioned = useMemo(() => {
    const grouped: Record<string, TemplateNode[]> = {}
    nodes.forEach((n) => {
      if (!grouped[n.kind]) grouped[n.kind] = []
      grouped[n.kind].push(n)
    })

    const kinds = Object.keys(grouped)
    const result: { node: TemplateNode; x: number; y: number }[] = []
    const centerX = 180
    const centerY = 140
    const layerGap = 70

    kinds.forEach((kind, ki) => {
      const group = grouped[kind]
      const angle = (ki / kinds.length) * Math.PI * 2 - Math.PI / 2
      const layerX = centerX + Math.cos(angle) * layerGap
      const layerY = centerY + Math.sin(angle) * layerGap

      group.forEach((node, ni) => {
        const spread = 28
        const offset = (ni - (group.length - 1) / 2) * spread
        const perpAngle = angle + Math.PI / 2
        result.push({
          node,
          x: layerX + Math.cos(perpAngle) * offset,
          y: layerY + Math.sin(perpAngle) * offset,
        })
      })
    })

    return result
  }, [nodes])

  const edges = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = []
    const kindGroups: Record<string, typeof positioned> = {}
    positioned.forEach((p) => {
      if (!kindGroups[p.node.kind]) kindGroups[p.node.kind] = []
      kindGroups[p.node.kind].push(p)
    })

    const groupKeys = Object.keys(kindGroups)
    for (let i = 0; i < groupKeys.length - 1; i++) {
      const fromGroup = kindGroups[groupKeys[i]]
      const toGroup = kindGroups[groupKeys[i + 1]]
      if (fromGroup.length > 0 && toGroup.length > 0) {
        const from = fromGroup[0]
        const to = toGroup[0]
        lines.push({
          x1: from.x,
          y1: from.y,
          x2: to.x,
          y2: to.y,
          color: kindColors[from.node.kind] || '#64748B',
        })
      }
    }
    // Add a few more cross-connections for visual richness
    for (let i = 0; i < Math.min(positioned.length - 1, 5); i++) {
      const from = positioned[i]
      const to = positioned[Math.min(i + 3, positioned.length - 1)]
      lines.push({
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        color: 'rgba(255,255,255,0.06)',
      })
    }

    return lines
  }, [positioned])

  return (
    <svg viewBox="0 0 360 280" className="w-full h-full">
      {/* Edges */}
      {edges.map((edge, i) => (
        <motion.line
          key={`e-${i}`}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          stroke={edge.color}
          strokeWidth={1.2}
          strokeOpacity={0.35}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
        />
      ))}
      {/* Nodes */}
      {positioned.map((p, i) => {
        const color = kindColors[p.node.kind] || '#64748B'
        return (
          <motion.g
            key={`n-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
          >
            <circle cx={p.x} cy={p.y} r={10} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} strokeOpacity={0.5} />
            <circle cx={p.x} cy={p.y} r={3.5} fill={color} fillOpacity={0.8} />
            <title>{p.node.label}</title>
          </motion.g>
        )
      })}
    </svg>
  )
}

export function TemplatePreview({ template, onClose, onApply }: TemplatePreviewProps) {
  if (!template) return null

  const groupedNodes = useMemo(() => {
    const groups: Record<string, TemplateNode[]> = {}
    template.nodes.forEach((n) => {
      if (!groups[n.kind]) groups[n.kind] = []
      groups[n.kind].push(n)
    })
    return groups
  }, [template.nodes])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#060918]/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl bg-[#0C1024] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-semibold text-[#F1F5F9]">{template.name}</h2>
              <p className="text-xs text-[#64748B] mt-0.5">{template.category} template</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-[#64748B] hover:text-[#94A3B8] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto flex flex-col lg:flex-row">
            {/* Left: Details (60%) */}
            <div className="flex-1 lg:w-3/5 p-6 overflow-auto space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-2">Description</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">{template.description}</p>
              </div>

              {/* Variables */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-3">Variables</h3>
                <div className="space-y-2">
                  {template.variables.map((v) => (
                    <div
                      key={v.key}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                    >
                      <span className="text-sm text-[#F1F5F9]">{v.label}</span>
                      <span className="text-xs text-[#64748B] font-mono">{v.default}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nodes grouped by kind */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-3">Nodes</h3>
                <div className="space-y-4">
                  {Object.entries(groupedNodes).map(([kind, nodes]) => (
                    <div key={kind}>
                      <div className="flex items-center gap-2 mb-2">
                        <Circle
                          className="w-2.5 h-2.5"
                          fill={kindColors[kind] || '#64748B'}
                          stroke="none"
                        />
                        <span className="text-xs font-medium text-[#94A3B8] capitalize">{kind}s</span>
                        <span className="text-[10px] text-[#64748B]">({nodes.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-4">
                        {nodes.map((n) => (
                          <span
                            key={n.label}
                            className="px-2.5 py-1 rounded-md text-xs border"
                            style={{
                              backgroundColor: `${kindColors[kind] || '#64748B'}10`,
                              borderColor: `${kindColors[kind] || '#64748B'}20`,
                              color: kindColors[kind] || '#64748B',
                            }}
                          >
                            {n.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edge summary */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#64748B] mb-2">Connections</h3>
                <p className="text-sm text-[#94A3B8]">
                  {template.edgeCount} edges connecting {template.nodeCount} nodes across{' '}
                  {Object.keys(groupedNodes).length} kinds
                </p>
              </div>
            </div>

            {/* Right: Mini Graph (40%) */}
            <div className="lg:w-2/5 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-white/[0.01] flex items-center justify-center p-6">
              <div className="w-full aspect-[4/3]">
                <MiniGraph nodes={template.nodes} />
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.06] transition-colors"
            >
              Close
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/20 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              AI Remix
            </button>
            <button
              onClick={() => onApply(template)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            >
              <Play className="w-3.5 h-3.5" />
              Customize & Apply
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
