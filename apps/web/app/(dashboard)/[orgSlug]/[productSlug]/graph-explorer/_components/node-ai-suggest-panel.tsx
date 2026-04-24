'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Link2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'
import { NODE_KIND_COLORS, NODE_KIND_LABELS, type GraphNode } from '../_data/mock-graph'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Suggestion {
  id: string
  type: 'connect' | 'missing_edge' | 'action' | 'insight'
  title: string
  description: string
  relatedNodeId?: string
  relatedNodeLabel?: string
  relatedNodeKind?: string
  edgeKind?: string
  priority?: 'high' | 'medium' | 'low'
}

interface AISuggestResult {
  suggestions?: Suggestion[]
  summary?: string
  model?: string
}

// ── Sub-components ────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  connect: { icon: Link2, color: '#6398ff', bg: '#6398ff', label: 'Connect' },
  missing_edge: { icon: AlertCircle, color: '#F59E0B', bg: '#F59E0B', label: 'Missing Edge' },
  action: { icon: ArrowRight, color: '#10B981', bg: '#10B981', label: 'Action' },
  insight: { icon: Lightbulb, color: '#8B5CF6', bg: '#8B5CF6', label: 'Insight' },
}

const PRIORITY_COLOR: Record<string, string> = {
  high: '#F43F5E',
  medium: '#F59E0B',
  low: '#64748B',
}

