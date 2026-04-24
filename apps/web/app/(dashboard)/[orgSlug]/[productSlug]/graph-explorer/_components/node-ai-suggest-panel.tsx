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

/**
 * Per R20, suggestion-type and priority identity rides the semantic tone
 * ramp. Icon + label carry the meaning; color is a tone signal only.
 */
type Tone = 'info' | 'warning' | 'success' | 'accent' | 'error' | 'neutral'

const TYPE_CONFIG: Record<Suggestion['type'], { icon: typeof Link2; tone: Tone; label: string }> = {
  connect:      { icon: Link2,        tone: 'info',    label: 'Connect' },
  missing_edge: { icon: AlertCircle,  tone: 'warning', label: 'Missing Edge' },
  action:       { icon: ArrowRight,   tone: 'success', label: 'Action' },
  insight:      { icon: Lightbulb,    tone: 'accent',  label: 'Insight' },
}

const PRIORITY_TONES: Record<string, Tone> = {
  high:   'error',
  medium: 'warning',
  low:    'neutral',
}

/** Pre-composed tone → class-pair maps — no template-literal concat needed. */
const toneText: Record<Tone, string> = {
  info:    'text-[var(--accent)]',
  warning: 'text-[var(--color-warning)]',
  success: 'text-[var(--color-success)]',
  accent:  'text-[var(--accent-text)]',
  error:   'text-[var(--color-error)]',
  neutral: 'text-[var(--text-tertiary)]',
}
const toneBgSoft: Record<Tone, string> = {
  info:    'bg-[var(--accent-subtle)]',
  warning: 'bg-[var(--color-warning-muted)]',
  success: 'bg-[var(--color-success-muted)]',
  accent:  'bg-[var(--accent-muted)]',
  error:   'bg-[var(--color-error-muted)]',
  neutral: 'bg-[var(--bg-inset)]',
}
const toneBgSolid: Record<Tone, string> = {
  info:    'bg-[var(--accent)]',
  warning: 'bg-[var(--color-warning)]',
  success: 'bg-[var(--color-success)]',
  accent:  'bg-[var(--accent-text)]',
  error:   'bg-[var(--color-error)]',
  neutral: 'bg-[var(--text-tertiary)]',
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
  const priorityTone = suggestion.priority ? PRIORITY_TONES[suggestion.priority] : null

  const relatedNode = suggestion.relatedNodeId
    ? allNodes.find((n) => n.id === suggestion.relatedNodeId)
    : null

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
        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${toneBgSoft[cfg.tone]}`}>
          <Icon size={11} className={toneText[cfg.tone]} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-[var(--text-primary)] leading-tight">{suggestion.title}</span>
            {suggestion.priority && priorityTone && (
              <span className={`text-[8px] font-bold px-1.5 py-px rounded-full uppercase tracking-wide ${toneBgSoft[priorityTone]} ${toneText[priorityTone]}`}>
                {suggestion.priority}
              </span>
            )}
          </div>
          <span className={`text-[9px] font-medium uppercase tracking-wider ${toneText[cfg.tone]}`}>
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

              {/* Related node chip — uses NODE_KIND_COLORS from data layer,
                  which still carries raw hex. Opacity via rgb-mixing in the
                  wrapper avoids the hex-concat pattern. */}
              {relatedNode && (() => {
                const relatedColor = NODE_KIND_COLORS[relatedNode.kind]
                return (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-[var(--text-tertiary)]">Related node:</span>
                    <span
                      className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-inset)]"
                      style={{ color: relatedColor }}
                    >
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: relatedColor }} />
                      {relatedNode.label}
                      <span className="opacity-60">· {NODE_KIND_LABELS[relatedNode.kind]}</span>
                    </span>
                  </div>
                )
              })()}

              {/* Action button */}
              {suggestion.type === 'connect' && suggestion.relatedNodeId && onConnect && (
                <button
                  onClick={() => onConnect(suggestion.relatedNodeId!, suggestion.edgeKind ?? 'depends_on')}
                  className={`self-start flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-white transition-colors ${toneBgSolid[cfg.tone]}`}
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
        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-[var(--accent-muted)]">
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
