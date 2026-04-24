'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'

interface Props {
  productId: string
}

type InsightType = 'gap' | 'risk' | 'suggestion' | 'positive'

const INSIGHT_COLORS: Record<InsightType, string> = {
  gap:        '#F59E0B',
  risk:       '#F43F5E',
  suggestion: '#3B82F6',
  positive:   '#10B981',
}

const INSIGHT_LABELS: Record<InsightType, string> = {
  gap:        'Gap',
  risk:       'Risk',
  suggestion: 'Suggestion',
  positive:   'Positive',
}

function isValidType(t: string): t is InsightType {
  return ['gap', 'risk', 'suggestion', 'positive'].includes(t)
}

export function AiInsights({ productId }: Props) {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const router = useRouter()
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [insights, setInsights] = useState<Array<{ type: string; text: string; action: string; studio: string }>>([])
  const [hasGenerated, setHasGenerated] = useState(false)

  const recsMutation = trpc.controlTower.getAIHealthRecs.useMutation({
    onSuccess: (data) => {
      setInsights(data.insights)
      setGeneratedAt(data.generatedAt)
      setHasGenerated(true)
    },
  })

  const handleGenerate = useCallback(() => {
    if (!productId) return
    recsMutation.mutate({ productId })
  }, [productId, recsMutation])

  // Auto-surface on mount — no click required
  useEffect(() => {
    if (productId && !hasGenerated) handleGenerate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const handleAction = useCallback((studio: string) => {
    router.push(`/${params.orgSlug}/${params.productSlug}/${studio}`)
  }, [router, params])

  const timeAgo = generatedAt
    ? (() => {
        const diff = Math.round((Date.now() - new Date(generatedAt).getTime()) / 1000)
        if (diff < 60)   return `${diff}s ago`
        if (diff < 3600) return `${Math.round(diff / 60)}m ago`
        return `${Math.round(diff / 3600)}h ago`
      })()
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">AI Health Recs</span>
        </div>
        <div className="flex items-center gap-2">
          {timeAgo && <span className="text-[9px] text-[var(--border-default)]">{timeAgo}</span>}
          {hasGenerated && (
            <button
              onClick={handleGenerate}
              disabled={recsMutation.isPending}
              title="Regenerate"
              className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors disabled:opacity-40"
            >
              <RefreshCw size={11} className={recsMutation.isPending ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* States */}
      {recsMutation.isPending ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
            <Sparkles size={14} className="absolute inset-0 m-auto text-[var(--accent)]" />
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] text-center">Analysing your product graph…</p>
        </div>
      ) : recsMutation.isError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <AlertCircle size={20} className="text-[var(--color-error)]" />
          <p className="text-[11px] text-[var(--color-error)]">Analysis failed</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">{recsMutation.error.message}</p>
          <button onClick={handleGenerate} className="text-[10px] text-[var(--accent)] hover:text-[var(--accent)] mt-1">Try again</button>
        </div>
      ) : !hasGenerated ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
            <Sparkles size={20} className="text-[var(--accent)]" />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[var(--text-primary)]">AI Health Analysis</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1 max-w-[180px]">
              Analyse your live product graph for gaps, risks, and suggestions.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!productId}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)]/20 border border-[var(--accent)]/30 text-[var(--accent)] text-[11px] font-medium hover:bg-[var(--accent)]/30 disabled:opacity-40 transition-all"
          >
            <Sparkles size={12} />
            Run Analysis
          </button>
        </div>
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto pr-0.5">
          <AnimatePresence>
            {insights.map((insight, i) => {
              const type  = isValidType(insight.type) ? insight.type : 'suggestion'
              const color = INSIGHT_COLORS[type]
              const label = INSIGHT_LABELS[type]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed">{insight.text}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: color + '15', color }}>
                        {label}
                      </span>
                      {insight.studio && (
                        <button
                          onClick={() => handleAction(insight.studio)}
                          className="flex items-center gap-0.5 text-[10px] text-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                        >
                          {insight.action}
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {hasGenerated && !recsMutation.isPending && (
        <button
          onClick={handleGenerate}
          className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent)] transition-colors font-medium"
        >
          <Sparkles className="w-3 h-3" />
          Regenerate
        </button>
      )}
    </motion.div>
  )
}
