'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Sparkles, BarChart3 } from 'lucide-react'
import { mockAnalyticsData } from './_data/mock-analytics'
import { MetricCards } from './_components/metric-cards'
import { TrafficChart } from './_components/traffic-chart'
import { FunnelChart } from './_components/funnel-chart'
import { TopPages } from './_components/top-pages'
import { AIInsightsPanel } from './_components/ai-insights-panel'

type DateRange = '7d' | '30d' | '90d'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const { metrics, dailyTraffic, funnel, topPages, insights } = mockAnalyticsData

  const ranges: { key: DateRange; label: string }[] = [
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
    { key: '90d', label: '90 days' },
  ]

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Analytics</h1>
            <p className="text-xs text-[#64748B]">Track product metrics &amp; performance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range picker */}
          <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setDateRange(r.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dateRange === r.key
                    ? 'bg-[#10B981]/15 text-[#10B981]'
                    : 'text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#94A3B8] bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI: Insights
          </button>
        </div>
      </div>

      {/* Scrollable dashboard */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 pb-4">
        {/* Metric cards */}
        <MetricCards metrics={metrics} />

        {/* Main chart + AI panel */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
          <div className="flex flex-col gap-4">
            <TrafficChart data={dailyTraffic} />
            <FunnelChart steps={funnel} />
          </div>
          <AIInsightsPanel insights={insights} />
        </div>

        {/* Top pages table */}
        <TopPages pages={topPages} />
      </div>
    </div>
  )
}
