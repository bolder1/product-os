'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'
import type { TopPage } from '../_data/mock-analytics'

interface TopPagesProps {
  pages: TopPage[]
}

type SortKey = 'views' | 'uniqueVisitors' | 'bounceRate'

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 60
  const h = 20

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  })

  return (
    <svg width={w} height={h}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TopPages({ pages }: TopPagesProps) {
  const [sortKey, setSortKey] = useState<SortKey>('views')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...pages].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    return sortDir === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
  })

  const columns: { key: SortKey | null; label: string; className: string }[] = [
    { key: null, label: 'Page', className: 'flex-1 min-w-[160px]' },
    { key: 'views', label: 'Views', className: 'w-20 text-right' },
    { key: 'uniqueVisitors', label: 'Visitors', className: 'w-20 text-right' },
    { key: null, label: 'Avg Time', className: 'w-20 text-right' },
    { key: 'bounceRate', label: 'Bounce', className: 'w-16 text-right' },
    { key: null, label: 'Trend', className: 'w-16 text-right' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h3 className="text-sm font-medium text-[#F1F5F9]">Top Pages</h3>
      </div>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.06]">
        {columns.map((col, ci) => (
          <div key={ci} className={col.className}>
            {col.key ? (
              <button
                onClick={() => handleSort(col.key!)}
                className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#64748B] hover:text-[#94A3B8] transition-colors ml-auto"
              >
                {col.label}
                <ArrowUpDown className="w-2.5 h-2.5" />
              </button>
            ) : (
              <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
                {col.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Rows */}
      {sorted.map((page, i) => (
        <motion.div
          key={page.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.25 }}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] last:border-b-0"
        >
          {/* Page name */}
          <div className="flex-1 min-w-[160px]">
            <div className="text-sm text-[#F1F5F9]">{page.name}</div>
            <div className="text-xs text-[#64748B]">{page.path}</div>
          </div>

          {/* Views */}
          <div className="w-20 text-right text-sm text-[#94A3B8] tabular-nums">
            {page.views.toLocaleString()}
          </div>

          {/* Visitors */}
          <div className="w-20 text-right text-sm text-[#94A3B8] tabular-nums">
            {page.uniqueVisitors.toLocaleString()}
          </div>

          {/* Avg time */}
          <div className="w-20 text-right text-sm text-[#94A3B8]">{page.avgTime}</div>

          {/* Bounce rate */}
          <div className="w-16 text-right">
            <span
              className={`text-sm tabular-nums ${
                page.bounceRate > 40
                  ? 'text-rose-400'
                  : page.bounceRate > 25
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}
            >
              {page.bounceRate}%
            </span>
          </div>

          {/* Sparkline */}
          <div className="w-16 flex justify-end">
            <MiniSparkline data={page.sparkline} color="#10B981" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
