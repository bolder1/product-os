'use client'

import { useMemo, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Clock,
  MousePointerClick,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useInsightStore, type Insight } from '../../lib/insight-store'

interface AnalyticsOverlayProps {
  productId: string
  /** Which studio context to filter insights for */
  context: 'canvas' | 'design' | 'pages'
}

interface MiniMetric {
  label: string
  value: string
  change: number
  icon: React.ReactNode
}

// Generate context-aware mock metrics per studio
function getContextMetrics(context: AnalyticsOverlayProps['context']): MiniMetric[] {
  switch (context) {
    case 'canvas':
      return [
        { label: 'Journeys Mapped', value: '12', change: 3, icon: <TrendingUp className="w-3 h-3" /> },
        { label: 'Avg Steps/Journey', value: '6.4', change: -0.8, icon: <Clock className="w-3 h-3" /> },
        { label: 'Drop-off Points', value: '4', change: -2, icon: <MousePointerClick className="w-3 h-3" /> },
      ]
    case 'design':
      return [
        { label: 'Screens Designed', value: '18', change: 5, icon: <Eye className="w-3 h-3" /> },
        { label: 'Avg Interactions', value: '3.2', change: 0.4, icon: <MousePointerClick className="w-3 h-3" /> },
        { label: 'Accessibility Score', value: '87%', change: 12, icon: <TrendingUp className="w-3 h-3" /> },
      ]
    case 'pages':
      return [
        { label: 'Pages Published', value: '8', change: 2, icon: <Eye className="w-3 h-3" /> },
        { label: 'Avg Load Time', value: '1.2s', change: -0.3, icon: <Clock className="w-3 h-3" /> },
        { label: 'Bounce Rate', value: '34%', change: -5, icon: <TrendingDown className="w-3 h-3" /> },
      ]
  }
}

const contextInsightFilter: Record<AnalyticsOverlayProps['context'], string[]> = {
  canvas: ['journey', 'funnel', 'flow'],
  design: ['design', 'screen', 'accessibility', 'component'],
  pages: ['page', 'seo', 'performance', 'load'],
}

/** Collapsible analytics overlay for non-analytics studios */
export function AnalyticsOverlay({ productId, context }: AnalyticsOverlayProps) {
  const [expanded, setExpanded] = useState(false)
  const allInsights = useInsightStore((s) => s.insights)

  const contextInsights = useMemo(() => {
    const keywords = contextInsightFilter[context]
    return allInsights
      .filter((i) => i.productId === productId && i.status === 'active')
      .filter((i) => keywords.some((kw) => i.text.toLowerCase().includes(kw) || i.source === context))
      .slice(0, 3)
  }, [allInsights, productId, context])

  const metrics = useMemo(() => getContextMetrics(context), [context])

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">Analytics Overlay</span>
          {contextInsights.length > 0 && (
            <span className="tool-badge text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
              {contextInsights.length} insight{contextInsights.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        )}
      </button>

      {expanded && (
        <div>
          {/* Mini metrics */}
          <div className="grid grid-cols-3 gap-2 px-3 py-3 border-t border-[var(--border-default)]">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-[var(--radius-md)] bg-white/[0.03] border border-white/[0.06] p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-[var(--text-tertiary)]">{m.icon}</span>
                </div>
                <p className="text-[12px] font-bold text-[var(--text-primary)]">{m.value}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{m.label}</p>
                <div className={`flex items-center justify-center gap-0.5 text-[10px] mt-0.5 ${
                  m.change > 0 ? 'text-emerald-400' : m.change < 0 ? 'text-rose-400' : 'text-[var(--text-tertiary)]'
                }`}>
                  {m.change > 0 ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : m.change < 0 ? (
                    <TrendingDown className="w-2.5 h-2.5" />
                  ) : null}
                  {m.change > 0 ? '+' : ''}{m.change}
                </div>
              </div>
            ))}
          </div>

          {/* Context insights */}
          {contextInsights.length > 0 && (
            <div className="border-t border-[var(--border-default)] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
                Related Insights
              </p>
              <div className="space-y-1.5">
                {contextInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-start gap-2 text-[11px]"
                  >
                    <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                      insight.severity === 'critical' ? 'bg-rose-400' :
                      insight.severity === 'warning' ? 'bg-amber-400' :
                      insight.severity === 'success' ? 'bg-emerald-400' :
                      'bg-[var(--accent)]'
                    }`} />
                    <span className="text-[var(--text-secondary)] leading-snug">{insight.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contextInsights.length === 0 && (
            <div className="border-t border-[var(--border-default)] px-3 py-3 text-center">
              <p className="text-[10px] text-[var(--text-tertiary)]">
                No {context}-specific insights yet. Insights appear as analytics data flows in.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
