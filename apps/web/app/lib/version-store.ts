'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useGraphStore, type GraphNode, type GraphEdge } from './graph-store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VersionSnapshot {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface Version {
  id: string
  productId: string
  label: string
  description?: string
  parentId: string | null
  branchName: string
  createdAt: string
  createdBy: { id: string; name: string; initials: string }
  snapshot: VersionSnapshot
}

export type BranchStatus = 'active' | 'merged' | 'abandoned'

export interface Branch {
  id: string
  name: string
  productId: string
  sourceVersionId: string
  status: BranchStatus
  createdAt: string
}

export interface VersionDiff {
  added: GraphNode[]
  removed: GraphNode[]
  modified: { before: GraphNode; after: GraphNode }[]
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface VersionState {
  versions: Version[]
  branches: Branch[]
  activeBranches: Record<string, string> // productId -> branchName

  // Version operations
  createVersion: (
    productId: string,
    label: string,
    description?: string,
    createdBy?: { id: string; name: string; initials: string }
  ) => Version
  getVersion: (id: string) => Version | undefined
  getVersionHistory: (productId: string) => Version[]
  compareVersions: (v1Id: string, v2Id: string) => VersionDiff | null
  restoreVersion: (versionId: string) => void

  // Branch operations
  createBranch: (name: string, sourceVersionId: string) => Branch | null
  mergeBranch: (branchId: string, targetVersionId: string) => Version | null
  getBranches: (productId: string) => Branch[]
  getActiveBranch: (productId: string) => string
  setActiveBranch: (productId: string, branchName: string) => void
  abandonBranch: (branchId: string) => void

  // UI state
  isPanelOpen: boolean
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
}

let versionCounter = 0
let branchCounter = 0

function versionId(): string {
  versionCounter += 1
  return `ver-${Date.now()}-${versionCounter}`
}

function branchId(): string {
  branchCounter += 1
  return `br-${Date.now()}-${branchCounter}`
}

function captureSnapshot(productId: string): VersionSnapshot {
  const graphState = useGraphStore.getState()
  return {
    nodes: graphState.nodes.filter((n) => n.productId === productId),
    edges: graphState.edges.filter((e) => e.productId === productId),
  }
}

function diffSnapshots(
  oldSnap: VersionSnapshot,
  newSnap: VersionSnapshot
): VersionDiff {
  const oldNodeMap = new Map(oldSnap.nodes.map((n) => [n.id, n]))
  const newNodeMap = new Map(newSnap.nodes.map((n) => [n.id, n]))

  const added: GraphNode[] = []
  const removed: GraphNode[] = []
  const modified: { before: GraphNode; after: GraphNode }[] = []

  // Find added and modified
  for (const [id, node] of newNodeMap) {
    const oldNode = oldNodeMap.get(id)
    if (!oldNode) {
      added.push(node)
    } else if (oldNode.updatedAt !== node.updatedAt || oldNode.label !== node.label) {
      modified.push({ before: oldNode, after: node })
    }
  }

  // Find removed
  for (const [id, node] of oldNodeMap) {
    if (!newNodeMap.has(id)) {
      removed.push(node)
    }
  }

  return { added, removed, modified }
}

export const useVersionStore = create<VersionState>()(
  persist(
    (set, get) => ({
      versions: [],
      branches: [],
      activeBranches: {},
      isPanelOpen: false,

      // -- Version operations --

      createVersion: (productId, label, description, createdBy) => {
        const state = get()
        const branchName = state.activeBranches[productId] || 'main'
        const snapshot = captureSnapshot(productId)

        // Find the latest version on this branch for parentId
        const branchVersions = state.versions
          .filter((v) => v.productId === productId && v.branchName === branchName)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const parentId = branchVersions.length > 0 ? branchVersions[0].id : null

        const version: Version = {
          id: versionId(),
          productId,
          label,
          description,
          parentId,
          branchName,
          createdAt: new Date().toISOString(),
          createdBy: createdBy || { id: 'user-1', name: 'You', initials: 'YO' },
          snapshot,
        }

        set((s) => ({
          versions: [version, ...s.versions],
        }))

        return version
      },

      getVersion: (id) => get().versions.find((v) => v.id === id),

      getVersionHistory: (productId) =>
        get()
          .versions.filter((v) => v.productId === productId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

      compareVersions: (v1Id, v2Id) => {
        const v1 = get().versions.find((v) => v.id === v1Id)
        const v2 = get().versions.find((v) => v.id === v2Id)
        if (!v1 || !v2) return null
        return diffSnapshots(v1.snapshot, v2.snapshot)
      },

      restoreVersion: (versionId) => {
        const version = get().versions.find((v) => v.id === versionId)
        if (!version) return

        const graphStore = useGraphStore.getState()

        // Clear current product graph and replace with snapshot
        graphStore.clearProduct(version.productId)

        // Restore nodes
        const now = new Date().toISOString()
        for (const node of version.snapshot.nodes) {
          // Re-add through direct state mutation to preserve original IDs
          useGraphStore.setState((s) => ({
            nodes: [...s.nodes, { ...node, updatedAt: now }],
          }))
        }
        // Restore edges
        for (const edge of version.snapshot.edges) {
          useGraphStore.setState((s) => ({
            edges: [...s.edges, edge],
          }))
        }
      },

      // -- Branch operations --

      createBranch: (name, sourceVersionId) => {
        const version = get().versions.find((v) => v.id === sourceVersionId)
        if (!version) return null

        // Check if branch name already exists for this product
        const existing = get().branches.find(
          (b) => b.productId === version.productId && b.name === name && b.status === 'active'
        )
        if (existing) return null

        const branch: Branch = {
          id: branchId(),
          name,
          productId: version.productId,
          sourceVersionId,
          status: 'active',
          createdAt: new Date().toISOString(),
        }

        // Create an initial version on the new branch (copies the source snapshot)
        const branchVersion: Version = {
          id: versionId(),
          productId: version.productId,
          label: `Branch: ${name}`,
          description: `Branched from "${version.label}"`,
          parentId: sourceVersionId,
          branchName: name,
          createdAt: new Date().toISOString(),
          createdBy: version.createdBy,
          snapshot: { ...version.snapshot },
        }

        set((s) => ({
          branches: [branch, ...s.branches],
          versions: [branchVersion, ...s.versions],
          activeBranches: { ...s.activeBranches, [version.productId]: name },
        }))

        return branch
      },

      mergeBranch: (branchId, targetVersionId) => {
        const state = get()
        const branch = state.branches.find((b) => b.id === branchId)
        const targetVersion = state.versions.find((v) => v.id === targetVersionId)
        if (!branch || !targetVersion) return null

        // Get the latest version on the branch being merged
        const branchVersions = state.versions
          .filter((v) => v.productId === branch.productId && v.branchName === branch.name)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        if (branchVersions.length === 0) return null

        const latestBranchVersion = branchVersions[0]

        // Create a merge version on the target branch
        const mergeVersion: Version = {
          id: versionId(),
          productId: branch.productId,
          label: `Merge: ${branch.name} into ${targetVersion.branchName}`,
          description: `Merged branch "${branch.name}" into "${targetVersion.branchName}"`,
          parentId: targetVersionId,
          branchName: targetVersion.branchName,
          createdAt: new Date().toISOString(),
          createdBy: latestBranchVersion.createdBy,
          snapshot: { ...latestBranchVersion.snapshot },
        }

        set((s) => ({
          versions: [mergeVersion, ...s.versions],
          branches: s.branches.map((b) =>
            b.id === branchId ? { ...b, status: 'merged' as BranchStatus } : b
          ),
          activeBranches: {
            ...s.activeBranches,
            [branch.productId]: targetVersion.branchName,
          },
        }))

        return mergeVersion
      },

      getBranches: (productId) =>
        get().branches.filter((b) => b.productId === productId),

      getActiveBranch: (productId) =>
        get().activeBranches[productId] || 'main',

      setActiveBranch: (productId, branchName) => {
        set((s) => ({
          activeBranches: { ...s.activeBranches, [productId]: branchName },
        }))
      },

      abandonBranch: (branchId) => {
        set((s) => ({
          branches: s.branches.map((b) =>
            b.id === branchId ? { ...b, status: 'abandoned' as BranchStatus } : b
          ),
        }))
      },

      // -- UI state --

      togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
      openPanel: () => set({ isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false }),
    }),
    {
      name: 'product-os-versions',
      partialize: (state) => ({
        versions: state.versions,
        branches: state.branches,
        activeBranches: state.activeBranches,
      }),
    }
  )
)
