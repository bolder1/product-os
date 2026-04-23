'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MetricCard {
  id: string
  label: string
  value: string
  change: number
  sparkline: number[]
  unit?: string
}

export interface DailyTraffic {
  date: string
  pageViews: number
  uniqueVisitors: number
}

export interface FunnelStep {
  name: string
  percentage: number
  dropOff: number
}

export interface TopPage {
  id: string
  name: string
  path: string
  views: number
  uniqueVisitors: number
  avgTime: string
  bounceRate: number
  sparkline: number[]
}

export interface AIInsight {
  id: string
  text: string
  severity: 'info' | 'warning' | 'success' | 'critical'
  action: string
  dismissed: boolean
}

export interface Experiment {
  id: string
  label: string
  hypothesis: string
  metric: string
  variants: Array<{ name: string; allocation: number }>
  status: 'draft' | 'running' | 'completed' | 'paused'
}

export type DateRange = '7d' | '30d' | '90d' | '1y'

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface AnalyticsState {
  metrics: MetricCard[]
  dailyTraffic: DailyTraffic[]
  funnel: FunnelStep[]
  topPages: TopPage[]
  insights: AIInsight[]
  experiments: Experiment[]
  dateRange: DateRange
  loading: boolean

  hydrate: (data: {
    metrics?: MetricCard[]
    dailyTraffic?: DailyTraffic[]
    funnel?: FunnelStep[]
    topPages?: TopPage[]
    insights?: AIInsight[]
  }) => void
  hydrateExperiments: (raw: Record<string, unknown>[]) => void
  setDateRange: (r: DateRange) => void

  dismissInsight: (id: string) => void
  addInsight: (insight: Omit<AIInsight, 'id' | 'dismissed'>) => void

  createExperiment: (exp: Omit<Experiment, 'id' | 'status'>) => void
  updateExperiment: (id: string, patch: Partial<Experiment>) => void
  removeExperiment: (id: string) => void
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      metrics: [],
      dailyTraffic: [],
      funnel: [],
      topPages: [],
      insights: [],
      experiments: [],
      dateRange: '30d',
      loading: false,

      hydrate: (data) =>
        set({
          metrics: data.metrics ?? get().metrics,
          dailyTraffic: data.dailyTraffic ?? get().dailyTraffic,
          funnel: data.funnel ?? get().funnel,
          topPages: data.topPages ?? get().topPages,
          insights: (data.insights ?? get().insights).map((i, idx) => ({ ...i, id: i.id ?? `ins-${idx}`, dismissed: i.dismissed ?? false })),
          loading: false,
        }),

      hydrateExperiments: (raw) =>
        set({
          experiments: raw.map((r) => {
            const data = (typeof r.data === 'string' ? JSON.parse(r.data as string) : r.data) ?? {}
            return {
              id: r.id as string,
              label: r.label as string,
              hypothesis: data.hypothesis ?? '',
              metric: data.metric ?? '',
              variants: data.variants ?? [],
              status: data.status ?? 'draft',
            }
          }),
        }),

      setDateRange: (r) => set({ dateRange: r }),

      dismissInsight: (id) =>
        set({ insights: get().insights.map((i) => (i.id === id ? { ...i, dismissed: true } : i)) }),

      addInsight: (insight) =>
        set({ insights: [{ ...insight, id: crypto.randomUUID(), dismissed: false }, ...get().insights] }),

      createExperiment: (exp) =>
        set({ experiments: [{ ...exp, id: crypto.randomUUID(), status: 'draft' }, ...get().experiments] }),

      updateExperiment: (id, patch) =>
        set({ experiments: get().experiments.map((e) => (e.id === id ? { ...e, ...patch } : e)) }),

      removeExperiment: (id) =>
        set({ experiments: get().experiments.filter((e) => e.id !== id) }),
    }),
    { name: 'product-os-analytics-store', partialize: (s) => ({ dateRange: s.dateRange }) },
  ),
)
