'use client'

/**
 * Design Canvas Store
 *
 * Source of truth for the Design Studio canvas state:
 *   - Frames (artboards) with child layers
 *   - Selection, camera (pan/zoom), tool mode
 *   - History (undo/redo)
 *   - Per-frame export state
 *
 * All mutations emit events on the eventBus for cross-workspace side-effects.
 */

import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { trpcMutate } from './api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LayerKind =
  | 'frame'      // top-level artboard
  | 'group'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'image'
  | 'component'  // instance of a Component workspace component
  | 'vector'
  | 'line'

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'

export interface Fill {
  type: 'solid' | 'linear' | 'radial' | 'image'
  color?: string         // hex for solid
  opacity: number
  stops?: Array<{ offset: number; color: string }>
  imageUrl?: string
}

export interface Stroke {
  color: string
  width: number
  align: 'inside' | 'outside' | 'center'
  dashArray?: number[]
}

export interface Shadow {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  inset: boolean
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  letterSpacing: number
  textAlign: 'left' | 'center' | 'right' | 'justify'
  color: string
  content: string
}

export interface CanvasLayer {
  id: string
  kind: LayerKind
  name: string
  parentId: string | null      // null = root frame
  frameId: string              // which top-level frame this belongs to

  // Geometry
  x: number
  y: number
  width: number
  height: number
  rotation: number             // degrees
  opacity: number
  visible: boolean
  locked: boolean

  // Style
  fills: Fill[]
  strokes: Stroke[]
  shadows: Shadow[]
  blendMode: BlendMode
  borderRadius?: number | [number, number, number, number]

  // Text (when kind === 'text')
  text?: TextStyle

  // Component instance (when kind === 'component')
  componentId?: string        // id in the Components workspace graph node
  componentProps?: Record<string, unknown>

  // Children order (ids, back-to-front)
  childIds: string[]

  createdAt: string
  updatedAt: string
}

export interface CanvasFrame extends CanvasLayer {
  kind: 'frame'
  parentId: null
  /** px dimensions define the artboard size */
  preset?: 'mobile' | 'tablet' | 'desktop' | 'custom'
  background: string           // css color
  exportedAt?: string
  exportFormats: Array<'tsx' | 'png' | 'svg' | 'pdf'>
  /** linked graph node id (screen/page) */
  graphNodeId?: string
}

export type ToolMode =
  | 'select'
  | 'frame'
  | 'rectangle'
  | 'ellipse'
  | 'text'
  | 'pen'
  | 'image'
  | 'hand'
  | 'zoom'

export interface Camera {
  x: number         // pan offset x (px)
  y: number         // pan offset y (px)
  zoom: number      // 1 = 100%
}

