'use client'

/**
 * Budget store — tracks AI spend per user (Phase B).
 *
 * Tracks rolling daily + monthly usage and caps. Emits snapshots that the
 * token estimator can consume. Persisted in localStorage for now; swaps to
 * server-authoritative store in Phase E.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BudgetRun {
  id: string
  skillId: string
  cost: number
  tokens: number
  at: string // ISO timestamp
}

interface BudgetState {
  capToday: number
  capThisMonth: number
  runs: BudgetRun[]
  setCapToday: (v: number) => void
  setCapThisMonth: (v: number) => void
  recordRun: (run: Omit<BudgetRun, 'id' | 'at'>) => void
  clearRuns: () => void
  /** Rolling sum of runs within the last 24 hours. */
  usedToday: () => number
  /** Rolling sum of runs within the current calendar month. */
  usedThisMonth: () => number
  snapshot: () => {
    usedToday: number
    capToday: number
    usedThisMonth: number
    capThisMonth: number
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      capToday: 10,
      capThisMonth: 200,
      runs: [],

      setCapToday: (v) => set({ capToday: Math.max(0, v) }),
      setCapThisMonth: (v) => set({ capThisMonth: Math.max(0, v) }),

      recordRun: (run) => {
        const entry: BudgetRun = {
          ...run,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          at: new Date().toISOString(),
        }
        set((state) => ({ runs: [entry, ...state.runs].slice(0, 500) }))
      },

      clearRuns: () => set({ runs: [] }),

      usedToday: () => {
        const cutoff = Date.now() - DAY_MS
        return get()
          .runs.filter((r) => new Date(r.at).getTime() >= cutoff)
          .reduce((a, r) => a + r.cost, 0)
      },

      usedThisMonth: () => {
        const now = new Date()
        return get()
          .runs.filter((r) => {
            const d = new Date(r.at)
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
          })
          .reduce((a, r) => a + r.cost, 0)
      },

      snapshot: () => {
        const s = get()
        return {
          usedToday: s.usedToday(),
          capToday: s.capToday,
          usedThisMonth: s.usedThisMonth(),
          capThisMonth: s.capThisMonth,
        }
      },
    }),
    {
      name: 'product-os-budget',
      partialize: (s) => ({
        capToday: s.capToday,
        capThisMonth: s.capThisMonth,
        runs: s.runs.slice(0, 200),
      }),
    },
  ),
)
