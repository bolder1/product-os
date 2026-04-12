'use client'

import { useMemo, useState, useCallback } from 'react'
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Palette,
  Type,
  Image,
  Layout,
  X,
  RefreshCw,
  ChevronRight,
  Eye,
} from 'lucide-react'
import { useGraphStore, type GraphNode } from '../../lib/graph-store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComplianceCategory = 'color' | 'typography' | 'spacing' | 'imagery' | 'layout'
export type ComplianceStatus = 'pass' | 'warning' | 'fail'

export interface ComplianceRule {
  id: string
  category: ComplianceCategory
  title: string
  description: string
  check: (brandTokens: GraphNode[], targetNodes: GraphNode[]) => ComplianceViolation[]
}

export interface ComplianceViolation {
  ruleId: string
  category: ComplianceCategory
  status: ComplianceStatus
  title: string
  description: string
  nodeId?: string
  nodeLabel?: string
  suggestion: string
}

// ---------------------------------------------------------------------------
// Built-in compliance rules
// ---------------------------------------------------------------------------

const complianceRules: ComplianceRule[] = [
  {
    id: 'brand-colors-defined',
    category: 'color',
    title: 'Brand colors defined',
    description: 'At least one brand color token must be defined.',
    check: (tokens) => {
      const colorTokens = tokens.filter((t) => t.data?.tokenType === 'brand-colors')
      if (colorTokens.length === 0) {
        return [{
          ruleId: 'brand-colors-defined',
          category: 'color',
          status: 'fail',
          title: 'No brand colors defined',
          description: 'Brand color tokens are missing. Components cannot reference brand colors.',
          suggestion: 'Open Brand Studio and define primary, secondary, and accent colors.',
        }]
      }
      return []
    },
  },
  {
    id: 'typography-defined',
    category: 'typography',
    title: 'Typography system defined',
    description: 'Brand typography tokens must exist for consistent text rendering.',
    check: (tokens) => {
      const typoTokens = tokens.filter((t) => t.data?.tokenType === 'brand-typography')
      if (typoTokens.length === 0) {
        return [{
          ruleId: 'typography-defined',
          category: 'typography',
          status: 'warning',
          title: 'No typography tokens',
          description: 'Typography tokens are not defined. Font consistency cannot be enforced.',
          suggestion: 'Define heading and body font families in Brand Studio.',
        }]
      }
      return []
    },
  },
  {
    id: 'spacing-defined',
    category: 'spacing',
    title: 'Spacing scale defined',
    description: 'Consistent spacing tokens should be defined.',
    check: (tokens) => {
      const spacingTokens = tokens.filter((t) => t.data?.tokenType === 'brand-spacing')
      if (spacingTokens.length === 0) {
        return [{
          ruleId: 'spacing-defined',
          category: 'spacing',
          status: 'warning',
          title: 'No spacing tokens',
          description: 'Spacing scale is not defined. Layouts may use inconsistent spacing.',
          suggestion: 'Define a spacing scale (4px, 8px, 12px, ...) in Brand Studio.',
        }]
      }
      return []
    },
  },
  {
    id: 'components-use-tokens',
    category: 'color',
    title: 'Components reference brand tokens',
    description: 'Components should use brand color tokens rather than hardcoded values.',
    check: (tokens, targets) => {
      const components = targets.filter((n) => n.kind === 'component')
      if (tokens.length === 0 || components.length === 0) return []
      const violations: ComplianceViolation[] = []
      for (const comp of components) {
        const payload = String(comp.data?.payload ?? '')
        const hexMatch = payload.match(/#[0-9a-fA-F]{6}/g)
        if (hexMatch && hexMatch.some((h) => h !== '#000000' && h !== '#ffffff' && h !== '#FFFFFF')) {
          violations.push({
            ruleId: 'components-use-tokens',
            category: 'color',
            status: 'warning',
            title: `Hardcoded colors in ${comp.label}`,
            description: `Component "${comp.label}" contains hardcoded hex colors instead of brand tokens.`,
            nodeId: comp.id,
            nodeLabel: comp.label,
            suggestion: 'Replace hardcoded colors with brand token references.',
          })
        }
      }
      return violations
    },
  },
  {
    id: 'pages-have-layouts',
    category: 'layout',
    title: 'Pages use consistent layouts',
    description: 'Every page should have at least one section with a defined layout.',
    check: (_tokens, targets) => {
      const pages = targets.filter((n) => n.kind === 'page')
      if (pages.length === 0) return []
      const violations: ComplianceViolation[] = []
      for (const page of pages) {
        const payload = String(page.data?.payload ?? '')
        if (payload && !payload.includes('section')) {
          violations.push({
            ruleId: 'pages-have-layouts',
            category: 'layout',
            status: 'warning',
            title: `No sections in ${page.label}`,
            description: `Page "${page.label}" appears to have no sections defined.`,
            nodeId: page.id,
            nodeLabel: page.label,
            suggestion: 'Add sections with layout configurations to this page.',
          })
        }
      }
      return violations
    },
  },
  {
    id: 'asset-tokens-exist',
    category: 'imagery',
    title: 'Brand assets uploaded',
    description: 'Logo and key brand assets should be uploaded.',
    check: (tokens, targets) => {
      const assets = targets.filter((n) => n.kind === 'asset')
      if (assets.length === 0) {
        return [{
          ruleId: 'asset-tokens-exist',
          category: 'imagery',
          status: 'warning',
          title: 'No brand assets uploaded',
          description: 'No logo or brand imagery has been added to the graph.',
          suggestion: 'Upload logo, favicon, and key brand imagery in Brand Studio.',
        }]
      }
      return []
    },
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const categoryIcons: Record<ComplianceCategory, React.ReactNode> = {
  color: <Palette className="w-3 h-3" />,
  typography: <Type className="w-3 h-3" />,
  spacing: <Layout className="w-3 h-3" />,
  imagery: <Image className="w-3 h-3" />,
  layout: <Layout className="w-3 h-3" />,
}

const statusIcons: Record<ComplianceStatus, React.ReactNode> = {
  pass: <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)]" />,
  fail: <XCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />,
}

interface BrandComplianceCheckerProps {
  productId: string
  open: boolean
  onClose: () => void
}

export function BrandComplianceChecker({ productId, open, onClose }: BrandComplianceCheckerProps) {
  const allNodes = useGraphStore((s) => s.nodes)
  const [scanning, setScanning] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ComplianceCategory | 'all'>('all')

  const productNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId),
    [allNodes, productId]
  )

  const brandTokens = useMemo(
    () => productNodes.filter((n) => n.kind === 'token'),
    [productNodes]
  )

  const violations = useMemo(() => {
    const all: ComplianceViolation[] = []
    for (const rule of complianceRules) {
      all.push(...rule.check(brandTokens, productNodes))
    }
    return all
  }, [brandTokens, productNodes])

  const filteredViolations = useMemo(
    () => activeCategory === 'all' ? violations : violations.filter((v) => v.category === activeCategory),
    [violations, activeCategory]
  )

  const passingRules = useMemo(() => {
    const failingRuleIds = new Set(violations.map((v) => v.ruleId))
    return complianceRules.filter((r) => !failingRuleIds.has(r.id))
  }, [violations])

  const overallScore = useMemo(() => {
    const total = complianceRules.length
    const passing = passingRules.length
    return Math.round((passing / total) * 100)
  }, [passingRules])

  const handleRescan = useCallback(() => {
    setScanning(true)
    setTimeout(() => setScanning(false), 600)
  }, [])

  const categories: (ComplianceCategory | 'all')[] = ['all', 'color', 'typography', 'spacing', 'imagery', 'layout']

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
            <Shield className="w-3.5 h-3.5 text-[var(--accent-text)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Brand Compliance</span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {overallScore}% compliant &middot; {violations.length} issue{violations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Score badge */}
            <span className={`tool-badge font-bold ${
              overallScore >= 80 ? 'text-[var(--color-success)]' :
              overallScore >= 50 ? 'text-[var(--color-warning)]' :
              'text-[var(--color-error)]'
            }`}>
              {overallScore}%
            </span>
            <button onClick={handleRescan} className="tool-btn p-1">
              <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="tool-btn p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="tool-tabs px-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`tool-tab flex items-center gap-1 ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat !== 'all' && categoryIcons[cat]}
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              {cat !== 'all' && (
                <span className="text-[10px] opacity-60">
                  ({violations.filter((v) => v.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-3 space-y-1.5">
          {scanning ? (
            <div className="flex items-center justify-center py-16 gap-2">
              <RefreshCw className="w-4 h-4 text-[var(--accent-text)] animate-spin" />
              <p className="text-[12px] text-[var(--text-secondary)]">Scanning for compliance issues...</p>
            </div>
          ) : (
            <>
              {/* Passing rules */}
              {activeCategory === 'all' && passingRules.length > 0 && (
                <div className="mb-2">
                  <p className="tool-section-label">Passing ({passingRules.length})</p>
                  {passingRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] mb-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[var(--color-success)] shrink-0" />
                      <span className="text-[11px] text-[var(--text-secondary)]">{rule.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Violations */}
              {filteredViolations.length > 0 && (
                <div>
                  <p className="tool-section-label">Issues ({filteredViolations.length})</p>
                  {filteredViolations.map((v, i) => (
                    <div
                      key={`${v.ruleId}-${v.nodeId ?? i}`}
                      className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3 mb-1.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0">{statusIcons[v.status]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[12px] font-medium text-[var(--text-primary)]">{v.title}</p>
                            <span className="tool-badge">{v.category}</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                            {v.description}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <ChevronRight className="w-3 h-3 text-[var(--accent-text)]" />
                            <p className="text-[10px] text-[var(--accent-text)]">{v.suggestion}</p>
                          </div>
                          {v.nodeLabel && (
                            <div className="flex items-center gap-1 mt-1">
                              <Eye className="w-3 h-3 text-[var(--text-tertiary)]" />
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                Affects: {v.nodeLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredViolations.length === 0 && passingRules.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
                  <p className="text-[12px] text-[var(--text-secondary)]">Full brand compliance</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