export interface HistoryEntry {
  frames: CanvasFrame[]
  layers: CanvasLayer[]
  timestamp: string
  description: string
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface DesignCanvasState {
  productId: string | null

  frames: CanvasFrame[]
  layers: CanvasLayer[]

  // Selection
  selectedIds: string[]
  hoveredId: string | null

  // Camera
  camera: Camera

  // Tool
  tool: ToolMode

  // History
  history: HistoryEntry[]
  historyIndex: number           // pointer into history[]

  // Export
  exportingFrameId: string | null
  lastExportUrl: string | null

  // ── Actions ──

  // Init
  setProductId: (id: string) => void

  // Frames
  addFrame: (frame: Omit<CanvasFrame, 'id' | 'createdAt' | 'updatedAt' | 'childIds'>) => CanvasFrame
  updateFrame: (id: string, updates: Partial<CanvasFrame>) => void
  deleteFrame: (id: string) => void
  getFrame: (id: string) => CanvasFrame | undefined

  // Layers
  addLayer: (layer: Omit<CanvasLayer, 'id' | 'createdAt' | 'updatedAt' | 'childIds'>) => CanvasLayer
  updateLayer: (id: string, updates: Partial<CanvasLayer>) => void
  deleteLayer: (id: string) => void
  moveLayer: (id: string, newParentId: string | null, index?: number) => void
  duplicateLayer: (id: string) => CanvasLayer | null
  getLayer: (id: string) => CanvasLayer | undefined

  // Selection
  select: (ids: string[]) => void
  selectAdd: (id: string) => void
  selectNone: () => void
  setHovered: (id: string | null) => void

  // Camera
  setCamera: (camera: Partial<Camera>) => void
  zoomTo: (zoom: number, cx?: number, cy?: number) => void
  zoomFit: () => void

  // Tool
  setTool: (tool: ToolMode) => void

  // History
  pushHistory: (description: string) => void
  undo: () => void
  redo: () => void

  // Export
  setExportingFrame: (id: string | null) => void
  setLastExportUrl: (url: string | null) => void

  // Bulk
  clearCanvas: () => void
  loadFromGraphNode: (graphNodeId: string, label: string, productId: string) => CanvasFrame
}

// ---------------------------------------------------------------------------
// ID generators
// ---------------------------------------------------------------------------

let layerCounter = 0
function lid(): string {
  layerCounter += 1
  return `layer-${Date.now()}-${layerCounter}`
}

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const DEFAULT_FILLS: Fill[] = [{ type: 'solid', color: '#ffffff', opacity: 1 }]
const DEFAULT_FRAME_PRESETS: Record<string, { width: number; height: number }> = {
  mobile:  { width: 390,  height: 844 },
  tablet:  { width: 768,  height: 1024 },
  desktop: { width: 1440, height: 900 },
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useDesignCanvasStore = create<DesignCanvasState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        productId: null,
        frames: [],
        layers: [],
        selectedIds: [],
        hoveredId: null,
        camera: { x: 0, y: 0, zoom: 1 },
        tool: 'select',
        history: [],
        historyIndex: -1,
        exportingFrameId: null,
        lastExportUrl: null,

        // ── Init ──

        setProductId: (id) => set({ productId: id }),

        // ── Frames ──

        addFrame: (data) => {
          const now = new Date().toISOString()
          const frame: CanvasFrame = {
            ...data,
            id: lid(),
            childIds: [],
            createdAt: now,
            updatedAt: now,
          }
          set((s) => ({ frames: [...s.frames, frame] }))
          get().pushHistory(`Add frame "${frame.name}"`)
          return frame
        },

        updateFrame: (id, updates) => {
          set((s) => ({
            frames: s.frames.map((f) =>
              f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
            ),
          }))
        },

        deleteFrame: (id) => {
          // Collect all layer ids belonging to this frame
          const frameLayerIds = get().layers.filter((l) => l.frameId === id).map((l) => l.id)
          set((s) => ({
            frames: s.frames.filter((f) => f.id !== id),
            layers: s.layers.filter((l) => l.frameId !== id),
            selectedIds: s.selectedIds.filter((sid) => sid !== id && !frameLayerIds.includes(sid)),
          }))
          get().pushHistory(`Delete frame`)
        },

        getFrame: (id) => get().frames.find((f) => f.id === id),

        // ── Layers ──

        addLayer: (data) => {
          const now = new Date().toISOString()
          const layer: CanvasLayer = {
            ...data,
            id: lid(),
            childIds: [],
            createdAt: now,
            updatedAt: now,
          }

          set((s) => {
            // Add layer
            const layers = [...s.layers, layer]

            // Register as child of its parent (frame or group)
            if (layer.parentId) {
              return {
                layers: layers.map((l) =>
                  l.id === layer.parentId
                    ? { ...l, childIds: [...l.childIds, layer.id] }
                    : l
                ),
              }
            } else {
              // Child of frame
              return {
                layers,
                frames: s.frames.map((f) =>
                  f.id === layer.frameId
                    ? { ...f, childIds: [...f.childIds, layer.id] }
                    : f
                ),
              }
            }
          })

          get().pushHistory(`Add ${layer.kind}`)
          return layer
        },

        updateLayer: (id, updates) => {
          set((s) => ({
            layers: s.layers.map((l) =>
              l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
            ),
          }))
        },

        deleteLayer: (id) => {
          const layer = get().getLayer(id)
          if (!layer) return

          // Collect descendants recursively
          function collectIds(lid: string): string[] {
            const l = get().layers.find((x) => x.id === lid)
            if (!l) return [lid]
            return [lid, ...l.childIds.flatMap(collectIds)]
          }
          const toDelete = new Set(collectIds(id))

          set((s) => ({
            layers: s.layers.filter((l) => !toDelete.has(l.id)).map((l) => ({
              ...l,
              childIds: l.childIds.filter((cid) => !toDelete.has(cid)),
            })),
            frames: s.frames.map((f) => ({
              ...f,
              childIds: f.childIds.filter((cid) => !toDelete.has(cid)),
            })),
            selectedIds: s.selectedIds.filter((sid) => !toDelete.has(sid)),
          }))

          get().pushHistory(`Delete ${layer.kind}`)
        },

        moveLayer: (id, newParentId, index) => {
          const layer = get().getLayer(id)
          if (!layer || layer.parentId === newParentId) return

          set((s) => {
            // Remove from old parent
            let layers = s.layers.map((l) => ({
              ...l,
              childIds: l.childIds.filter((cid) => cid !== id),
            }))
            let frames = s.frames.map((f) => ({
              ...f,
              childIds: f.childIds.filter((cid) => cid !== id),
            }))

            // Update layer's parentId
            layers = layers.map((l) =>
              l.id === id ? { ...l, parentId: newParentId, updatedAt: new Date().toISOString() } : l
            )

            // Add to new parent
            if (newParentId) {
              layers = layers.map((l) => {
                if (l.id !== newParentId) return l
                const kids = [...l.childIds]
                if (index !== undefined) kids.splice(index, 0, id)
                else kids.push(id)
                return { ...l, childIds: kids }
              })
            } else {
              frames = frames.map((f) => {
                if (f.id !== layer.frameId) return f
                const kids = [...f.childIds]
                if (index !== undefined) kids.splice(index, 0, id)
                else kids.push(id)
                return { ...f, childIds: kids }
              })
            }

            return { layers, frames }
          })
        },

        duplicateLayer: (id) => {
          const original = get().getLayer(id)
          if (!original) return null

          const now = new Date().toISOString()
          const dup: CanvasLayer = {
            ...JSON.parse(JSON.stringify(original)),
            id: lid(),
            name: `${original.name} copy`,
            x: original.x + 20,
            y: original.y + 20,
            childIds: [],
            createdAt: now,
            updatedAt: now,
          }

          set((s) => {
            let layers = [...s.layers, dup]
            if (dup.parentId) {
              layers = layers.map((l) =>
                l.id === dup.parentId ? { ...l, childIds: [...l.childIds, dup.id] } : l
              )
            }
            const frames = s.frames.map((f) =>
              !dup.parentId && f.id === dup.frameId
                ? { ...f, childIds: [...f.childIds, dup.id] }
                : f
            )
            return { layers, frames, selectedIds: [dup.id] }
          })

          get().pushHistory(`Duplicate ${dup.kind}`)
          return dup
        },

        getLayer: (id) => get().layers.find((l) => l.id === id),

        // ── Selection ──

        select: (ids) => set({ selectedIds: ids }),
        selectAdd: (id) => set((s) => ({ selectedIds: [...new Set([...s.selectedIds, id])] })),
        selectNone: () => set({ selectedIds: [] }),
        setHovered: (id) => set({ hoveredId: id }),

        // ── Camera ──

        setCamera: (cam) => set((s) => ({ camera: { ...s.camera, ...cam } })),

        zoomTo: (zoom, cx, cy) => {
          const clamped = Math.min(Math.max(zoom, 0.05), 16)
          set((s) => {
            if (cx !== undefined && cy !== undefined) {
              // Zoom toward screen point (cx, cy)
              const scale = clamped / s.camera.zoom
              return {
                camera: {
                  x: cx - (cx - s.camera.x) * scale,
                  y: cy - (cy - s.camera.y) * scale,
                  zoom: clamped,
                },
              }
            }
            return { camera: { ...s.camera, zoom: clamped } }
          })
        },

        zoomFit: () => {
          // Reset to show all frames at a comfortable zoom
          set({ camera: { x: 64, y: 64, zoom: 0.75 } })
        },

        // ── Tool ──

        setTool: (tool) => set({ tool }),

        // ── History ──

        pushHistory: (description) => {
          const { frames, layers, history, historyIndex } = get()
          const entry: HistoryEntry = {
            frames: JSON.parse(JSON.stringify(frames)),
            layers: JSON.parse(JSON.stringify(layers)),
            timestamp: new Date().toISOString(),
            description,
          }
          // Truncate future if we branched
          const truncated = history.slice(0, historyIndex + 1)
          const next = [...truncated, entry].slice(-50) // keep 50 steps
          set({ history: next, historyIndex: next.length - 1 })
        },

        undo: () => {
          const { history, historyIndex } = get()
          if (historyIndex <= 0) return
          const prev = history[historyIndex - 1]
          set({ frames: prev.frames, layers: prev.layers, historyIndex: historyIndex - 1, selectedIds: [] })
        },

        redo: () => {
          const { history, historyIndex } = get()
          if (historyIndex >= history.length - 1) return
          const next = history[historyIndex + 1]
          set({ frames: next.frames, layers: next.layers, historyIndex: historyIndex + 1, selectedIds: [] })
        },

        // ── Export ──

        setExportingFrame: (id) => set({ exportingFrameId: id }),
        setLastExportUrl: (url) => set({ lastExportUrl: url }),

        // ── Bulk ──

        clearCanvas: () => set({
          frames: [],
          layers: [],
          selectedIds: [],
          hoveredId: null,
          history: [],
          historyIndex: -1,
        }),

        loadFromGraphNode: (graphNodeId, label, productId) => {
          const { addFrame } = get()
          const preset = DEFAULT_FRAME_PRESETS.desktop
          const frame = addFrame({
            kind: 'frame',
            name: label,
            parentId: null,
            frameId: '',         // self-referential for frames; resolved below
            x: 0,
            y: 0,
            width: preset.width,
            height: preset.height,
            rotation: 0,
            opacity: 1,
            visible: true,
            locked: false,
            fills: [{ type: 'solid', color: '#ffffff', opacity: 1 }],
            strokes: [],
            shadows: [],
            blendMode: 'normal',
            preset: 'desktop',
            background: '#f5f5f5',
            exportFormats: ['tsx', 'png'],
            graphNodeId,
          })
          // Patch frameId to be self-referential
          set((s) => ({
            frames: s.frames.map((f) => f.id === frame.id ? { ...f, frameId: f.id } : f),
          }))
          return frame
        },
      }),
      {
        name: 'product-os-design-canvas',
        // Don't persist history (too large) — only current canvas state
        partialize: (s) => ({
          productId: s.productId,
          frames: s.frames,
          layers: s.layers,
          camera: s.camera,
        }),
      }
    )
  )
)

// ---------------------------------------------------------------------------
// Derived selectors (stable — use these in components)
// ---------------------------------------------------------------------------

export function selectFramesByProduct(productId: string) {
  return (s: DesignCanvasState) => s.frames.filter((f) => f.graphNodeId || true)
}

export function selectLayersInFrame(frameId: string) {
  return (s: DesignCanvasState) => s.layers.filter((l) => l.frameId === frameId)
}

export function selectSelectedLayers(s: DesignCanvasState) {
  return s.selectedIds.map((id) => s.layers.find((l) => l.id === id) ?? s.frames.find((f) => f.id === id)).filter(Boolean)
}
