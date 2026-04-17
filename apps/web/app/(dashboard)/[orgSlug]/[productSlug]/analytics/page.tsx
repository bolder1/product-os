'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
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
import { useAnalyticsStore } from '../../../../lib/analytics-store'
import { useState } from 'react'

type DateRange = '7d' | '30d' | '90d'

export default function AnalyticsPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  // Date range: keep local (store persists its own '30d' default)
  const storeDateRange = useAnalyticsStore((s) => s.dateRange)
  const setStoreDateRange = useAnalyticsStore((s) => s.setDateRange)
  const [dateRange, setDateRange] = useState<DateRange>(
    (storeDateRange as DateRange) ?? '7d',
  )

  const [impactOpen, setImpactOpen] = useState(false)

  // Live analytics data from store
  const storeMetrics = useAnalyticsStore((s) => s.metrics)
  const storeDailyTraffic = useAnalyticsStore((s) => s.dailyTraffic)
  const storeFunnel = useAnalyticsStore((s) => s.funnel)
  const storeTopPages = useAnalyticsStore((s) => s.topPages)

  const isLive =
    storeMetrics.length > 0 ||
    storeDailyTraffic.length > 0 ||
    storeFunnel.length > 0 ||
    storeTopPages.length > 0

  const metrics = isLive ? storeMetrics : mockAnalyticsData.metrics
  const dailyTraffic = isLive ? storeDailyTraffic : mockAnalyticsData.dailyTraffic
  const funnel = isLive ? storeFunnel : mockAnalyticsData.funnel
  const topPages = isLive ? storeTopPages : mockAnalyticsData.topPages

  // Sync date range selection to store
  const handleDateRange = (r: DateRange) => {
    setDateRange(r)
    setStoreDateRange(r as '7d' | '30d' | '90d' | '1y')
  }

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
          {isLive ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)]">
              live
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
              sample
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Date range tabs */}
          <div className="tool-tabs mr-2">
            {ranges.map((r) => (
              <button
                key={r.key}
                onClick={() => handleDateRange(r.key)}
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
