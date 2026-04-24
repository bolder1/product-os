'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react'
import type { GraphNode, GraphEdge } from '../_data/mock-graph'
import { NODE_KIND_COLORS } from '../_data/mock-graph'
import { trpc } from '../../../../../lib/trpc'

// ── Types ─────────────────────────────────────────────────────────────────
type AnalysisType = 'gaps' | 'dependencies' | 'risks' | 'impact'

interface Finding {
  title: string
  description: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  category: string
  affectedNodes: string[]
  recommendation?: string
}

interface AnalysisResult {
  findings: Finding[]
  summary: string
  score?: number
}

// ── Config ────────────────────────────────────────────────────────────────
const ANALYSIS_TYPES: { key: AnalysisType; label: string; desc: string }[] = [
  { key: 'gaps',         label: 'Gaps',         desc: 'Missing connections and nodes' },
  { key: 'dependencies', label: 'Dependencies',  desc: 'Coupling and dependency chains' },
  { key: 'risks',        label: 'Risks',         desc: 'Structural and design risks' },
  { key: 'impact',       label: 'Impact',        desc: 'Change blast radius' },
]

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', bg: '#EF444410', icon: AlertCircle,  label: 'Critical' },
  error:    { color: '#F97316', bg: '#F9731610', icon: AlertTriangle, label: 'Error'    },
  warning:  { color: '#F59E0B', bg: '#F59E0B10', icon: AlertTriangle, label: 'Warning'  },
  info:     { color: '#3B82F6', bg: '#3B82F610', icon: Info,          label: 'Info'     },
}

// ── Score ring ────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'
  const label = score >= 75 ? 'Healthy' : score >= 50 ? 'Needs attention' : 'At risk'

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-[72px] h-[72px]">
        <svg width={72} height={72} className="-rotate-90">
          <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
          <motion.circle
            cx={36} cy={36} r={r}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[15px] font-bold text-[var(--text-primary)]">{score}</span>
        </div>
      </div>
      <div>
        <div className="text-[13px] font-semibold text-[var(--text-primary)]">Graph Score</div>
        <div className="text-[11px] mt-0.5 font-medium" style={{ color }}>{label}</div>
      </div>
    </div>
  )
}

