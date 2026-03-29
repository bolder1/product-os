'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react'
import type { AIInsight } from '../_data/mock-analytics'

interface AIInsightsPanelProps {
  insights: AIInsight[]
}

const severityConfig: Record<
  AIInsight['severity'],
  { icon: React.ReactNode; bg: string; border: string; text: string }
> = {
  critical: {
    icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
  },
  success: {
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
  },
  info: {
    icon: <Info className="w-4 h-4 text-blue-400" />,
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
  },
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visibleInsights = insights.filter((i) => !dismissed.has(i.id))

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
        <span className="text-sm font-medium text-[#F1F5F9] flex-1 text-left">AI Insights</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6]">
          {visibleInsights.length}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-[#64748B] transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 flex flex-col gap-2">
              <AnimatePresence>
                {visibleInsights.map((insight, i) => {
                  const config = severityConfig[insight.severity]
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.25 }}
                      className={`rounded-lg border ${config.border} ${config.bg} p-3`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#94A3B8] leading-relaxed">
                            {insight.text}
                          </p>
                          <button
                            className={`text-[11px] font-medium mt-1.5 flex items-center gap-1 ${config.text} hover:underline`}
                          >
                            {insight.action}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => dismiss(insight.id)}
                          className="shrink-0 text-[#64748B] hover:text-[#94A3B8] transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {visibleInsights.length === 0 && (
                <p className="text-xs text-[#64748B] text-center py-3">
                  All insights dismissed
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
