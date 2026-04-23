'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AssetType = 'illustration' | 'icon' | 'photo' | 'logo' | 'animation' | 'diagram'

export interface GraphicAsset {
  id: string
  productId: string
  label: string
  type: AssetType
  width?: number
  height?: number
  size?: string
  format?: string
  url?: string
  gradient?: [string, string]
  tags: string[]
  alt?: string
  createdAt?: string
  updatedAt?: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseAsset(raw: Record<string, unknown>): GraphicAsset {
  const data = (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) ?? {}
  return {
    id: raw.id as string,
    productId: raw.productId as string,
    label: raw.label as string,
    type: data.type ?? 'illustration',
    width: data.width,
    height: data.height,
    size: data.size,
    format: data.format,
    url: data.url,
    gradient: data.gradient,
    tags: data.tags ?? [],
    alt: data.alt,
    createdAt: raw.createdAt as string | undefined,
    updatedAt: raw.updatedAt as string | undefined,
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface GraphicsState {
  assets: GraphicAsset[]
  selectedId: string | null
  typeFilter: 'all' | AssetType
  search: string
  view: 'grid' | 'list'
  uploadOpen: boolean
  loading: boolean

  hydrate: (raw: Record<string, unknown>[]) => void
  select: (id: string | null) => void
  setTypeFilter: (t: 'all' | AssetType) => void
  setSearch: (q: string) => void
  setView: (v: 'grid' | 'list') => void
  setUploadOpen: (open: boolean) => void

  create: (asset: Omit<GraphicAsset, 'id' | 'createdAt' | 'updatedAt'>) => void
  update: (id: string, patch: Partial<GraphicAsset>) => void
  remove: (id: string) => void
  addTag: (id: string, tag: string) => void
  removeTag: (id: string, tag: string) => void
}

export const useGraphicsStore = create<GraphicsState>()(
  persist(
    (set, get) => ({
      assets: [],
      selectedId: null,
      typeFilter: 'all',
      search: '',
      view: 'grid',
      uploadOpen: false,
      loading: false,

      hydrate: (raw) => set({ assets: raw.map(parseAsset), loading: false }),
      select: (id) => set({ selectedId: id }),
      setTypeFilter: (t) => set({ typeFilter: t }),
      setSearch: (q) => set({ search: q }),
      setView: (v) => set({ view: v }),
      setUploadOpen: (open) => set({ uploadOpen: open }),

      create: (asset) => {
        const id = crypto.randomUUID()
        set({ assets: [{ ...asset, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...get().assets] })
      },

      update: (id, patch) =>
        set({
          assets: get().assets.map((a) =>
            a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
          ),
        }),

      remove: (id) =>
        set({
          assets: get().assets.filter((a) => a.id !== id),
          selectedId: get().selectedId === id ? null : get().selectedId,
        }),

      addTag: (id, tag) =>
        set({
          assets: get().assets.map((a) => {
            if (a.id !== id || a.tags.includes(tag)) return a
            return { ...a, tags: [...a.tags, tag] }
          }),
        }),

      removeTag: (id, tag) =>
        set({
          assets: get().assets.map((a) =>
            a.id === id ? { ...a, tags: a.tags.filter((t) => t !== tag) } : a,
          ),
        }),
    }),
    { name: 'product-os-graphics-store', partialize: (s) => ({ typeFilter: s.typeFilter, view: s.view }) },
  ),
)