// ── Finding card ──────────────────────────────────────────────────────────
function FindingCard({
  finding,
  allNodes,
  onSelectNode,
}: {
  finding: Finding
  allNodes: GraphNode[]
  onSelectNode: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEVERITY_CONFIG[finding.severity]
  const Icon = cfg.icon
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]))

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: `${cfg.color}25`, backgroundColor: cfg.bg }}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left"
      >
        <Icon size={13} className="mt-0.5 shrink-0" style={{ color: cfg.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">{finding.title}</span>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0"
              style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span className="text-[9px] text-[var(--text-tertiary)] shrink-0 capitalize">{finding.category}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={11} className="text-[var(--text-tertiary)] shrink-0 mt-0.5" />
        ) : (
          <ChevronDown size={11} className="text-[var(--text-tertiary)] shrink-0 mt-0.5" />
        )}
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-2 border-t" style={{ borderColor: `${cfg.color}15` }}>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed pt-2">{finding.description}</p>

              {finding.recommendation && (
                <div
                  className="rounded-md px-2.5 py-2 border"
                  style={{ backgroundColor: `${cfg.color}08`, borderColor: `${cfg.color}20` }}
                >
                  <div className="flex items-start gap-1.5">
                    <Zap size={10} className="mt-0.5 shrink-0" style={{ color: cfg.color }} />
                    <p className="text-[10px] leading-relaxed" style={{ color: cfg.color }}>
                      {finding.recommendation}
                    </p>
                  </div>
                </div>
              )}

              {finding.affectedNodes.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">Affected nodes</span>
                  <div className="flex flex-wrap gap-1">
                    {finding.affectedNodes.map((nid) => {
                      const n = nodeMap.get(nid)
                      if (!n) return null
                      const color = NODE_KIND_COLORS[n.kind] ?? '#64748B'
                      return (
                        <button
                          key={nid}
                          onClick={(e) => { e.stopPropagation(); onSelectNode(nid) }}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors hover:opacity-80"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          {n.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────
function AnalysisSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="w-[72px] h-[72px] rounded-full bg-white/[0.06] animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="w-24 h-3 rounded bg-white/[0.06] animate-pulse" />
          <div className="w-16 h-2.5 rounded bg-white/[0.04] animate-pulse" />
        </div>
      </div>
      <div className="w-full h-10 rounded-lg bg-white/[0.04] animate-pulse" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-full h-14 rounded-lg bg-white/[0.04] animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────
interface AIAnalysisPanelProps {
  productId: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  onClose: () => void
  onSelectNode: (id: string | null) => void
}

export function AIAnalysisPanel({
  productId,
  nodes,
  edges,
  onClose,
  onSelectNode,
}: AIAnalysisPanelProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('gaps')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  const mutation = trpc.ai.analyze.useMutation({
    onSuccess: (data) => {
      const raw = data as { success: boolean; data?: AnalysisResult; model?: string }
      if (raw.success && raw.data) {
        setResult(raw.data)
        setIsFallback(raw.model === 'fallback')
      }
    },
  })

  const buildPrompt = useCallback(() => {
    const kindCounts: Record<string, number> = {}
    for (const n of nodes) kindCounts[n.kind] = (kindCounts[n.kind] ?? 0) + 1
    const kindSummary = Object.entries(kindCounts)
      .map(([k, v]) => `${v} ${k}`)
      .join(', ')

    return [
      `Product graph with ${nodes.length} nodes and ${edges.length} edges.`,
      `Node types: ${kindSummary}.`,
      `Perform a ${analysisType} analysis and identify key findings.`,
      nodes.length > 0
        ? `Sample nodes: ${nodes.slice(0, 8).map((n) => `${n.label} (${n.kind})`).join(', ')}.`
        : '',
    ].filter(Boolean).join(' ')
  }, [nodes, edges, analysisType])

  const runAnalysis = useCallback(() => {
    setResult(null)
    // prompt is passed via context so invoke.ts merges it into skillInput
    mutation.mutate({
      productId,
      analysisType,
      context: {
        studioOrigin: 'graph-explorer',
        nodeCount: nodes.length,
        edgeCount: edges.length,
        prompt: buildPrompt(),
      },
    })
  }, [productId, analysisType, mutation, buildPrompt, nodes.length, edges.length])

  // Auto-run once on mount
  const hasRunRef = useRef(false)
  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true
    runAnalysis()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sevCounts = result
    ? {
        critical: result.findings.filter((f) => f.severity === 'critical').length,
        error:    result.findings.filter((f) => f.severity === 'error').length,
        warning:  result.findings.filter((f) => f.severity === 'warning').length,
        info:     result.findings.filter((f) => f.severity === 'info').length,
      }
    : null

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
      className="flex flex-col h-full w-[300px] shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-surface)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-[var(--toolbar-h)] border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[var(--accent)]" />
          <span className="text-[11px] font-semibold text-[var(--text-primary)]">AI Analysis</span>
          {mutation.isPending && (
            <RefreshCw size={10} className="text-[var(--accent)] animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={runAnalysis}
            disabled={mutation.isPending}
            className="tool-btn text-[var(--text-tertiary)] disabled:opacity-40"
            title="Re-run analysis"
          >
            <RefreshCw size={11} className={mutation.isPending ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="tool-btn text-[var(--text-tertiary)]"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Analysis type tabs */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[var(--border-default)] shrink-0 overflow-x-auto">
        {ANALYSIS_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setAnalysisType(t.key)}
            className={`px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
              t.key === analysisType
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {mutation.isPending && !result && <AnalysisSkeleton />}

        {!mutation.isPending && !result && !mutation.isError && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles size={28} className="text-[var(--accent)]/40 mb-3" />
            <p className="text-[11px] text-[var(--text-tertiary)]">Click Re-run to analyze your graph</p>
          </div>
        )}

        {mutation.isError && (
          <div className="p-4 flex flex-col items-center gap-2 text-center">
            <AlertCircle size={22} className="text-red-400" />
            <p className="text-[11px] text-red-400">Analysis failed</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{mutation.error.message}</p>
            <button
              onClick={runAnalysis}
              className="mt-1 text-[10px] text-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3 p-3">
            {/* Fallback notice */}
            {isFallback && (
              <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[var(--color-warning)]/08 border border-[var(--color-warning)]/20">
                <Info size={11} className="text-[var(--color-warning)] mt-0.5 shrink-0" />
                <p className="text-[9px] text-[var(--color-warning)]/80 leading-relaxed">
                  Demo mode — add ANTHROPIC_API_KEY for live AI analysis
                </p>
              </div>
            )}

            {/* Score */}
            {result.score !== undefined && (
              <div className="px-1">
                <ScoreRing score={result.score} />
              </div>
            )}

            {/* Summary */}
            <div className="px-2.5 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>
            </div>

            {/* Severity breakdown */}
            {sevCounts && result.findings.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {(Object.entries(sevCounts) as [keyof typeof sevCounts, number][])
                  .filter(([, c]) => c > 0)
                  .map(([sev, count]) => {
                    const cfg = SEVERITY_CONFIG[sev]
                    return (
                      <span
                        key={sev}
                        className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
                      >
                        {count} {cfg.label}
                      </span>
                    )
                  })}
                {result.findings.length === 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-[var(--color-success)]">
                    <CheckCircle2 size={11} /> No issues found
                  </span>
                )}
              </div>
            )}

            {/* Findings */}
            <div className="flex flex-col gap-2">
              {result.findings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 size={22} className="text-[var(--color-success)] mb-2" />
                  <p className="text-[11px] text-[var(--color-success)] font-medium">No issues found</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Your graph looks healthy</p>
                </div>
              )}
              {result.findings.map((finding, i) => (
                <FindingCard
                  key={i}
                  finding={finding}
                  allNodes={nodes}
                  onSelectNode={onSelectNode}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-[var(--border-default)] px-3 py-2">
        <p className="text-[9px] text-[var(--text-tertiary)]/60 leading-relaxed">
          Analysis powered by Claude · {nodes.length} nodes, {edges.length} edges scanned
        </p>
      </div>
    </motion.div>
  )
}
