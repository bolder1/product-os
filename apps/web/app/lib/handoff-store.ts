'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface HandoffSpec {
  property: string
  type: string
  value: string
  description: string
}

export interface DesignToken {
  name: string
  value: string
  type: 'color' | 'spacing' | 'typography' | 'radius' | 'shadow' | 'opacity'
}

export interface Criterion {
  text: string
  done: boolean
}

export type HandoffType = 'component' | 'page' | 'token' | 'pattern'

export interface HandoffItem {
  id: string
  productId: string
  label: string
  type: HandoffType
  specs: HandoffSpec[]
  tokens: DesignToken[]
  criteria: Criterion[]
  previewColor: string
  completeness: number
  createdAt?: string
  updatedAt?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function calcCompleteness(criteria: Criterion[]): number {
  if (!criteria.length) return 0
  return Math.round((criteria.filter((c) => c.done).length / criteria.length) * 100)
}

function parseHandoff(raw: Record<string, unknown>): HandoffItem {
  const data = (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) ?? {}
  const criteria = data.criteria ?? []
  return {
    id: raw.id as string,
    productId: raw.productId as string,
    label: raw.label as string,
    type: data.type ?? 'component',
    specs: data.specs ?? [],
    tokens: data.tokens ?? [],
    criteria,
    previewColor: data.previewColor ?? '#6366f1',
    completeness: calcCompleteness(criteria),
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface HandoffState {
  items: HandoffItem[]
  selectedId: string | null
  typeFilter: 'all' | HandoffType
  loading: boolean

  hydrate: (raw: Record<string, unknown>[]) => void
  select: (id: string | null) => void
  setTypeFilter: (t: 'all' | HandoffType) => void

  create: (item: Omit<HandoffItem, 'id' | 'completeness' | 'createdAt' | 'updatedAt'>) => void
  update: (id: string, patch: Partial<HandoffItem>) => void
  remove: (id: string) => void
  toggleCriterion: (id: string, index: number) => void
}

export const useHandoffStore = create<HandoffState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedId: null,
      typeFilter: 'all',
      loading: false,

      hydrate: (raw) => set({ items: raw.map(parseHandoff), loading: false }),
      select: (id) => set({ selectedId: id }),
      setTypeFilter: (t) => set({ typeFilter: t }),

      create: (item) => {
        const id = crypto.randomUUID()
        set({
          items: [
            { ...item, id, completeness: calcCompleteness(item.criteria), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            ...get().items,
          ],
        })
      },

      update: (id, patch) =>
        set({
          items: get().items.map((i) => {
            if (i.id !== id) return i
            const merged = { ...i, ...patch }
            return { ...merged, completeness: calcCompleteness(merged.criteria) }
          }),
        }),

      remove: (id) => set({ items: get().items.filter((i) => i.id !== id), selectedId: get().selectedId === id ? null : get().selectedId }),

      toggleCriterion: (id, index) =>
        set({
          items: get().items.map((i) => {
            if (i.id !== id) return i
            const criteria = [...i.criteria]
            if (index < criteria.length) criteria[index] = { ...criteria[index], done: !criteria[index].done }
            return { ...i, criteria, completeness: calcCompleteness(criteria) }
          }),
        }),
    }),
    { name: 'product-os-handoff-store', partialize: (s) => ({ selectedId: s.selectedId, typeFilter: s.typeFilter }) },
  ),
)
