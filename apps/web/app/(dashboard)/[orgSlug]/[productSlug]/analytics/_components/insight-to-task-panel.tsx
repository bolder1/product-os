'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  ListTodo,
  X,
  Check,
} from 'lucide-react'
import { useInsightStore, type Insight, type InsightSeverity } from '../../../../../lib/insight-store'
import { useTaskStore } from '../../../../../lib/task-store'

interface InsightToTaskPanelProps {
  productId: string
}

const severityConfig: Record<InsightSeverity, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  critical: {
    icon: <AlertCircle className="w-3.5 h-3.5 text-rose-400" />,
    bg: 'bg-rose-500/5',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
  },
  warning: {
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
  },
  success: {
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
  },
  info: {
    icon: <Info className="w-3.5 h-3.5 text-blue-400" />,
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
  },
}

const SEVERITY_TO_PRIORITY: Record<InsightSeverity, 'critical' | 'high' | 'medium' | 'low'> = {
  critical: 'critical',
  warning: 'high',
  success: 'low',
  info: 'medium',
}

export function InsightToTaskPanel({ productId }: InsightToTaskPanelProps) {
  const allInsights = useInsightStore((s) => s.insights)
  const dismissInsight = useInsightStore((s) => s.dismissInsight)
  const convertInsightToTask = useInsightStore((s) => s.convertInsightToTask)
  const resolveInsight = useInsightStore((s) => s.resolveInsight)
  const addTask = useTaskStore((s) => s.addTask)

  const insights = useMemo(
    () => allInsights.filter((i) => i.productId === productId && i.status === 'active'),
    [allInsights, productId]
  )

  const convertedInsights = useMemo(
    () => allInsights.filter((i) => i.productId === productId && i.status === 'converted'),
    [allInsights, productId]
  )

  const [convertingId, setConvertingId] = useState<string | null>(null)

  const handleConvertToTask = useCallback((insight: Insight) => {
    // Create a task from the insight
    const task = addTask({
      title: `[Insight] ${insight.text.slice(0, 80)}`,
      description: `Source: ${insight.source} insight\nAction: ${insight.action}\n\nOriginal: ${insight.text}`,
      status: 'todo',
      priority: SEVERITY_TO_PRIORITY[insight.severity],
      assignee: { id: 'user-1', name: 'Unassigned', initials: 'UA', role: 'any' },
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] ?? '',
      studio: 'analytics',
      productId,
    })

    // Link the insight to the task
    convertInsightToTask(insight.id, task.id)
    setConvertingId(null)
  }, [addTask, convertInsightToTask, productId])

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-[#F1F5F9]">Insights</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">
            {insights.length} active
          </span>
        </div>
      </div>

      {/* Active insights */}
      <div className="divide-y divide-white/[0.04] max-h-[360px] overflow-y-auto">
        <AnimatePresence>
          {insights.map((insight, i) => {
            const config = severityConfig[insight.severity]
            const isConverting = convertingId === insight.id

            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`px-4 py-3 ${config.bg}`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">{config.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.6875rem] text-[#94A3B8] leading-relaxed">
                      {insight.text}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[0.5625rem] px-1.5 py-0.5 rounded bg-white/[0.06] text-[#64748B]">
                        {insight.source}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() => handleConvertToTask(insight)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors font-medium"
                      >
                        <ListTodo className="w-3 h-3" />
                        Create Task
                      </button>
                      <button
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] ${config.text} hover:bg-white/[0.06] transition-colors`}
                      >
                        <ArrowRight className="w-3 h-3" />
                        {insight.action}
                      </button>
                      <button
                        onClick={() => resolveInsight(insight.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-emerald-400 hover:bg-emerald-500/10 transition-colors ml-auto"
                      >
                        <Check className="w-3 h-3" />
                        Resolve
                      </button>
                      <button
                        onClick={() => dismissInsight(insight.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[0.625rem] text-[#64748B] hover:bg-white/[0.06] transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {insights.length === 0 && (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-400/50 mx-auto mb-2" />
            <p className="text-xs text-[#64748B]">All insights addressed</p>
          </div>
        )}
      </div>

      {/* Converted section */}
      {convertedInsights.length > 0 && (
        <div className="border-t border-white/[0.06] px-4 py-2 bg-white/[0.01]">
          <p className="text-[0.625rem] text-[#475569]">
            {convertedInsights.length} insight{convertedInsights.length !== 1 ? 's' : ''} converted to tasks
          </p>
        </div>
      )}
    </div>
  )
}
