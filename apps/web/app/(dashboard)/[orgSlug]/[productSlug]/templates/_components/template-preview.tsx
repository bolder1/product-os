'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Play, Circle } from 'lucide-react'
import { useMemo } from 'react'
import type { Template, TemplateNode } from '../_data/templates'

/**
 * Node-kind differentiation is now carried by icon + label rather than by a
 * per-kind hue. All nodes render with the single `--accent` tone.
 */

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
    const lines: { x1: number; y1: number; x2: number; y2: number; kind: 'primary' | 'subtle' }[] = []
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
        lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, kind: 'primary' })
      }
    }
    // Add a few more cross-connections for visual richness
    for (let i = 0; i < Math.min(positioned.length - 1, 5); i++) {
      const from = positioned[i]
      const to = positioned[Math.min(i + 3, positioned.length - 1)]
      lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, kind: 'subtle' })
    }

    return lines
  }, [positioned])

  return (
    <svg viewBox="0 0 360 280" className="w-full h-full text-[var(--accent)]">
      {/* Edges */}
      {edges.map((edge, i) => (
        <motion.line
          key={`e-${i}`}
          x1={edge.x1}
          y1={edge.y1}
          x2={edge.x2}
          y2={edge.y2}
          stroke={edge.kind === 'primary' ? 'currentColor' : 'var(--border-subtle)'}
          strokeWidth={1.2}
          strokeOpacity={edge.kind === 'primary' ? 0.35 : 0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
        />
      ))}
      {/* Nodes */}
      {positioned.map((p, i) => (
        <motion.g
          key={`n-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <circle cx={p.x} cy={p.y} r={10} fill="currentColor" fillOpacity={0.15} stroke="currentColor" strokeWidth={1.5} strokeOpacity={0.5} />
          <circle cx={p.x} cy={p.y} r={3.5} fill="currentColor" fillOpacity={0.8} />
          <title>{p.node.label}</title>
        </motion.g>
      ))}
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
          className="absolute inset-0 bg-[var(--bg-base)]/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-5xl max-h-[85vh] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">{template.name}</h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{template.category} template</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
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
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Description</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{template.description}</p>
              </div>

              {/* Variables */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Variables</h3>
                <div className="space-y-2">
                  {template.variables.map((v) => (
                    <div
                      key={v.key}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]"
                    >
                      <span className="text-sm text-[var(--text-primary)]">{v.label}</span>
                      <span className="text-xs text-[var(--text-tertiary)] font-mono">{v.default}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nodes grouped by kind */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-3">Nodes</h3>
                <div className="space-y-4">
                  {Object.entries(groupedNodes).map(([kind, nodes]) => (
                    <div key={kind}>
                      <div className="flex items-center gap-2 mb-2">
                        <Circle
                          className="w-2.5 h-2.5 text-[var(--accent)]"
                          fill="currentColor"
                          stroke="none"
                        />
                        <span className="text-xs font-medium text-[var(--text-secondary)] capitalize">{kind}s</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">({nodes.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-4">
                        {nodes.map((n) => (
                          <span
                            key={n.label}
                            className="px-2.5 py-1 rounded-md text-xs border bg-[var(--accent-subtle)] border-[var(--border-subtle)] text-[var(--accent-text)]"
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
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Connections</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {template.edgeCount} edges connecting {template.nodeCount} nodes across{' '}
                  {Object.keys(groupedNodes).length} kinds
                </p>
              </div>
            </div>

            {/* Right: Mini Graph (40%) */}
            <div className="lg:w-2/5 border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 flex items-center justify-center p-6">
              <div className="w-full aspect-[4/3]">
                <MiniGraph nodes={template.nodes} />
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              Close
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-subtle)] text-[var(--accent-text)] hover:bg-[var(--accent)]/20 border border-[var(--accent)]/20 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              AI Remix
            </button>
            <button
              onClick={() => onApply(template)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] transition-colors shadow-[0_0_20px_var(--accent-subtle)]"
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
