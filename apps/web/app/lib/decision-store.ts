'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DecisionStatus = 'proposed' | 'decided' | 'revisited' | 'superseded'

export interface Alternative {
  option: string
  proscons: string
}

export interface RelatedEntity {
  id: string
  type: string
  label: string
}

export interface Decision {
  id: string
  productId: string
  title: string
  rationale: string
  alternatives: Alternative[]
  decidedBy?: string
  status: DecisionStatus
  relatedEntities: RelatedEntity[]
  studio: string
  tags: string[]
  createdAt: string
  decidedAt?: string
  supersededBy?: string
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface DecisionState {
  decisions: Decision[]

  addDecision: (
    data: Omit<Decision, 'id' | 'createdAt' | 'status'> & { status?: DecisionStatus }
  ) => Decision
  updateDecision: (id: string, updates: Partial<Decision>) => void
  decideOnDecision: (id: string, decidedBy: string) => void
  supersede: (id: string, supersededById: string) => void
  getDecisionsByProduct: (productId: string) => Decision[]
  getDecisionsByStudio: (productId: string, studio: string) => Decision[]
  getActiveDecisions: (productId: string) => Decision[]
}

let decisionCounter = 0

export const useDecisionStore = create<DecisionState>()(
  persist(
    (set, get) => ({
      decisions: [],

      addDecision: (data) => {
        decisionCounter += 1
        const decision: Decision = {
          ...data,
          id: `dec-${Date.now()}-${decisionCounter}`,
          status: data.status ?? 'proposed',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          decisions: [decision, ...state.decisions],
        }))
        return decision
      },

      updateDecision: (id, updates) => {
        set((state) => ({
          decisions: state.decisions.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }))
      },

      decideOnDecision: (id, decidedBy) => {
        set((state) => ({
          decisions: state.decisions.map((d) =>
            d.id === id
              ? { ...d, status: 'decided' as const, decidedBy, decidedAt: new Date().toISOString() }
              : d
          ),
        }))
      },

      supersede: (id, supersededById) => {
        set((state) => ({
          decisions: state.decisions.map((d) =>
            d.id === id
              ? { ...d, status: 'superseded' as const, supersededBy: supersededById }
              : d
          ),
        }))
      },

      getDecisionsByProduct: (productId) =>
        get().decisions.filter((d) => d.productId === productId),

      getDecisionsByStudio: (productId, studio) =>
        get().decisions.filter(
          (d) => d.productId === productId && d.studio === studio
        ),

      getActiveDecisions: (productId) =>
        get().decisions.filter(
          (d) =>
            d.productId === productId &&
            (d.status === 'proposed' || d.status === 'decided')
        ),
    }),
    {
      name: 'product-os-decisions',
    }
  )
)
