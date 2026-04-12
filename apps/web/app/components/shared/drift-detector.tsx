'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  GitCompare,
  CheckCircle2,
  ArrowLeftRight,
  X,
  RefreshCw,
  Layers,
  FileCode,
  Paintbrush,
  Clock,
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

  const tokens = pn.filter((n) => n.kind === 'token')
  if (tokens.length > 0 && components.length > 3) {
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

const categoryMeta: Record<DriftCategory, { label: string; icon: React.ReactNode }> = {
  'design-code': { label: 'Design / Code', icon: <FileCode className="w-3 h-3" /> },
  'spec-implementation': { label: 'Spec / Impl', icon: <Layers className="w-3 h-3" /> },
  'version-mismatch': { label: 'Version', icon: <Clock className="w-3 h-3" /> },
  'state-inconsistency': { label: 'State', icon: <Paintbrush className="w-3 h-3" /> },
}

const severityColor: Record<DriftSeverity, string> = {
  high: 'text-[var(--color-error)]',
  medium: 'text-[var(--color-warning)]',
  low: 'text-[var(--color-info)]',
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[640px] max-h-[78vh] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <GitCompare className="w-3.5 h-3.5 text-[var(--color-warning)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Drift Detector</span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {drifts.length === 0 ? 'No drift' :
                `${highCount} high, ${medCount} medium, ${drifts.length - highCount - medCount} low`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleRescan} className="tool-btn p-1">
              <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="tool-btn p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="tool-tabs px-3">
          {(['all', 'design-code', 'spec-implementation', 'version-mismatch', 'state-inconsistency'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`tool-tab flex items-center gap-1 ${filterCategory === cat ? 'active' : ''}`}
            >
              {cat !== 'all' && categoryMeta[cat].icon}
              {cat === 'all' ? `All (${drifts.length})` : categoryMeta[cat].label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-3 space-y-1.5">
          {scanning ? (
            <div className="flex items-center justify-center py-16 gap-2">
              <RefreshCw className="w-4 h-4 text-[var(--color-warning)] animate-spin" />
              <p className="text-[12px] text-[var(--text-secondary)]">Scanning for drift...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
              <p className="text-[12px] text-[var(--text-secondary)]">No drift detected</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Specs and implementations are aligned.
              </p>
            </div>
          ) : (
            filtered.map((drift) => (
              <div
                key={drift.id}
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3"
              >
                <div className="flex items-start gap-2">
                  <ArrowLeftRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${severityColor[drift.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[12px] font-medium text-[var(--text-primary)]">{drift.title}</p>
                      <span className="tool-badge">{categoryMeta[drift.category].label}</span>
                      <span className={`tool-badge ${severityColor[drift.severity]}`}>
                        {drift.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                      {drift.description}
                    </p>

                    {/* Diff view */}
                    {drift.specValue && drift.actualValue && (
                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded-sm bg-[var(--color-success)]/10 text-[var(--color-success)] font-mono">
                          {drift.specValue}
                        </span>
                        <ArrowLeftRight className="w-3 h-3 text-[var(--text-tertiary)]" />
                        <span className="px-1.5 py-0.5 rounded-sm bg-[var(--color-error)]/10 text-[var(--color-error)] font-mono">
                          {drift.actualValue}
                        </span>
                      </div>
                    )}

                    <p className="text-[10px] text-[var(--accent-text)] mt-1.5">{drift.suggestion}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
