'use client'

import { useMemo } from 'react'
import {
  Sparkles,
  Zap,
  Plus,
  Minus,
  RefreshCw,
  FlaskConical,
  Search,
  Check,
  X,
  ArrowUpRight,
} from 'lucide-react'
import { useInsightStore, type AIRecommendation } from '../../lib/insight-store'

interface AIRecommendationsProps {
  productId: string
}

const typeConfig: Record<AIRecommendation['type'], { icon: React.ReactNode; color: string; label: string }> = {
  optimize: { icon: <Zap className="w-3.5 h-3.5" />, color: 'text-amber-400', label: 'Optimize' },
  add: { icon: <Plus className="w-3.5 h-3.5" />, color: 'text-emerald-400', label: 'Add' },
  remove: { icon: <Minus className="w-3.5 h-3.5" />, color: 'text-rose-400', label: 'Remove' },
  refactor: { icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'text-[var(--accent-text)]', label: 'Refactor' },
  test: { icon: <FlaskConical className="w-3.5 h-3.5" />, color: 'text-purple-400', label: 'Test' },
  investigate: { icon: <Search className="w-3.5 h-3.5" />, color: 'text-cyan-400', label: 'Investigate' },
}

const impactColors: Record<string, string> = {
  high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low: 'bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-default)]',
}

const effortColors: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-rose-400',
}

export function AIRecommendations({ productId }: AIRecommendationsProps) {
  const allRecs = useInsightStore((s) => s.recommendations)
  const updateStatus = useInsightStore((s) => s.updateRecommendationStatus)
  const seedRecommendations = useInsightStore((s) => s.seedRecommendations)

  const recommendations = useMemo(
    () => allRecs.filter((r) => r.productId === productId),
    [allRecs, productId]
  )

  const pending = recommendations.filter((r) => r.status === 'pending')
  const accepted = recommendations.filter((r) => r.status === 'accepted')

  // Seed on first render if empty
  if (recommendations.length === 0) {
    seedRecommendations(productId)
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="h-[var(--topbar-h)] flex items-center gap-2 px-3 border-b border-[var(--border-default)]">
        <Sparkles className="w-3.5 h-3.5 text-[var(--accent-text)]" />
        <span className="text-[13px] font-medium text-[var(--text-primary)]">AI Recommendations</span>
        <span className="tool-badge text-[10px] bg-[var(--accent)]/10 text-[var(--accent-text)] border-[var(--accent)]/20">
          {pending.length} pending
        </span>
      </div>

      {/* Pending recommendations */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {pending.map((rec) => {
          const type = typeConfig[rec.type]
          return (
            <div
              key={rec.id}
              className="px-3 py-3 group"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 shrink-0 ${type.color}`}>{type.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[12px] font-medium text-[var(--text-primary)]">{rec.title}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] border ${impactColors[rec.impact]}`}>
                      {rec.impact} impact
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mb-1.5">
                    {rec.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-[var(--text-tertiary)]">
                      Effort: <span className={effortColors[rec.effort]}>{rec.effort}</span>
                    </span>
                    <span className="text-[var(--text-tertiary)]">
                      Studio: <span className="text-[var(--text-secondary)]">{rec.targetStudio}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1 italic">
                    {rec.reasoning}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => updateStatus(rec.id, 'accepted')}
                  className="tool-btn flex items-center gap-1 text-[10px] text-emerald-400"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </button>
                <button
                  onClick={() => updateStatus(rec.id, 'dismissed')}
                  className="tool-btn flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]"
                >
                  <X className="w-3 h-3" />
                  Dismiss
                </button>
                <button
                  onClick={() => updateStatus(rec.id, 'applied')}
                  className="tool-btn flex items-center gap-1 text-[10px] text-[var(--accent-text)]"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  Go to Studio
                </button>
              </div>
            </div>
          )
        })}

        {pending.length === 0 && (
          <div className="py-6 text-center">
            <Sparkles className="w-5 h-5 text-[var(--text-tertiary)] mx-auto mb-2" />
            <p className="text-[11px] text-[var(--text-tertiary)]">All recommendations reviewed</p>
          </div>
        )}
      </div>

      {/* Accepted section */}
      {accepted.length > 0 && (
        <div className="border-t border-[var(--border-default)]">
          <div className="px-3 py-2 bg-white/[0.01]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Accepted ({accepted.length})
            </p>
          </div>
          {accepted.map((rec) => (
            <div key={rec.id} className="px-3 py-2 flex items-center gap-2 text-[11px]">
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[var(--text-secondary)] truncate">{rec.title}</span>
              <span className="text-[var(--text-tertiary)] shrink-0">{rec.targetStudio}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
