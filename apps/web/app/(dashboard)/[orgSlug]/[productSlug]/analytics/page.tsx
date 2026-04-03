'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Download, BarChart3, Zap } from 'lucide-react'
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
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* ── Toolbar ── */}
      <div className="h-[var(--toolbar-h)] min-h-[32px] flex items-center justify-between px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Analytics</span>
          <StudioHealthBadge productId={productId} studio="analytics" />
          <span className="text-[10px] text-[var(--text-tertiary)] ml-1">Metrics & experiments</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Date range tabs */}
          <div className="tool-tabs mr-2">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => setDateRange(r.key)}
                className={`tool-tab ${dateRange === r.key ? 'active' : ''}`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setImpactOpen(true)}
            className="tool-btn text-[var(--accent-text)]"
          >
            <Zap className="w-3 h-3" />
            <span className="text-[10px]">Impact</span>
          </button>

          <button className="tool-btn">
            <Download className="w-3 h-3" />
            <span className="text-[10px]">Export</span>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Metric cards */}
        <MetricCards metrics={metrics} />

        {/* Main chart + insights panel */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-3">
          <div className="flex flex-col gap-3">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3">
              <TrafficChart data={dailyTraffic} />
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3">
              <FunnelChart steps={funnel} />
            </div>
          </div>
          {/* Right sidebar: Insights + Experiments */}
          <div className="flex flex-col gap-3">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3">
              <InsightToTaskPanel productId={productId} />
            </div>
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3">
              <ExperimentTracker productId={productId} />
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3">
          <AIRecommendations productId={productId} />
        </div>

        {/* Top pages table */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] p-3">
          <TopPages pages={topPages} />
        </div>
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
