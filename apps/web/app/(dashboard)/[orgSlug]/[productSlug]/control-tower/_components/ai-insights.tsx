'use client'

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'

type InsightType = 'gap' | 'risk' | 'suggestion' | 'positive'

const insightColors: Record<InsightType, string> = {
  gap: '#F59E0B',
  risk: '#F43F5E',
  suggestion: '#3B82F6',
  positive: '#10B981',
}

const insightLabels: Record<InsightType, string> = {
  gap: 'Gap',
  risk: 'Risk',
  suggestion: 'Suggestion',
  positive: 'Positive',
}

const insights: { text: string; type: InsightType; action: string }[] = [
  {
    text: '3 features have no assigned tasks',
    type: 'gap',
    action: 'View Features',
  },
  {
    text: 'Dashboard module has circular dependency risk',
    type: 'risk',
    action: 'Inspect Graph',
  },
  {
    text: 'Consider adding rate limiting to API',
    type: 'suggestion',
    action: 'Create Task',
  },
  {
    text: 'Test coverage improved by 12% this week',
    type: 'positive',
    action: 'View Report',
  },
]

export function AiInsights() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
        <span className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">
          AI Insights
        </span>
      </div>

      <div className="flex-1 space-y-2.5">
        {insights.map((insight, i) => {
          const color = insightColors[insight.type]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.08, duration: 0.3 }}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
            >
              <div
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#F1F5F9] leading-relaxed">{insight.text}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: color + '15', color }}
                  >
                    {insightLabels[insight.type]}
                  </span>
                  <button className="flex items-center gap-0.5 text-[10px] text-[#3B82F6] hover:text-[#60A5FA] transition-colors">
                    {insight.action}
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <button className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-xs text-[#8B5CF6] hover:text-[#A78BFA] transition-colors font-medium">
        <Sparkles className="w-3 h-3" />
        Generate More Insights
      </button>
    </motion.div>
  )
}
