'use client'

import { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
  X,
  RefreshCw,
  Eye,
  Layers,
  FileCode,
  Paintbrush,
} from 'lucide-react'
import { useGraphStore, type GraphNode } from '../../lib/graph-store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriftCategory = 'design-code' | 'spec-implementation' | 'version-mismatch' | 'state-inconsistency'
export type DriftSeverity = 'high' | 'medium' | 'low'

export interface DriftItem {
  id: string
  category: DriftCategory
  severity: DriftSeverity
  title: string
  description: string
  specNode?: string
  implNode?: string
  specValue?: string
  actualValue?: string
  detectedAt: string
  suggestion: string
}

// ---------------------------------------------------------------------------
// Drift detection engine
// ---------------------------------------------------------------------------

function detectDrift(nodes: GraphNode[], productId: string): DriftItem[] {
  const pn = nodes.filter((n) => n.productId === productId)
  const drifts: DriftItem[] = []
  const now = new Date().toISOString()

  // 1. Design–Code drift: components with design specs but no code-ready flag
  const components = pn.filter((n) => n.kind === 'component')
  const screens = pn.filter((n) => n.kind === 'screen')

  for (const comp of components) {
    if (comp.data?.variants && !comp.data?.codeReady) {
      drifts.push({
        id: `drift-dc-${comp.id}`,
        category: 'design-code',
        severity: 'medium',
        title: `${comp.label}: design ahead of code`,
        description: `Component "${comp.label}" has design variants defined but no code-ready flag. Implementation may be lagging behind design.`,
        specNode: comp.label,
        specValue: 'Design: defined',
        actualValue: 'Code: not ready',
        detectedAt: now,
        suggestion: 'Mark as code-ready after implementation, or flag to the dev team.',
      })
    }
  }

  // 2. Spec–Implementation: pages defined in planner but not created in pages studio
  const features = pn.filter((n) => n.kind === 'feature')
  const pages = pn.filter((n) => n.kind === 'page')
  for (const feature of features) {
    const featureName = feature.label.toLowerCase()
    const hasPage = pages.some((p) => p.label.toLowerCase().includes(featureName))
    if (!hasPage && features.length > 0 && pages.length > 0) {
      drifts.push({
        id: `drift-si-${feature.id}`,
        category: 'spec-implementation',
        severity: 'high',
        title: `Feature "${feature.label}" has no matching page`,
        description: `Feature defined in the planner but no corresponding page found. The implementation may be incomplete.`,
        specNode: feature.label,
        specValue: 'Planned',
        actualValue: 'No page created',
        detectedAt: now,
        suggestion: 'Create a page for this feature in Pages Studio.',
      })
    }
  }

  // 3. Entity–Workflow drift: entities without workflows
  const entities = pn.filter((n) => n.kind === 'entity')
  const workflows = pn.filter((n) => n.kind === 'workflow')
  for (const entity of entities) {
    const hasWf = workflows.some((w) => {
      const payload = String(w.data?.payload ?? '')
      return payload.toLowerCase().includes(entity.label.toLowerCase())
    })
    if (!hasWf && workflows.length > 0) {
      drifts.push({
        id: `drift-ew-${entity.id}`,
        category: 'spec-implementation',
        severity: 'medium',
        title: `Entity "${entity.label}" has no workflow`,
        description: `Data entity exists but no workflow references it. Business logic may be missing.`,
        specNode: entity.label,
        specValue: 'Entity defined',
        actualValue: 'No workflow',
        detectedAt: now,
        suggestion: 'Create a workflow that processes this entity.',
      })
    }
  }

  // 4. State inconsistency: screens without components
  if (screens.length > 0 && components.length === 0) {
    drifts.push({
      id: 'drift-sc-no-comp',
      category: 'state-inconsistency',
      severity: 'medium',
      title: 'Screens exist but no components',
      description: 'Design screens are defined but no reusable components exist. This suggests the component library hasn\'t been extracted from designs.',
      specValue: `${screens.length} screens`,
      actualValue: '0 components',
      detectedAt: now,
      suggestion: 'Extract reusable components from your screen designs in Component Studio.',
    })
  }

  // 5. Token staleness: brand tokens older than other nodes (simulated)
  const tokens = pn.filter((n) => n.kind === 'token')
  if (tokens.length > 0 && components.length > 3) {
    // If token count is low relative to component count, flag potential staleness
    if (tokens.length < 3 && components.length >= 5) {
      drifts.push({
        id: 'drift-token-stale',
        category: 'version-mismatch',
        severity: 'low',
        title: 'Brand tokens may be incomplete',
        description: `Only ${tokens.length} brand token(s) defined for ${components.length} components. Brand system may not cover all component needs.`,
        specValue: `${components.length} components`,
        actualValue: `${tokens.length} tokens`,
        detectedAt: now,
        suggestion: 'Review and expand brand tokens to cover all component styles.',
      })
    }
  }

  return drifts
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const categoryMeta: Record<DriftCategory, { label: string; icon: React.ReactNode; color: string }> = {
  'design-code': { label: 'Design / Code', icon: <FileCode className="w-3.5 h-3.5" />, color: 'text-purple-400' },
  'spec-implementation': { label: 'Spec / Impl', icon: <Layers className="w-3.5 h-3.5" />, color: 'text-blue-400' },
  'version-mismatch': { label: 'Version', icon: <Clock className="w-3.5 h-3.5" />, color: 'text-amber-400' },
  'state-inconsistency': { label: 'State', icon: <Paintbrush className="w-3.5 h-3.5" />, color: 'text-rose-400' },
}

const severityColors: Record<DriftSeverity, string> = {
  high: 'border-rose-500/20 bg-rose-500/5',
  medium: 'border-amber-500/20 bg-amber-500/5',
  low: 'border-blue-500/20 bg-blue-500/5',
}

interface DriftDetectorProps {
  productId: string
  open: boolean
  onClose: () => void
}

export function DriftDetector({ productId, open, onClose }: DriftDetectorProps) {
  const allNodes = useGraphStore((s) => s.nodes)
  const [scanning, setScanning] = useState(false)
  const [filterCategory, setFilterCategory] = useState<DriftCategory | 'all'>('all')

  const drifts = useMemo(() => detectDrift(allNodes, productId), [allNodes, productId])

  const filtered = useMemo(
    () => filterCategory === 'all' ? drifts : drifts.filter((d) => d.category === filterCategory),
    [drifts, filterCategory]
  )

  const handleRescan = useCallback(() => {
    setScanning(true)
    setTimeout(() => setScanning(false), 700)
  }, [])

  const highCount = drifts.filter((d) => d.severity === 'high').length
  const medCount = drifts.filter((d) => d.severity === 'medium').length

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-[660px] max-h-[78vh] rounded-2xl border border-white/[0.1] bg-[#0A0F1E] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <GitCompare className="w-4.5 h-4.5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Drift Detector</h2>
                <p className="text-[0.6875rem] text-[#64748B]">
                  {drifts.length === 0 ? 'No drift detected' :
                    `${highCount} high, ${medCount} medium, ${drifts.length - highCount - medCount} low`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRescan}
                className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#64748B]"
              >
                <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#64748B]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-1 px-6 py-2.5 border-b border-white/[0.04]">
            {(['all', 'design-code', 'spec-implementation', 'version-mismatch', 'state-inconsistency'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.6875rem] transition-colors ${
                  filterCategory === cat
                    ? 'bg-[#6366F1]/10 text-[#818CF8]'
                    : 'text-[#475569] hover:bg-white/[0.04]'
                }`}
              >
                {cat !== 'all' && categoryMeta[cat].icon}
                {cat === 'all' ? `All (${drifts.length})` : categoryMeta[cat].label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {scanning ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
                <p className="text-sm text-[#94A3B8]">Scanning for drift...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-sm text-[#94A3B8]">No drift detected</p>
                <p className="text-[0.6875rem] text-[#475569]">
                  Specs and implementations are aligned.
                </p>
              </div>
            ) : (
              filtered.map((drift, i) => (
                <motion.div
                  key={drift.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`rounded-xl border p-4 ${severityColors[drift.severity]}`}
                >
                  <div className="flex items-start gap-3">
                    <ArrowLeftRight className={`w-4 h-4 mt-0.5 shrink-0 ${
                      drift.severity === 'high' ? 'text-rose-400' :
                      drift.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-medium text-[#F1F5F9]">{drift.title}</p>
                        <span className={`text-[0.5625rem] px-1.5 py-0.5 rounded bg-white/[0.04] ${categoryMeta[drift.category].color}`}>
                          {categoryMeta[drift.category].label}
                        </span>
                        <span className={`text-[0.5625rem] px-1.5 py-0.5 rounded ${
                          drift.severity === 'high' ? 'bg-rose-500/10 text-rose-400' :
                          drift.severity === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {drift.severity}
                        </span>
                      </div>
                      <p className="text-[0.6875rem] text-[#64748B] mt-1 leading-relaxed">
                        {drift.description}
                      </p>

                      {/* Diff view */}
                      {drift.specValue && drift.actualValue && (
                        <div className="flex items-center gap-3 mt-2 text-[0.625rem]">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                            {drift.specValue}
                          </span>
                          <ArrowLeftRight className="w-3 h-3 text-[#475569]" />
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono">
                            {drift.actualValue}
                          </span>
                        </div>
                      )}

                      <p className="text-[0.625rem] text-[#818CF8] mt-2">{drift.suggestion}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
