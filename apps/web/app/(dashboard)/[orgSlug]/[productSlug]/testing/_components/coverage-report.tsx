'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { CoverageData } from '../_data/mock-tests'

interface CoverageReportProps {
  coverage: CoverageData
}

function CoverageDonut({ percentage }: { percentage: number }) {
  const radius = 60
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const size = (radius + strokeWidth) * 2

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-error)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-[var(--text-primary)]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {percentage}%
        </motion.span>
        <span className="text-xs text-[var(--text-tertiary)]">Coverage</span>
      </div>
    </div>
  )
}

function CategoryBar({
  name,
  percentage,
  delay,
}: {
  name: string
  percentage: number
  delay: number
}) {
  const color =
    percentage >= 90
      ? '#10B981'
      : percentage >= 75
        ? '#F43F5E'
        : percentage >= 60
          ? '#F59E0B'
          : '#EF4444'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">{name}</span>
        <span className="text-sm font-medium text-[var(--text-primary)]">{percentage}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay, duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

export function CoverageReport({ coverage }: CoverageReportProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 items-start">
        {/* Donut chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] p-6"
        >
          <CoverageDonut percentage={coverage.overall} />
        </motion.div>

        {/* Category breakdown */}
        <div className="flex flex-col gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Coverage by Category</h3>
          <div className="flex flex-col gap-4">
            {coverage.categories.map((cat, i) => (
              <CategoryBar
                key={cat.name}
                name={cat.name}
                percentage={cat.percentage}
                delay={0.2 + i * 0.15}
              />
            ))}
          </div>
        </div>
      </div>

      {/* AI improve coverage */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="self-start flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        AI: Improve coverage
      </motion.button>
    </div>
  )
}
