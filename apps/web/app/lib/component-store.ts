'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface PropDef {
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum' | 'color' | 'size'
  defaultValue?: string
  options?: string[]
  required?: boolean
  description?: string
}

export interface VariantDef {
  id: string
  name: string
  description?: string
  overrides?: Record<string, unknown>
}

export interface TokenBinding {
  property: string
  tokenPath: string
  tokenValue?: string
}

export type ComponentCategory = 'Layout' | 'Form' | 'Data' | 'Feedback' | 'Navigation'

export interface VersionSnapshot {
  label: string
  data: Record<string, unknown>
  createdAt: string
  createdBy?: string
}

export interface ComponentDef {
  id: string
  name: string
  category: ComponentCategory
  description: string
  props: PropDef[]
  variants: VariantDef[]
  tokenBindings: TokenBinding[]
  previewCode?: string
  usageCount: number
  version: number
  versionHistory: VersionSnapshot[]
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Deserializer                                                       */
/* ------------------------------------------------------------------ */
function parseComponent(node: Record<string, unknown>): ComponentDef {
  const data = (node.data ?? {}) as Record<string, unknown>
  const parseJson = (v: unknown, fallback: unknown[] = []) => {
    if (!v) return fallback
    if (typeof v === 'string') { try { return JSON.parse(v) } catch { return fallback } }
    return v
  }

  return {
    id: String(node.id),
    name: String(node.label ?? ''),
    category: (String(data.category || 'Layout')) as ComponentCategory,
    description: String(data.description || ''),
    props: parseJson(data.props, []) as PropDef[],
    variants: parseJson(data.variants, []) as VariantDef[],
    tokenBindings: parseJson(data.tokenBindings, []) as TokenBinding[],
    previewCode: data.previewCode ? String(data.previewCode) : undefined,
    usageCount: Number(data.usageCount || 0),
    version: Number(node.version || 1),
    versionHistory: parseJson(data.versionHistory, []) as VersionSnapshot[],
    createdAt: String(node.createdAt || new Date().toISOString()),
    updatedAt: String(node.updatedAt || new Date().toISOString()),
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */
interface ComponentState {
  components: ComponentDef[]
  selectedId: string | null
  loading: boolean
  error: string | null

  // Actions
  hydrate: (productId: string) => Promise<void>
  select: (id: string | null) => void
  create: (productId: string, data: Omit<ComponentDef, 'id' | 'version' | 'versionHistory' | 'usageCount' | 'createdAt' | 'updatedAt'>) => Promise<ComponentDef>
  update: (id: string, data: Partial<ComponentDef>) => Promise<void>
  remove: (id: string) => Promise<void>
  saveVersion: (id: string, label: string) => Promise<void>
  restoreVersion: (id: string, versionIndex: number) => Promise<void>
}

export const useComponentStore = create<ComponentState>()(
  persist(
    (set, get) => ({
      components: [],
      selectedId: null,
      loading: false,
      error: null,

      hydrate: async (productId) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch(`/api/trpc/component.list?input=${encodeURIComponent(JSON.stringify({ json: { productId } }))}`)
          const json = await res.json()
          const rows = json?.result?.data?.json ?? []
          set({ components: rows.map(parseComponent), loading: false })
        } catch (err) {
          set({ error: String(err), loading: false })
        }
      },

      select: (id) => set({ selectedId: id }),

      create: async (productId, data) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch('/api/trpc/component.create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              json: {
                productId,
                name: data.name,
                data: {
                  category: data.category,
                  description: data.description,
                  props: data.props,
                  variants: data.variants,
                  tokenBindings: data.tokenBindings,
                  previewCode: data.previewCode,
                },
              },
            }),
          })
          const json = await res.json()
          const node = json?.result?.data?.json
          const comp = parseComponent(node)
          set((s) => ({
            components: [comp, ...s.components],
            selectedId: comp.id,
            loading: false,
          }))
          return comp
        } catch (err) {
          set({ error: String(err), loading: false })
          throw err
        }
      },

      update: async (id, data) => {
        // Optimistic
        const prev = get().components
        const idx = prev.findIndex((c) => c.id === id)
        if (idx === -1) return

        const updated = { ...prev[idx], ...data, updatedAt: new Date().toISOString() }
        const next = [...prev]
        next[idx] = updated
        set({ components: next })

        try {
          await fetch('/api/trpc/component.update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              json: {
                id,
                name: data.name,
                data: {
                  category: data.category,
                  description: data.description,
                  props: data.props,
                  variants: data.variants,
                  tokenBindings: data.tokenBindings,
                  previewCode: data.previewCode,
                  usageCount: data.usageCount,
                },
              },
            }),
          })
        } catch {
          set({ components: prev }) // rollback
        }
      },

      remove: async (id) => {
        const prev = get().components
        set((s) => ({
          components: s.components.filter((c) => c.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        }))
        try {
          await fetch('/api/trpc/component.delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: { id } }),
          })
        } catch {
          set({ components: prev }) // rollback
        }
      },

      saveVersion: async (id, label) => {
        try {
          await fetch('/api/trpc/component.saveVersion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: { id, label } }),
          })
          // Re-hydrate to get updated history
          const comp = get().components.find((c) => c.id === id)
          if (comp) {
            const newSnapshot: VersionSnapshot = {
              label,
              data: {
                category: comp.category,
                description: comp.description,
                props: comp.props,
                variants: comp.variants,
                tokenBindings: comp.tokenBindings,
              },
              createdAt: new Date().toISOString(),
            }
            set((s) => ({
              components: s.components.map((c) =>
                c.id === id
                  ? { ...c, versionHistory: [...c.versionHistory, newSnapshot] }
                  : c,
              ),
            }))
          }
        } catch (err) {
          set({ error: String(err) })
        }
      },

      restoreVersion: async (id, versionIndex) => {
        try {
          const res = await fetch('/api/trpc/component.restoreVersion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: { id, versionIndex } }),
          })
          const json = await res.json()
          const node = json?.result?.data?.json
          if (node) {
            const comp = parseComponent(node)
            set((s) => ({
              components: s.components.map((c) => (c.id === id ? comp : c)),
            }))
          }
        } catch (err) {
          set({ error: String(err) })
        }
      },
    }),
    {
      name: 'product-os-components',
      partialize: (s) => ({ components: s.components, selectedId: s.selectedId }),
    },
  ),
)
