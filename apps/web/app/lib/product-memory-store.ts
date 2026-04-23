'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MemoryStatus = 'queued' | 'parsing' | 'embedding' | 'ready' | 'failed' | 'uploading'
export type MemoryKind = 'pdf' | 'docx' | 'md' | 'txt' | 'image' | 'other'

export interface MemoryAsset {
  id: string
  productId: string
  kind: MemoryKind
  filename: string
  size: number
  status: MemoryStatus
  tags: string[]
  uploadedBy?: string
  error?: string | null
  createdAt: string
}

export interface RetrievedChunk {
  chunkId: string
  assetId: string
  filename: string
  ordinal: number
  text: string
  sourcePage: number | null
  score: number
}

interface MemoryState {
  assets: MemoryAsset[]
  recentRetrievals: Record<string, RetrievedChunk[]> // keyed by query
  addAsset: (asset: MemoryAsset) => void
  updateAsset: (id: string, patch: Partial<MemoryAsset>) => void
  removeAsset: (id: string) => void
  setAssets: (assets: MemoryAsset[]) => void
  cacheRetrieval: (query: string, chunks: RetrievedChunk[]) => void
  clear: () => void
}

export const useProductMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      assets: [],
      recentRetrievals: {},
      addAsset: (asset) =>
        set((s) => ({ assets: [asset, ...s.assets.filter((a) => a.id !== asset.id)] })),
      updateAsset: (id, patch) =>
        set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeAsset: (id) => set((s) => ({ assets: s.assets.filter((a) => a.id !== id) })),
      setAssets: (assets) => set({ assets }),
      cacheRetrieval: (query, chunks) =>
        set((s) => ({ recentRetrievals: { ...s.recentRetrievals, [query]: chunks } })),
      clear: () => set({ assets: [], recentRetrievals: {} }),
    }),
    { name: 'product-os-memory' },
  ),
)

export function kindFromFilename(filename: string): MemoryKind {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'md' || ext === 'markdown') return 'md'
  if (ext === 'txt') return 'txt'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  return 'other'
}
