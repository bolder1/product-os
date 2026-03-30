'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Download, Sparkles, BarChart3, Zap } from 'lucide-react'
import { mockAnalyticsData } from './_data/mock-analytics'
import { MetricCards } from './_components/metric-cards'
import { TrafficChart } from './_components/traffic-chart'
import { FunnelChart } from './_components/funnel-chart'
import { TopPages } from './_components/top-pages'
import { InsightToTaskPanel } from './_components/insight-to-task-panel'
import { ExperimentTracker } from './_components/experiment-tracker'
import { AIRecommendations } from '../../../../components/shared/ai-recommendations'
import { GraphImpactAnalysis } from '../../../../components/shared/graph-impact-analysis'
import { useInsightStore } from '../../../../lib/insight-store'
import { StudioHealthBadge } from '../../../../components/shared/studio-health-badge'

type DateRange = '7d' | '30d' | '90d'

export default function AnalyticsPage() {
  const params = useParams<{ productSlug: string }>()
  const productId = params.productSlug

  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [impactOpen, setImpactOpen] = useState(false)
  const { metrics, dailyTraffic, funnel, topPages } = mockAnalyticsData

  // Seed insights on first load
  const seedInsights = useInsightStore((s) => s.seedInsights)
  useEffect(() => {
    seedInsights(productId)
  }, [productId, seedInsights])

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-[#F1F5F9]">Analytics</h1>
              <StudioHealthBadge productId={productId} studio="analytics" />
            </div>
            <p className="text-xs text-[#64748B]">Track product metrics, insights &amp; experiments</p>
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

          <button
            onClick={() => setImpactOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Impact Analysis
          </button>

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

        {/* Main chart + insights panel */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
          <div className="flex flex-col gap-4">
            <TrafficChart data={dailyTraffic} />
            <FunnelChart steps={funnel} />
          </div>
          {/* Right sidebar: Insights → Tasks + Experiments */}
          <div className="flex flex-col gap-4">
            <InsightToTaskPanel productId={productId} />
            <ExperimentTracker productId={productId} />
          </div>
        </div>

        {/* AI Recommendations */}
        <AIRecommendations productId={productId} />

        {/* Top pages table */}
        <TopPages pages={topPages} />
      </div>

      {/* Impact Analysis modal */}
      <GraphImpactAnalysis
        productId={productId}
        isOpen={impactOpen}
        onClose={() => setImpactOpen(false)}
      />
    </div>
  )
}
