'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface ElementDef {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  style?: Record<string, unknown>
  content?: string
  children?: ElementDef[]
  componentRef?: string    // linked component node ID
  locked?: boolean
  visible?: boolean
}

export interface AutoLayoutConfig {
  direction: 'horizontal' | 'vertical'
  gap: number
  padding: number
  alignment: 'start' | 'center' | 'end' | 'stretch'
}

export interface GridSettings {
  columns: number
  gutter: number
  margin: number
  visible: boolean
}

export type ScreenCategory = 'mobile' | 'tablet' | 'desktop'

export interface ScreenDef {
  id: string
  name: string
  width: number
  height: number
  category: ScreenCategory
  elements: ElementDef[]
  gridSettings?: GridSettings
  autoLayout?: AutoLayoutConfig
  version: number
  createdAt: string
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/*  Deserializer                                                       */
/* ------------------------------------------------------------------ */
function parseScreen(node: Record<string, unknown>): ScreenDef {
  const data = (node.data ?? {}) as Record<string, unknown>
  const parseJson = (v: unknown, fallback: unknown[] = []) => {
    if (!v) return fallback
    if (typeof v === 'string') { try { return JSON.parse(v) } catch { return fallback } }
    return v
  }

  return {
    id: String(node.id),
    name: String(node.label ?? ''),
    width: Number(data.width || 1440),
    height: Number(data.height || 900),
    category: (String(data.category || 'desktop')) as ScreenCategory,
    elements: parseJson(data.elements, []) as ElementDef[],
    gridSettings: data.gridSettings as GridSettings | undefined,
    autoLayout: data.autoLayout as AutoLayoutConfig | undefined,
    version: Number(node.version || 1),
    createdAt: String(node.createdAt || new Date().toISOString()),
    updatedAt: String(node.updatedAt || new Date().toISOString()),
  }
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */
interface DesignState {
  screens: ScreenDef[]
  selectedScreenId: string | null
  selectedElementId: string | null
  inspectMode: boolean
  tool: 'select' | 'hand' | 'rectangle' | 'text' | 'image' | 'divider' | 'component'
  componentPaletteOpen: boolean
  loading: boolean
  error: string | null

  // Screen actions
  hydrate: (productId: string) => Promise<void>
  selectScreen: (id: string | null) => void
  createScreen: (productId: string, data: Omit<ScreenDef, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => Promise<ScreenDef>
  updateScreen: (id: string, data: Partial<ScreenDef>) => Promise<void>
  deleteScreen: (id: string) => Promise<void>

  // Element actions
  selectElement: (id: string | null) => void
  addElement: (screenId: string, element: ElementDef) => void
  updateElement: (screenId: string, elementId: string, updates: Partial<ElementDef>) => void
  deleteElement: (screenId: string, elementId: string) => void

  // Component placement
  placeComponent: (screenId: string, componentId: string, componentLabel: string, x: number, y: number) => void

  // Auto-layout
  applyAutoLayout: (screenId: string, elementId: string, config: AutoLayoutConfig) => void

  // Tools
  setTool: (tool: DesignState['tool']) => void
  toggleInspectMode: () => void
  toggleComponentPalette: () => void
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      screens: [],
      selectedScreenId: null,
      selectedElementId: null,
      inspectMode: false,
      tool: 'select',
      componentPaletteOpen: false,
      loading: false,
      error: null,

      /* ---- Screen actions ----------------------------------------- */
      hydrate: async (productId) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch(`/api/trpc/design.listScreens?input=${encodeURIComponent(JSON.stringify({ json: { productId } }))}`)
          const json = await res.json()
          const rows = json?.result?.data?.json ?? []
          set({ screens: rows.map(parseScreen), loading: false })
        } catch (err) {
          set({ error: String(err), loading: false })
        }
      },

      selectScreen: (id) => set({ selectedScreenId: id, selectedElementId: null }),

      createScreen: async (productId, data) => {
        set({ loading: true, error: null })
        try {
          const res = await fetch('/api/trpc/design.createScreen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              json: {
                productId,
                name: data.name,
                data: {
                  width: data.width,
                  height: data.height,
                  category: data.category,
                  elements: data.elements,
                  gridSettings: data.gridSettings,
                  autoLayout: data.autoLayout,
                },
              },
            }),
          })
          const json = await res.json()
          const node = json?.result?.data?.json
          const screen = parseScreen(node)
          set((s) => ({
            screens: [screen, ...s.screens],
            selectedScreenId: screen.id,
            loading: false,
          }))
          return screen
        } catch (err) {
          set({ error: String(err), loading: false })
          throw err
        }
      },

      updateScreen: async (id, data) => {
        const prev = get().screens
        set((s) => ({
          screens: s.screens.map((sc) =>
            sc.id === id ? { ...sc, ...data, updatedAt: new Date().toISOString() } : sc,
          ),
        }))
        try {
          await fetch('/api/trpc/design.updateScreen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              json: {
                id,
                name: data.name,
                data: {
                  width: data.width,
                  height: data.height,
                  category: data.category,
                  elements: data.elements,
                  gridSettings: data.gridSettings,
                  autoLayout: data.autoLayout,
                },
              },
            }),
          })
        } catch {
          set({ screens: prev })
        }
      },

      deleteScreen: async (id) => {
        const prev = get().screens
        set((s) => ({
          screens: s.screens.filter((sc) => sc.id !== id),
          selectedScreenId: s.selectedScreenId === id ? null : s.selectedScreenId,
        }))
        try {
          await fetch('/api/trpc/design.deleteScreen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ json: { id } }),
          })
        } catch {
          set({ screens: prev })
        }
      },

      /* ---- Element actions ---------------------------------------- */
      selectElement: (id) => set({ selectedElementId: id }),

      addElement: (screenId, element) => {
        set((s) => ({
          screens: s.screens.map((sc) =>
            sc.id === screenId
              ? { ...sc, elements: [...sc.elements, element] }
              : sc,
          ),
        }))
      },

      updateElement: (screenId, elementId, updates) => {
        set((s) => ({
          screens: s.screens.map((sc) => {
            if (sc.id !== screenId) return sc
            return {
              ...sc,
              elements: sc.elements.map((el) =>
                el.id === elementId ? { ...el, ...updates } : el,
              ),
            }
          }),
        }))
      },

      deleteElement: (screenId, elementId) => {
        set((s) => ({
          screens: s.screens.map((sc) =>
            sc.id === screenId
              ? { ...sc, elements: sc.elements.filter((el) => el.id !== elementId) }
              : sc,
          ),
          selectedElementId: s.selectedElementId === elementId ? null : s.selectedElementId,
        }))
      },

      /* ---- Component placement ------------------------------------ */
      placeComponent: (screenId, componentId, componentLabel, x, y) => {
        const element: ElementDef = {
          id: `el-comp-${Date.now()}`,
          type: 'ComponentInstance',
          x,
          y,
          width: 200,
          height: 100,
          componentRef: componentId,
          content: componentLabel,
          style: {
            border: '1px dashed var(--accent)',
            background: 'var(--bg-elevated)',
            borderRadius: '8px',
          },
        }
        get().addElement(screenId, element)
        set({ selectedElementId: element.id, tool: 'select' })
      },

      /* ---- Auto-layout -------------------------------------------- */
      applyAutoLayout: (screenId, elementId, config) => {
        set((s) => ({
          screens: s.screens.map((sc) => {
            if (sc.id !== screenId) return sc
            return {
              ...sc,
              elements: sc.elements.map((el) => {
                if (el.id !== elementId || !el.children?.length) return el
                let currentPos = config.padding
                const children = el.children.map((child) => {
                  const updated = { ...child }
                  if (config.direction === 'vertical') {
                    updated.x = config.alignment === 'center' ? (el.width - child.width) / 2
                      : config.alignment === 'end' ? el.width - child.width - config.padding
                      : config.padding
                    updated.y = currentPos
                    currentPos += child.height + config.gap
                  } else {
                    updated.x = currentPos
                    updated.y = config.alignment === 'center' ? (el.height - child.height) / 2
                      : config.alignment === 'end' ? el.height - child.height - config.padding
                      : config.padding
                    currentPos += child.width + config.gap
                  }
                  return updated
                })
                return {
                  ...el,
                  children,
                  style: { ...el.style, autoLayout: config },
                }
              }),
            }
          }),
        }))
      },

      /* ---- Tools -------------------------------------------------- */
      setTool: (tool) => set({ tool }),
      toggleInspectMode: () => set((s) => ({ inspectMode: !s.inspectMode })),
      toggleComponentPalette: () => set((s) => ({ componentPaletteOpen: !s.componentPaletteOpen })),
    }),
    {
      name: 'product-os-design',
      partialize: (s) => ({ screens: s.screens, selectedScreenId: s.selectedScreenId }),
    },
  ),
)
