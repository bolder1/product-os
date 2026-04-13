'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ReleaseStatus = 'draft' | 'staging' | 'production' | 'rolled-back'

export interface ReleaseChange {
  name: string
  type: 'component' | 'page' | 'api' | 'config' | 'style' | 'entity' | 'workflow'
  changeType: 'added' | 'modified' | 'removed'
  nodeId?: string
}

export interface ReleaseChecklist {
  qa: boolean
  stakeholder: boolean
  docs: boolean
  migration: boolean
}

export interface Release {
  id: string
  productId: string
  version: string
  title: string
  status: ReleaseStatus
  notes: string
  changes: ReleaseChange[]
  checklist: ReleaseChecklist
  environment?: string
  deployedAt?: string
  rollbackReason?: string
  createdAt?: string
  updatedAt?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseRelease(raw: Record<string, unknown>): Release {
  const data = (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) ?? {}
  return {
    id: raw.id as string,
    productId: raw.productId as string,
    version: data.version ?? '',
    title: data.title ?? raw.label ?? '',
    status: data.status ?? 'draft',
    notes: data.notes ?? '',
    changes: data.changes ?? [],
    checklist: data.checklist ?? { qa: false, stakeholder: false, docs: false, migration: false },
    environment: data.environment,
    deployedAt: data.deployedAt,
    rollbackReason: data.rollbackReason,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface ReleaseState {
  releases: Release[]
  selectedId: string | null
  statusFilter: 'all' | ReleaseStatus
  loading: boolean

  hydrate: (raw: Record<string, unknown>[]) => void
  select: (id: string | null) => void
  setStatusFilter: (s: 'all' | ReleaseStatus) => void

  create: (r: Omit<Release, 'id' | 'createdAt' | 'updatedAt'>) => void
  update: (id: string, patch: Partial<Release>) => void
  remove: (id: string) => void

  deploy: (id: string, environment: 'staging' | 'production') => void
  rollback: (id: string, reason: string) => void
  updateChecklist: (id: string, patch: Partial<ReleaseChecklist>) => void
}

export const useReleaseStore = create<ReleaseState>()(
  persist(
    (set, get) => ({
      releases: [],
      selectedId: null,
      statusFilter: 'all',
      loading: false,

      hydrate: (raw) => set({ releases: raw.map(parseRelease), loading: false }),
      select: (id) => set({ selectedId: id }),
      setStatusFilter: (s) => set({ statusFilter: s }),

      create: (r) => {
        const id = crypto.randomUUID()
        set({ releases: [{ ...r, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...get().releases] })
      },

      update: (id, patch) =>
        set({
          releases: get().releases.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r,
          ),
        }),

      remove: (id) =>
        set({
          releases: get().releases.filter((r) => r.id !== id),
          selectedId: get().selectedId === id ? null : get().selectedId,
        }),

      deploy: (id, environment) =>
        set({
          releases: get().releases.map((r) =>
            r.id === id
              ? { ...r, status: environment as ReleaseStatus, environment, deployedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : r,
          ),
        }),

      rollback: (id, reason) =>
        set({
          releases: get().releases.map((r) =>
            r.id === id
              ? { ...r, status: 'rolled-back' as const, rollbackReason: reason, updatedAt: new Date().toISOString() }
              : r,
          ),
        }),

      updateChecklist: (id, patch) =>
        set({
          releases: get().releases.map((r) =>
            r.id === id
              ? { ...r, checklist: { ...r.checklist, ...patch }, updatedAt: new Date().toISOString() }
              : r,
          ),
        }),
    }),
    { name: 'product-os-release-store', partialize: (s) => ({ selectedId: s.selectedId, statusFilter: s.statusFilter }) },
  ),
)
