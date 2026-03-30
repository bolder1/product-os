'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  refactor: { icon: <RefreshCw className="w-3.5 h-3.5" />, color: 'text-blue-400', label: 'Refactor' },
  test: { icon: <FlaskConical className="w-3.5 h-3.5" />, color: 'text-purple-400', label: 'Test' },
  investigate: { icon: <Search className="w-3.5 h-3.5" />, color: 'text-cyan-400', label: 'Investigate' },
}

const impactColors: Record<string, string> = {
  high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low: 'bg-[#64748B]/15 text-[#94A3B8] border-white/[0.08]',
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
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-[#8B5CF6]/5 to-transparent">
        <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
        <span className="text-sm font-medium text-[#F1F5F9]">AI Recommendations</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6]">
          {pending.length} pending
        </span>
      </div>

      {/* Pending recommendations */}
      <div className="divide-y divide-white/[0.04]">
        <AnimatePresence>
          {pending.map((rec, i) => {
            const type = typeConfig[rec.type]
            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${type.color}`}>{type.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-medium text-[#F1F5F9]">{rec.title}</p>
                      <span className={`text-[0.5625rem] px-1.5 py-0.5 rounded border ${impactColors[rec.impact]}`}>
                        {rec.impact} impact
                      </span>
                    </div>
                    <p className="text-[0.6875rem] text-[#94A3B8] leading-relaxed mb-1.5">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-3 text-[0.625rem]">
                      <span className="text-[#64748B]">
                        Effort: <span className={effortColors[rec.effort]}>{rec.effort}</span>
                      </span>
                      <span className="text-[#64748B]">
                        Studio: <span className="text-[#94A3B8]">{rec.targetStudio}</span>
                      </span>
                    </div>
                    <p className="text-[0.625rem] text-[#475569] mt-1 italic">
                      {rec.reasoning}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => updateStatus(rec.id, 'accepted')}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(rec.id, 'dismissed')}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-[#64748B] hover:bg-white/[0.06] transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Dismiss
                  </button>
                  <button
                    onClick={() => updateStatus(rec.id, 'applied')}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                    Go to Studio
                  </button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {pending.length === 0 && (
          <div className="py-6 text-center">
            <Sparkles className="w-6 h-6 text-[#475569] mx-auto mb-2" />
            <p className="text-xs text-[#64748B]">All recommendations reviewed</p>
          </div>
        )}
      </div>

      {/* Accepted section */}
      {accepted.length > 0 && (
        <div className="border-t border-white/[0.06]">
          <div className="px-4 py-2 bg-white/[0.01]">
            <p className="text-[0.625rem] uppercase tracking-wider text-[#475569]">
              Accepted ({accepted.length})
            </p>
          </div>
          {accepted.map((rec) => (
            <div key={rec.id} className="px-4 py-2 flex items-center gap-2 text-[0.6875rem]">
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-[#94A3B8] truncate">{rec.title}</span>
              <span className="text-[#475569] shrink-0">{rec.targetStudio}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
