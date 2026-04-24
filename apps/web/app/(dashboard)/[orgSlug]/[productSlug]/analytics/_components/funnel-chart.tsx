'use client'

import { motion } from 'framer-motion'
import type { FunnelStep } from '../_data/mock-analytics'

interface FunnelChartProps {
  steps: FunnelStep[]
}

const funnelColors = ['#3B82F6', '#6366F1', '#8B5CF6', '#10B981', '#059669']

export function FunnelChart({ steps }: FunnelChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-white/[0.08] bg-[var(--bg-base)] p-5"
    >
      <h3 className="text-sm font-medium text-[var(--text-primary)] mb-5">Conversion Funnel</h3>

      <div className="flex flex-col gap-3">
        {steps.map((step, i) => {
          const color = funnelColors[i] || funnelColors[funnelColors.length - 1]

          return (
            <motion.div
              key={step.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Step label */}
              <div className="w-24 shrink-0 text-right">
                <span className="text-sm text-[var(--text-secondary)]">{step.name}</span>
              </div>

              {/* Bar */}
              <div className="flex-1 relative">
                <div className="h-10 rounded-lg bg-white/[0.04] overflow-hidden">
                  <motion.div
                    className="h-full rounded-lg flex items-center px-3 justify-between"
                    style={{ backgroundColor: `${color}20` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${step.percentage}%` }}
                    transition={{ delay: 0.2 + i * 0.12, duration: 0.6, ease: 'easeOut' }}
                  >
                    <span className="text-sm font-semibold" style={{ color }}>
                      {step.percentage}%
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Drop-off */}
              <div className="w-20 shrink-0">
                {step.dropOff > 0 && (
                  <span className="text-xs text-rose-400/80">-{step.dropOff}% drop</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