function SuggestionCard({
  suggestion,
  onConnect,
  allNodes,
}: {
  suggestion: Suggestion
  onConnect?: (nodeId: string, edgeKind: string) => void
  allNodes: GraphNode[]
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = TYPE_CONFIG[suggestion.type] ?? TYPE_CONFIG.insight
  const Icon = cfg.icon

  const relatedNode = suggestion.relatedNodeId
    ? allNodes.find((n) => n.id === suggestion.relatedNodeId)
    : null
  const relatedColor = relatedNode ? NODE_KIND_COLORS[relatedNode.kind] : '#64748B'

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden"
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors"
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${cfg.bg}18` }}
        >
          <Icon size={11} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-[var(--text-primary)] leading-tight">{suggestion.title}</span>
            {suggestion.priority && (
              <span
                className="text-[8px] font-bold px-1.5 py-px rounded-full uppercase tracking-wide"
                style={{ backgroundColor: PRIORITY_COLOR[suggestion.priority] + '18', color: PRIORITY_COLOR[suggestion.priority] }}
              >
                {suggestion.priority}
              </span>
            )}
          </div>
          <span
            className="text-[9px] font-medium uppercase tracking-wider"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        {expanded ? <ChevronUp size={10} className="text-[var(--text-tertiary)] shrink-0 mt-1" /> : <ChevronDown size={10} className="text-[var(--text-tertiary)] shrink-0 mt-1" />}
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-2">
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{suggestion.description}</p>

              {/* Related node chip */}
              {relatedNode && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-[var(--text-tertiary)]">Related node:</span>
                  <span
                    className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${relatedColor}18`, color: relatedColor }}
                  >
                    <span
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: relatedColor }}
                    />
                    {relatedNode.label}
                    <span className="opacity-60">· {NODE_KIND_LABELS[relatedNode.kind]}</span>
                  </span>
                </div>
              )}

              {/* Action button */}
              {suggestion.type === 'connect' && suggestion.relatedNodeId && onConnect && (
                <button
                  onClick={() => onConnect(suggestion.relatedNodeId!, suggestion.edgeKind ?? 'depends_on')}
                  className="self-start flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-white transition-colors"
                  style={{ backgroundColor: cfg.color }}
                >
                  <Link2 size={9} />
                  Connect now
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface NodeAISuggestPanelProps {
  node: GraphNode
  allNodes: GraphNode[]
  allEdges: { id: string; source: string; target: string; kind: string }[]
  productId: string
  onClose: () => void
  onConnect: (sourceId: string, targetId: string, edgeKind: string) => void
}

export function NodeAISuggestPanel({
  node,
  allNodes,
  allEdges,
  productId,
  onClose,
  onConnect,
}: NodeAISuggestPanelProps) {
  const hasRunRef = useRef(false)

  const mutation = trpc.ai.suggest.useMutation()

  const runSuggest = () => {
    const connectedNodeIds = new Set([
      ...allEdges.filter((e) => e.source === node.id).map((e) => e.target),
      ...allEdges.filter((e) => e.target === node.id).map((e) => e.source),
    ])

    const connectedNodes = allNodes
      .filter((n) => connectedNodeIds.has(n.id))
      .map((n) => ({ id: n.id, label: n.label, kind: n.kind }))

    const otherNodes = allNodes
      .filter((n) => n.id !== node.id && !connectedNodeIds.has(n.id))
      .slice(0, 20)
      .map((n) => ({ id: n.id, label: n.label, kind: n.kind }))

    mutation.mutate({
      productId,
      nodeId: node.id,
      prompt: `Analyze node "${node.label}" (kind: ${node.kind}). Suggest: missing connections to other nodes, architectural improvements, and next actions. Be specific and reference actual node names from the graph.`,
      context: {
        studioOrigin: 'graph-explorer',
        focusNode: { id: node.id, kind: node.kind, label: node.label, data: node.data },
        connectedNodes,
        otherNodesInGraph: otherNodes,
        totalNodes: allNodes.length,
        totalEdges: allEdges.length,
      },
    })
  }

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true
    runSuggest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const result = mutation.data as AISuggestResult | undefined
  const suggestions: Suggestion[] = result?.suggestions ?? []

  // Parse raw text result if suggestions array isn't present
  const rawText = typeof (mutation.data as unknown as Record<string, unknown>)?.content === 'string'
    ? (mutation.data as unknown as Record<string, unknown>).content as string
    : null

  const color = NODE_KIND_COLORS[node.kind]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: '#8B5CF620' }}>
          <Sparkles size={11} className="text-[var(--accent)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-[var(--text-primary)]">AI Suggestions</p>
          <p className="text-[9px] text-[var(--text-tertiary)] truncate">for &ldquo;{node.label}&rdquo;</p>
        </div>
        <div className="flex items-center gap-1">
          {!mutation.isPending && (
            <button
              onClick={() => { hasRunRef.current = false; runSuggest() }}
              className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
              title="Re-run analysis"
            >
              <RefreshCw size={11} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Node pill */}
      <div className="px-3 py-2 border-b border-[var(--border-default)] shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--bg-inset)]">
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-bold shrink-0"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {node.label.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[var(--text-primary)] truncate">{node.label}</p>
            <p className="text-[9px] text-[var(--text-tertiary)] capitalize">{NODE_KIND_LABELS[node.kind]}</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[9px] text-[var(--text-tertiary)]">
            <span>{allEdges.filter((e) => e.source === node.id || e.target === node.id).length} edges</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3">

        {/* Loading */}
        {mutation.isPending && (
          <div className="flex flex-col items-center justify-center gap-3 py-10">
            <div className="relative w-10 h-10">
              <svg className="absolute inset-0 animate-spin" style={{ animationDuration: '1.8s' }} viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="16" stroke="var(--accent)" strokeWidth="2" strokeOpacity="0.15" />
                <path d="M20 4 A16 16 0 0 1 36 20" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={14} className="text-[var(--accent)]" />
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">Analyzing node…</p>
            <p className="text-[10px] text-[var(--text-tertiary)] text-center max-w-[160px]">
              Finding connections, gaps and next steps
            </p>
          </div>
        )}

        {/* Error */}
        {mutation.isError && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle size={18} className="text-red-400" />
            <p className="text-[11px] text-[var(--text-secondary)]">Analysis failed</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{mutation.error?.message ?? 'Unknown error'}</p>
            <button
              onClick={runSuggest}
              className="mt-2 px-3 py-1.5 rounded-md text-[10px] font-medium bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Success — structured suggestions */}
        {mutation.isSuccess && suggestions.length > 0 && (
          <div className="flex flex-col gap-2">
            {/* Summary */}
            {result?.summary && (
              <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[var(--accent)]/8 border border-[var(--accent)]/15 mb-1">
                <CheckCircle2 size={11} className="text-[var(--accent)] shrink-0 mt-0.5" />
                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{result.summary}</p>
              </div>
            )}

            <p className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-0.5">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </p>

            {suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                allNodes={allNodes}
                onConnect={(targetId, edgeKind) => onConnect(node.id, targetId, edgeKind)}
              />
            ))}
          </div>
        )}

        {/* Success — raw text fallback */}
        {mutation.isSuccess && suggestions.length === 0 && rawText && (
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-lg bg-[var(--accent)]/8 border border-[var(--accent)]/15">
              <Sparkles size={11} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{rawText}</p>
            </div>
          </div>
        )}

        {/* Success — no suggestions */}
        {mutation.isSuccess && suggestions.length === 0 && !rawText && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 size={18} className="text-[var(--color-success)]" />
            <p className="text-[11px] text-[var(--text-secondary)]">Node looks great!</p>
            <p className="text-[10px] text-[var(--text-tertiary)] max-w-[160px]">
              No missing connections or issues found for this node.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {mutation.isSuccess && result?.model && (
        <div className="shrink-0 border-t border-[var(--border-default)] px-3 py-1.5 flex items-center gap-1">
          <span className="text-[9px] text-[var(--text-tertiary)]">via {result.model}</span>
        </div>
      )}
    </motion.div>
  )
}
