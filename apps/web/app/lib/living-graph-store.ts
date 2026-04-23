'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrgRole } from './role-config'

export interface GraphSnapshot {
  id: string
  takenAt: string
  reason?: string
  payload: {
    nodes: Array<Record<string, unknown>>
    edges: Array<Record<string, unknown>>
  }
}

export interface NodeVersion {
  nodeId: string
  version: number
  changedBy?: string
  changedAt: string
  diff: Record<string, unknown>
}

export interface LivingGraphFilter {
  studios: string[] // whitelist of studio keys
}

const ROLE_PRESETS: Record<OrgRole, LivingGraphFilter> = {
  admin: { studios: [] }, // empty = show all
  manager: { studios: [] },
  business_analyst: { studios: ['planner', 'canvas', 'analytics', 'templates'] },
  qa: { studios: ['testing', 'releases', 'tasks', 'approvals'] },
  product_designer: { studios: ['brand', 'components', 'design', 'pages', 'graphics', 'brand-compliance'] },
  frontend_dev: { studios: ['code', 'handoff', 'components', 'pages'] },
  backend_dev: { studios: ['code', 'handoff', 'workflow'] },
  viewer: { studios: ['control-tower', 'analytics'] },
}

interface LivingGraphState {
  snapshotsByProduct: Record<string, GraphSnapshot[]>
  versionsByNode: Record<string, NodeVersion[]>
  currentSnapshotId: string | null // when null, show live state
  activeRole: OrgRole | null // overrides user's own role when set
  addSnapshot: (productId: string, snapshot: GraphSnapshot) => void
  setSnapshots: (productId: string, snapshots: GraphSnapshot[]) => void
  setCurrentSnapshot: (id: string | null) => void
  setActiveRole: (role: OrgRole | null) => void
  pushNodeVersion: (version: NodeVersion) => void
  filterFor: (role: OrgRole) => LivingGraphFilter
}

export const useLivingGraphStore = create<LivingGraphState>()(
  persist(
    (set, get) => ({
      snapshotsByProduct: {},
      versionsByNode: {},
      currentSnapshotId: null,
      activeRole: null,
      addSnapshot: (productId, snapshot) =>
        set((s) => ({
          snapshotsByProduct: {
            ...s.snapshotsByProduct,
            [productId]: [snapshot, ...(s.snapshotsByProduct[productId] ?? [])].slice(0, 100),
          },
        })),
      setSnapshots: (productId, snapshots) =>
        set((s) => ({ snapshotsByProduct: { ...s.snapshotsByProduct, [productId]: snapshots } })),
      setCurrentSnapshot: (id) => set({ currentSnapshotId: id }),
      setActiveRole: (role) => set({ activeRole: role }),
      pushNodeVersion: (version) =>
        set((s) => ({
          versionsByNode: {
            ...s.versionsByNode,
            [version.nodeId]: [version, ...(s.versionsByNode[version.nodeId] ?? [])].slice(0, 50),
          },
        })),
      filterFor: (role) => get().activeRole ? (ROLE_PRESETS[get().activeRole!]) : ROLE_PRESETS[role],
    }),
    { name: 'product-os-living-graph' },
  ),
)

export { ROLE_PRESETS }
