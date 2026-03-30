'use client'

import { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      // Check if any component has hardcoded colors in data
      const violations: ComplianceViolation[] = []
      for (const comp of components) {
        const payload = String(comp.data?.payload ?? '')
        // Look for hex colors in payload that aren't standard black/white
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
  color: <Palette className="w-3.5 h-3.5" />,
  typography: <Type className="w-3.5 h-3.5" />,
  spacing: <Layout className="w-3.5 h-3.5" />,
  imagery: <Image className="w-3.5 h-3.5" />,
  layout: <Layout className="w-3.5 h-3.5" />,
}

const statusColors: Record<ComplianceStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  pass: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
  fail: { bg: 'bg-rose-500/10', text: 'text-rose-400', icon: <XCircle className="w-4 h-4 text-rose-400" /> },
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

  // Rules that pass (no violations)
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
              <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-[#6366F1]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Brand Compliance</h2>
                <p className="text-[0.6875rem] text-[#64748B]">
                  {overallScore}% compliant &middot; {violations.length} issue{violations.length !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Score badge */}
              <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                overallScore >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                overallScore >= 50 ? 'bg-amber-500/10 text-amber-400' :
                'bg-rose-500/10 text-rose-400'
              }`}>
                {overallScore}%
              </div>
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

          {/* Category filter */}
          <div className="flex items-center gap-1 px-6 py-2.5 border-b border-white/[0.04]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.6875rem] transition-colors ${
                  activeCategory === cat
                    ? 'bg-[#6366F1]/10 text-[#818CF8]'
                    : 'text-[#475569] hover:bg-white/[0.04] hover:text-[#94A3B8]'
                }`}
              >
                {cat !== 'all' && categoryIcons[cat]}
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                {cat !== 'all' && (
                  <span className="text-[0.5625rem] opacity-60">
                    ({violations.filter((v) => v.category === cat).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {scanning ? (
              <div className="flex items-center justify-center py-16 gap-3">
                <RefreshCw className="w-6 h-6 text-[#6366F1] animate-spin" />
                <p className="text-sm text-[#94A3B8]">Scanning for compliance issues...</p>
              </div>
            ) : (
              <>
                {/* Passing rules */}
                {activeCategory === 'all' && passingRules.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[0.625rem] uppercase tracking-wider text-[#475569] mb-2 px-1">
                      Passing ({passingRules.length})
                    </p>
                    {passingRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 mb-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs text-[#94A3B8]">{rule.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Violations */}
                {filteredViolations.length > 0 && (
                  <div>
                    <p className="text-[0.625rem] uppercase tracking-wider text-[#475569] mb-2 px-1">
                      Issues ({filteredViolations.length})
                    </p>
                    {filteredViolations.map((v, i) => (
                      <motion.div
                        key={`${v.ruleId}-${v.nodeId ?? i}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`rounded-xl border p-3.5 mb-2 ${statusColors[v.status].bg} border-white/[0.06]`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 shrink-0">{statusColors[v.status].icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-[#F1F5F9]">{v.title}</p>
                              <span className="text-[0.5625rem] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#475569]">
                                {v.category}
                              </span>
                            </div>
                            <p className="text-[0.6875rem] text-[#64748B] mt-1 leading-relaxed">
                              {v.description}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <ChevronRight className="w-3 h-3 text-[#6366F1]" />
                              <p className="text-[0.625rem] text-[#818CF8]">{v.suggestion}</p>
                            </div>
                            {v.nodeLabel && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Eye className="w-3 h-3 text-[#475569]" />
                                <span className="text-[0.5625rem] text-[#475569]">
                                  Affects: {v.nodeLabel}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {filteredViolations.length === 0 && passingRules.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    <p className="text-sm text-[#94A3B8]">Full brand compliance</p>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
