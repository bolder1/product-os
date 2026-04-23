'use client'

/**
 * R8 — Graph Inspector store.
 *
 * Tracks the currently-selected graph node and whether the right-rail
 * Inspector is open. Every studio can call `inspect(nodeId)` or
 * `inspectEntity(kind, id)` to surface graph context (incoming/outgoing
 * edges, related nodes, versions, decisions) without leaving the studio.
 *
 * This is deliberately small — heavy lifting lives in <GraphInspector/>
 * which reads from useGraphStore / useDecisionStore / useLivingGraphStore.
 */

import { create } from 'zustand'

export type InspectorTab = 'overview' | 'connections' | 'history' | 'impact'

interface InspectorState {
  open: boolean
  selectedNodeId: string | null
  tab: InspectorTab
  /** Optional external-id lookup used when a studio doesn't know the graph node id yet. */
  selectedEntity: { kind: string; id: string } | null

  openInspector: () => void
  closeInspector: () => void
  toggleInspector: () => void
  inspect: (nodeId: string) => void
  inspectEntity: (kind: string, id: string) => void
  setTab: (tab: InspectorTab) => void
  clear: () => void
}

export const useInspectorStore = create<InspectorState>((set) => ({
  open: false,
  selectedNodeId: null,
  tab: 'overview',
  selectedEntity: null,

  openInspector: () => set({ open: true }),
  closeInspector: () => set({ open: false }),
  toggleInspector: () => set((s) => ({ open: !s.open })),
  inspect: (nodeId) => set({ open: true, selectedNodeId: nodeId, selectedEntity: null, tab: 'overview' }),
  inspectEntity: (kind, id) =>
    set({ open: true, selectedEntity: { kind, id }, selectedNodeId: null, tab: 'overview' }),
  setTab: (tab) => set({ tab }),
  clear: () => set({ selectedNodeId: null, selectedEntity: null }),
}))
