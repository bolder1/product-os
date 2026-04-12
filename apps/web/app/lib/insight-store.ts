'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InsightSeverity = 'info' | 'warning' | 'success' | 'critical'
export type InsightStatus = 'active' | 'dismissed' | 'converted' | 'resolved'
export type InsightSource = 'analytics' | 'validation' | 'ai' | 'graph' | 'user'

export interface Insight {
  id: string
  productId: string
  text: string
  severity: InsightSeverity
  status: InsightStatus
  source: InsightSource
  action: string
  taskId?: string // if converted to task
  experimentId?: string // if linked to experiment
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Experiment {
  id: string
  productId: string
  name: string
  hypothesis: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'
  variant_a: string
  variant_b: string
  metric: string
  targetSampleSize: number
  currentSampleSize: number
  results?: {
    variant_a_value: number
    variant_b_value: number
    confidence: number
    winner?: 'a' | 'b' | 'none'
  }
  insightId?: string
  createdAt: string
  updatedAt: string
}

export interface AIRecommendation {
  id: string
  productId: string
  type: 'optimize' | 'add' | 'remove' | 'refactor' | 'test' | 'investigate'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'high' | 'medium' | 'low'
  targetStudio: string
  targetNodeId?: string
  status: 'pending' | 'accepted' | 'dismissed' | 'applied'
  reasoning: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface InsightState {
  insights: Insight[]
  experiments: Experiment[]
  recommendations: AIRecommendation[]

  // Insight operations
  addInsight: (insight: Omit<Insight, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Insight
  dismissInsight: (id: string) => void
  convertInsightToTask: (id: string, taskId: string) => void
  resolveInsight: (id: string) => void

  // Experiment operations
  addExperiment: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>) => Experiment
  updateExperiment: (id: string, updates: Partial<Experiment>) => void
  deleteExperiment: (id: string) => void

  // AI Recommendation operations
  addRecommendation: (rec: Omit<AIRecommendation, 'id' | 'createdAt' | 'status'>) => AIRecommendation
  updateRecommendationStatus: (id: string, status: AIRecommendation['status']) => void

  // Seed default insights for a product
  seedInsights: (productId: string) => void
  seedRecommendations: (productId: string) => void
}

let counter = 0
function uid(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now()}-${counter}`
}

export const useInsightStore = create<InsightState>()(
  persist(
    (set, get) => ({
      insights: [],
      experiments: [],
      recommendations: [],

      addInsight: (data) => {
        const now = new Date().toISOString()
        const insight: Insight = { ...data, id: uid('ins'), status: 'active', createdAt: now, updatedAt: now }
        set((s) => ({ insights: [insight, ...s.insights] }))
        return insight
      },

      dismissInsight: (id) => {
        set((s) => ({
          insights: s.insights.map((i) =>
            i.id === id ? { ...i, status: 'dismissed' as InsightStatus, updatedAt: new Date().toISOString() } : i
          ),
        }))
      },

      convertInsightToTask: (id, taskId) => {
        set((s) => ({
          insights: s.insights.map((i) =>
            i.id === id ? { ...i, status: 'converted' as InsightStatus, taskId, updatedAt: new Date().toISOString() } : i
          ),
        }))
      },

      resolveInsight: (id) => {
        set((s) => ({
          insights: s.insights.map((i) =>
            i.id === id ? { ...i, status: 'resolved' as InsightStatus, updatedAt: new Date().toISOString() } : i
          ),
        }))
      },

      addExperiment: (data) => {
        const now = new Date().toISOString()
        const experiment: Experiment = { ...data, id: uid('exp'), createdAt: now, updatedAt: now }
        set((s) => ({ experiments: [experiment, ...s.experiments] }))
        return experiment
      },

      updateExperiment: (id, updates) => {
        set((s) => ({
          experiments: s.experiments.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
          ),
        }))
      },

      deleteExperiment: (id) => {
        set((s) => ({ experiments: s.experiments.filter((e) => e.id !== id) }))
      },

      addRecommendation: (data) => {
        const now = new Date().toISOString()
        const rec: AIRecommendation = { ...data, id: uid('rec'), status: 'pending', createdAt: now }
        set((s) => ({ recommendations: [rec, ...s.recommendations] }))
        return rec
      },

      updateRecommendationStatus: (id, status) => {
        set((s) => ({
          recommendations: s.recommendations.map((r) =>
            r.id === id ? { ...r, status } : r
          ),
        }))
      },

      seedInsights: (productId) => {
        const existing = get().insights.filter((i) => i.productId === productId)
        if (existing.length > 0) return

        const now = new Date().toISOString()
        const seeds: Insight[] = [
          {
            id: uid('ins'), productId, text: 'Sign-up drop-off increased 15% on mobile devices this week',
            severity: 'critical', status: 'active', source: 'analytics', action: 'Investigate mobile funnel',
            createdAt: now, updatedAt: now,
          },
          {
            id: uid('ins'), productId, text: 'Pricing page exit rate at 28% — potential conversion blocker',
            severity: 'warning', status: 'active', source: 'analytics', action: 'Analyze pricing page',
            createdAt: now, updatedAt: now,
          },
          {
            id: uid('ins'), productId, text: 'Dashboard engagement up 23% since last release',
            severity: 'success', status: 'active', source: 'analytics', action: 'Track dashboard metrics',
            createdAt: now, updatedAt: now,
          },
          {
            id: uid('ins'), productId, text: 'Consider A/B testing CTA copy on landing page',
            severity: 'info', status: 'active', source: 'ai', action: 'Create A/B test',
            createdAt: now, updatedAt: now,
          },
          {
            id: uid('ins'), productId, text: '3 components have no usage across any page — potential dead code',
            severity: 'warning', status: 'active', source: 'graph', action: 'Review unused components',
            createdAt: now, updatedAt: now,
          },
          {
            id: uid('ins'), productId, text: 'Onboarding workflow has 2 states with no outbound transitions',
            severity: 'warning', status: 'active', source: 'validation', action: 'Fix workflow dead ends',
            createdAt: now, updatedAt: now,
          },
        ]
        set((s) => ({ insights: [...seeds, ...s.insights] }))
      },

      seedRecommendations: (productId) => {
        const existing = get().recommendations.filter((r) => r.productId === productId)
        if (existing.length > 0) return

        const now = new Date().toISOString()
        const seeds: AIRecommendation[] = [
          {
            id: uid('rec'), productId, type: 'optimize', title: 'Simplify sign-up form',
            description: 'Current form has 7 fields. Users on mobile abandon at field 4. Reduce to 3 essential fields.',
            impact: 'high', effort: 'low', targetStudio: 'pages', status: 'pending',
            reasoning: 'Mobile drop-off correlates with form length. Industry benchmark is 3-4 fields.',
            createdAt: now,
          },
          {
            id: uid('rec'), productId, type: 'add', title: 'Add social proof to pricing page',
            description: 'Pricing page has 28% exit rate. Adding testimonials near CTA could reduce exits by 10-15%.',
            impact: 'high', effort: 'medium', targetStudio: 'pages', status: 'pending',
            reasoning: 'Pages with social proof convert 15% better on average.',
            createdAt: now,
          },
          {
            id: uid('rec'), productId, type: 'test', title: 'A/B test dashboard layout',
            description: 'Dashboard has strong engagement. Test card-based vs table layout to optimize further.',
            impact: 'medium', effort: 'medium', targetStudio: 'design', status: 'pending',
            reasoning: 'Dashboard engagement is up — this is the right time to iterate.',
            createdAt: now,
          },
          {
            id: uid('rec'), productId, type: 'remove', title: 'Deprecate unused Button v1 component',
            description: 'Button v1 has 0 usages. Button v2 replaced it 2 versions ago. Safe to remove.',
            impact: 'low', effort: 'low', targetStudio: 'components', status: 'pending',
            reasoning: 'Graph analysis shows no references. Reduces maintenance burden.',
            createdAt: now,
          },
          {
            id: uid('rec'), productId, type: 'refactor', title: 'Split User entity into User + Profile',
            description: 'User entity has 12 fields. Separating auth fields from profile reduces coupling.',
            impact: 'medium', effort: 'high', targetStudio: 'workflows', status: 'pending',
            reasoning: 'Entity has mixed concerns. Auth changes shouldn\'t require profile migration.',
            createdAt: now,
          },
        ]
        set((s) => ({ recommendations: [...seeds, ...s.recommendations] }))
      },
    }),
    {
      name: 'product-os-insights',
    }
  )
)
