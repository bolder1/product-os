'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { MetricCard } from '../_data/mock-analytics'

interface MetricCardsProps {
  metrics: MetricCard[]
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 28
  const padding = 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width - padding},${height} L ${padding},${height} Z`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((metric, i) => {
        const isPositive = metric.change >= 0
        const trendColor = isPositive ? '#10B981' : '#F43F5E'

        return (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {metric.label}
                </span>
                <span className="text-2xl font-bold text-[var(--text-primary)]">{metric.value}</span>
              </div>
              <Sparkline data={metric.sparkline} color={trendColor} />
            </div>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="w-3.5 h-3.5" style={{ color: trendColor }} />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" style={{ color: trendColor }} />
              )}
              <span className="text-xs font-medium" style={{ color: trendColor }}>
                {isPositive ? '+' : ''}
                {metric.change}%
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">vs last period</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
