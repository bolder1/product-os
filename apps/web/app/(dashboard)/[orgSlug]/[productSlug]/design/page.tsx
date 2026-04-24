'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import {
  Plus, ScanSearch, PenTool, Layers, MousePointer2, Hand,
  Square, Type, Image, Minus, Package, ArrowUpRight, Undo2, Redo2,
  Frame,
} from 'lucide-react'
import ScreenList from './_components/screen-list'
import DesignCanvas from './_components/design-canvas'
import PropertiesPanel from './_components/properties-panel'
import InspectPanel from './_components/inspect-panel'
import { ComponentPalette } from './_components/component-palette'
import { ExtractComponentModal } from './_components/extract-component-modal'
import { StudioHealthBadge } from '../../../../components/shared/studio-health-badge'
import { ContextBanner, brandDep, componentsDep, brandVoiceDep } from '../../../../components/shared/upstream-empty-state'
import { AnalyticsOverlay } from '../../../../components/shared/analytics-overlay'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { ExportMenu } from '../../../../components/primitives/export-menu'
import { useGraphStore } from '../../../../lib/graph-store'
import { useDesignCanvasStore } from '../../../../lib/design-canvas-store'
import { useAuthStore } from '../../../../lib/auth-store'
import { eventBus, makeActor } from '../../../../lib/event-bus'
import { outputPipeline } from '../../../../lib/output-pipeline'
import type { ScreenDef, ElementDef } from './_data/mock-screens'
import type { ExportFormat } from '../../../../lib/output-pipeline'

// ---------------------------------------------------------------------------
// Adapters: convert canvas store frames/layers ↔ ScreenDef/ElementDef
// so existing sub-components still work without changes
// ---------------------------------------------------------------------------

function frameToScreen(frame: ReturnType<typeof useDesignCanvasStore.getState>['frames'][0]): ScreenDef {
  return {
    id: frame.id,
    name: frame.name,
    width: frame.width,
    height: frame.height,
    category: frame.preset === 'mobile' ? 'mobile' : frame.preset === 'tablet' ? 'tablet' : 'desktop',
    elements: [], // elements fed separately from layers
  }
}

function layerToElement(layer: ReturnType<typeof useDesignCanvasStore.getState>['layers'][0]): ElementDef {
  const fill = layer.fills[0]
  const bg = fill?.type === 'solid' ? fill.color ?? 'transparent' : 'rgba(255,255,255,0.03)'
  return {
    id: layer.id,
    type: layer.kind === 'component' ? 'ComponentInstance'
      : layer.kind === 'text' ? 'Text'
      : layer.kind === 'rectangle' ? 'Rectangle'
      : layer.kind === 'ellipse' ? 'Ellipse'
      : layer.kind === 'image' ? 'Image'
      : 'Rectangle',
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    style: {
      background: bg,
      borderRadius: typeof layer.borderRadius === 'number' ? `${layer.borderRadius}px` : '4px',
      opacity: String(layer.opacity),
    },
    content: layer.kind === 'text' ? (layer.text?.content ?? layer.name) : layer.name,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DesignStudioPage() {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  // Auth
  const userId = useAuthStore((s) => s.user?.id ?? 'anon')
  const userName = useAuthStore((s) => s.user?.name ?? 'Unknown')

  // Canvas store — stable selectors
  const frames = useDesignCanvasStore((s) => s.frames)
  const layers = useDesignCanvasStore((s) => s.layers)
  const selectedIds = useDesignCanvasStore((s) => s.selectedIds)
  const tool = useDesignCanvasStore((s) => s.tool)
  const historyIndex = useDesignCanvasStore((s) => s.historyIndex)
  const historyLength = useDesignCanvasStore((s) => s.history.length)

  const {
    addFrame, updateFrame, deleteFrame,
    addLayer, updateLayer, deleteLayer,
    select, selectNone, setTool,
    undo, redo, setProductId,
    loadFromGraphNode,
  } = useDesignCanvasStore.getState()

  // Sync productId into store
  useEffect(() => {
    setProductId(productId)
  }, [productId, setProductId])

  // Graph store for component placement
  const addNode = useGraphStore((s) => s.addNode)

  // Local UI state
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(
    frames[0]?.id ?? null
  )
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [inspectMode, setInspectMode] = useState(false)
  const [rightTab, setRightTab] = useState<'properties' | 'inspect'>('properties')
  const [componentPaletteOpen, setComponentPaletteOpen] = useState(false)
  const [extractModalOpen, setExtractModalOpen] = useState(false)

  // Sync selected screen when frames change
  useEffect(() => {
    if (!selectedScreenId && frames.length > 0) {
      setSelectedScreenId(frames[0].id)
    }
  }, [frames, selectedScreenId])

  // Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z / Cmd+Y
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  // Build ScreenDef list from frames + layers
  const screens: ScreenDef[] = useMemo(() => {
    return frames.map((frame) => {
      const frameLayers = layers.filter((l) => l.frameId === frame.id && !l.parentId)
      return {
        ...frameToScreen(frame),
        elements: frameLayers.map(layerToElement),
      }
    })
  }, [frames, layers])

  const selectedScreen = screens.find((s) => s.id === selectedScreenId) ?? null
  const selectedElement = selectedScreen?.elements.find((e) => e.id === selectedElementId) ?? null

  // ── Screen (Frame) actions ──

  const handleSelectScreen = useCallback((id: string) => {
    setSelectedScreenId(id)
    setSelectedElementId(null)
    selectNone()
  }, [selectNone])

  const handleAddScreen = useCallback(() => {
    const frame = addFrame({
      kind: 'frame',
      name: `Screen ${frames.length + 1}`,
      parentId: null,
      frameId: '',
      x: frames.length * 440,
      y: 0,
      width: 390,
      height: 844,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fills: [{ type: 'solid', color: '#ffffff', opacity: 1 }],
      strokes: [],
      shadows: [],
      blendMode: 'normal',
      preset: 'mobile',
      background: '#ffffff',
      exportFormats: ['tsx', 'png'],
    })
    // Make frame self-referential for frameId
    updateFrame(frame.id, { frameId: frame.id } as any)
    setSelectedScreenId(frame.id)
    setSelectedElementId(null)

    // Emit event
    eventBus.emit({
      type: 'design.frame.created',
      productId,
      frameId: frame.id,
      frameLabel: frame.name,
      actor: makeActor(userId, userName),
    })
  }, [frames.length, addFrame, updateFrame, productId, userId, userName])

  // ── Element (Layer) actions ──

  const handleSelectElement = useCallback((id: string | null) => {
    setSelectedElementId(id)
    if (id) select([id])
    else selectNone()
  }, [select, selectNone])

  const handleAddElement = useCallback((type: string) => {
    if (!selectedScreenId) return
    const kindMap: Record<string, any> = {
      Rectangle: 'rectangle', Ellipse: 'ellipse', Text: 'text',
      Image: 'image', Divider: 'line', Button: 'rectangle',
      ComponentInstance: 'component',
    }
    const kind = kindMap[type] ?? 'rectangle'
    const color = type === 'Button' ? '#6398ff' : type === 'Text' ? 'transparent' : '#ffffff'

    const layer = addLayer({
      kind,
      name: type,
      parentId: null,
      frameId: selectedScreenId,
      x: 40,
      y: 40,
      width: type === 'Divider' ? 200 : 200,
      height: type === 'Divider' ? 2 : type === 'Text' ? 24 : 80,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fills: [{ type: 'solid', color, opacity: type === 'Text' ? 0 : 0.15 }],
      strokes: [],
      shadows: [],
      blendMode: 'normal',
      borderRadius: kind === 'rectangle' ? 4 : 0,
      ...(kind === 'text' ? { text: { fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: 0, textAlign: 'left', color: '#ffffff', content: type } } : {}),
    })
    setSelectedElementId(layer.id)
  }, [selectedScreenId, addLayer])

  const handleUpdateElement = useCallback((id: string, updates: Partial<ElementDef>) => {
    // Map ElementDef updates back to layer updates
    const layerUpdates: any = {}
    if (updates.x !== undefined) layerUpdates.x = updates.x
    if (updates.y !== undefined) layerUpdates.y = updates.y
    if (updates.width !== undefined) layerUpdates.width = updates.width
    if (updates.height !== undefined) layerUpdates.height = updates.height
    if (updates.content !== undefined && updates.content !== undefined) {
      layerUpdates.name = updates.content
    }
    if (updates.style?.background) {
      layerUpdates.fills = [{ type: 'solid', color: updates.style.background, opacity: 1 }]
    }
    updateLayer(id, layerUpdates)
  }, [updateLayer])

  const handleSetInspectMode = useCallback((val: boolean) => {
    setInspectMode(val)
    setRightTab(val ? 'inspect' : 'properties')
  }, [])

  // ── Component palette: place component on canvas ──
  const handlePlaceComponent = useCallback((componentId: string, componentName: string) => {
    if (!selectedScreenId) return
    const layer = addLayer({
      kind: 'component',
      name: componentName,
      parentId: null,
      frameId: selectedScreenId,
      x: 40,
      y: 40,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fills: [{ type: 'solid', color: '#06b6d4', opacity: 0.08 }],
      strokes: [{ color: 'rgba(6,182,212,0.4)', width: 1, align: 'center', dashArray: [4, 2] }],
      shadows: [],
      blendMode: 'normal',
      borderRadius: 8,
      componentId,
    })
    setSelectedElementId(layer.id)
  }, [selectedScreenId, addLayer])

  // ── Extract selection to component ──
  const handleExtractComponent = useCallback((name: string, category: string) => {
    if (!selectedElement || !selectedScreenId) return

    const graphNode = addNode({
      kind: 'component',
      label: name,
      productId,
      data: {
        category,
        description: `Extracted from design — ${selectedScreen?.name ?? 'unknown screen'}`,
        props: '[]',
        variants: '[]',
        tokenBindings: '[]',
      },
    })

    // Replace with component instance
    handleUpdateElement(selectedElement.id, {
      type: 'ComponentInstance',
      content: name,
      style: { background: 'rgba(6,182,212,0.08)', border: '1px dashed rgba(6,182,212,0.4)', borderRadius: '8px' },
    })

    // Wire event bus
    eventBus.emit({
      type: 'component.created',
      productId,
      componentId: graphNode.id,
      componentLabel: name,
      actor: makeActor(userId, userName),
    })
  }, [selectedElement, selectedScreenId, selectedScreen, addNode, productId, handleUpdateElement, userId, userName])

  // ── Export via output-pipeline ──
  const handleExport = useCallback(async (format: ExportFormat = 'tsx') => {
    if (!selectedScreenId) return
    const frame = frames.find((f) => f.id === selectedScreenId)
    const screen = screens.find((s) => s.id === selectedScreenId)
    if (!frame) return

    eventBus.emit({
      type: 'design.frame.exported',
      productId,
      frameId: frame.id,
      frameLabel: frame.name,
      exportFormat: format as 'tsx' | 'png' | 'svg' | 'pdf' | 'figma-json' | undefined,
      actor: makeActor(userId, userName),
    })

    const frameLayers = layers.filter((l) => l.frameId === frame.id)

    await outputPipeline.download(format, {
      label: frame.name,
      width: frame.width,
      height: frame.height,
      layers: frameLayers.map((l) => ({
        id: l.id,
        kind: l.kind,
        name: l.name,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height,
        fills: l.fills,
        strokes: l.strokes,
        borderRadius: typeof l.borderRadius === 'number' ? l.borderRadius : undefined,
        text: l.text ? { content: l.text.content, fontSize: l.text.fontSize, fontWeight: l.text.fontWeight, color: l.text.color } : undefined,
        componentId: l.componentId,
        childIds: l.childIds,
        parentId: l.parentId,
      })),
      productId,
    })
  }, [selectedScreenId, frames, screens, layers, productId, userId, userName])

  // ── Render ──
  const org = params.orgSlug ?? ''
  const slug = params.productSlug ?? ''

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* ── Context banner ── */}
      <ContextBanner
        chips={[
          { label: 'Brand Tokens', source: 'brand' },
          { label: 'Brand Voice', source: 'brand-voice' },
          { label: 'Components', source: 'components' },
        ]}
        missing={[]}
      />
      {/* ── Top Toolbar ── */}
      <div className="shrink-0 h-[var(--toolbar-h)] flex items-center justify-between px-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Left */}
        <div className="flex items-center gap-2">
          <PenTool className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)] leading-none">Design Studio</span>
          <StudioHealthBadge productId={productId} studio="design" />
        </div>

        {/* Center: tool palette */}
        <div className="flex items-center gap-0.5">
          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="tool-btn disabled:opacity-30"
            title="Undo (⌘Z)"
            aria-label="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={historyIndex >= historyLength - 1}
            className="tool-btn disabled:opacity-30"
            title="Redo (⌘⇧Z)"
            aria-label="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-default)] mx-1" />

          {/* Drawing tools */}
          {([
            { t: 'select', icon: <MousePointer2 className="w-3.5 h-3.5" />, label: 'Select' },
            { t: 'hand',   icon: <Hand className="w-3.5 h-3.5" />,          label: 'Pan' },
            { t: 'frame',  icon: <Frame className="w-3.5 h-3.5" />,         label: 'Frame' },
          ] as const).map(({ t, icon, label }) => (
            <button
              key={t}
              className={`tool-btn ${tool === t ? 'text-[var(--accent-text)] bg-[var(--accent)]/[0.12]' : ''}`}
              title={label}
              aria-label={label}
              aria-pressed={tool === t}
              onClick={() => setTool(t as any)}
            >
              {icon}
            </button>
          ))}
          <div className="w-px h-4 bg-[var(--border-default)] mx-1" />

          {/* Insert shapes */}
          <button className="tool-btn" title="Rectangle" onClick={() => handleAddElement('Rectangle')}><Square className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" title="Text" onClick={() => handleAddElement('Text')}><Type className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" title="Image" onClick={() => handleAddElement('Image')}><Image className="w-3.5 h-3.5" /></button>
          <button className="tool-btn" title="Divider" onClick={() => handleAddElement('Divider')}><Minus className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-[var(--border-default)] mx-1" />

          <button
            onClick={() => setComponentPaletteOpen((v) => !v)}
            className={`tool-btn ${componentPaletteOpen ? 'text-[var(--accent-text)] bg-[var(--accent)]/[0.08]' : ''}`}
            title="Component palette"
            aria-pressed={componentPaletteOpen}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="text-[11px]">Components</span>
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          {selectedElement && selectedElement.type !== 'ComponentInstance' && (
            <button onClick={() => setExtractModalOpen(true)} className="tool-btn text-[var(--accent-text)]" title="Extract to component">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="text-[11px]">Extract</span>
            </button>
          )}
          <button
            onClick={() => handleSetInspectMode(!inspectMode)}
            className={`tool-btn ${inspectMode ? 'text-[var(--accent-text)] bg-[var(--accent)]/[0.08]' : ''}`}
            title="Inspect mode"
            aria-pressed={inspectMode}
          >
            <ScanSearch className="w-3.5 h-3.5" />
            <span className="text-[11px]">Inspect</span>
          </button>
          <button onClick={handleAddScreen} className="tool-btn" title="New screen">
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Screen</span>
          </button>
          <ExportMenu
            formats={['tsx', 'png', 'svg', 'figma-json']}
            onExport={handleExport}
            disabled={!selectedScreenId}
          />
          <AIActionBar
            workspace="design"
            productId={productId}
            context={{ currentScreen: selectedScreen?.name }}
            onComplete={(skillId, summary) => {
              // If UI Generator ran, refresh by re-reading frames from store
            }}
          />
        </div>
      </div>

      {/* ── Analytics bar ── */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <AnalyticsOverlay productId={productId} context="design" />
      </div>

      {/* ── Three-panel body ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel — Screens / Layers */}
        <div className="tool-panel-left border-r border-[var(--border-default)] bg-[var(--bg-surface)] overflow-y-auto" style={{ width: 180, minWidth: 180 }}>
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[var(--text-tertiary)]" />
              <span className="tool-section-label">Screens</span>
            </div>
            <span className="text-[11px] text-[var(--text-tertiary)]">{frames.length}</span>
          </div>
          <ScreenList
            screens={screens}
            selectedScreenId={selectedScreenId}
            onSelectScreen={handleSelectScreen}
            onAddScreen={handleAddScreen}
            productId={productId}
          />
        </div>

        {/* Center — Canvas */}
        <div className="flex-1 min-w-0 bg-[var(--bg-workspace)] relative">
          <ComponentPalette
            productId={productId}
            open={componentPaletteOpen}
            onClose={() => setComponentPaletteOpen(false)}
            onPlaceComponent={handlePlaceComponent}
          />
          <DesignCanvas
            screen={selectedScreen}
            selectedElementId={selectedElementId}
            onSelectElement={handleSelectElement}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
          />
        </div>

        {/* Right Panel — Properties / Inspect */}
        <div className="tool-panel-right border-l border-[var(--border-default)] bg-[var(--bg-surface)] overflow-y-auto" style={{ width: 220, minWidth: 220 }}>
          <div className="tool-tabs border-b border-[var(--border-default)]">
            <button className={`tool-tab ${rightTab === 'properties' ? 'active' : ''}`} onClick={() => { setRightTab('properties'); setInspectMode(false) }}>
              Properties
            </button>
            <button className={`tool-tab ${rightTab === 'inspect' ? 'active' : ''}`} onClick={() => { setRightTab('inspect'); setInspectMode(true) }}>
              Inspect
            </button>
          </div>
          {rightTab === 'inspect'
            ? <InspectPanel element={selectedElement} />
            : <PropertiesPanel element={selectedElement} onUpdate={handleUpdateElement} />
          }
        </div>
      </div>

      {/* ── Extract Component Modal ── */}
      <ExtractComponentModal
        open={extractModalOpen}
        onClose={() => setExtractModalOpen(false)}
        selectedElements={selectedElement ? [selectedElement] : []}
        onExtract={handleExtractComponent}
      />

      <style jsx global>{`
        .tool-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 6px; height: 24px;
          border-radius: var(--radius-sm);
          font-size: 11px; color: var(--text-secondary);
          background: transparent; border: none; cursor: pointer;
          white-space: nowrap; transition: background 0.1s, color 0.1s;
        }
        .tool-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); color: var(--text-primary); }
        .tool-btn:disabled { cursor: not-allowed; }
        .tool-tabs { display: flex; height: 28px; background: var(--bg-surface); }
        .tool-tab {
          flex: 1; display: flex; align-items: center; justify-content: center;
          font-size: 11px; color: var(--text-tertiary); background: transparent;
          border: none; cursor: pointer; border-bottom: 1px solid transparent; transition: color 0.1s;
        }
        .tool-tab:hover { color: var(--text-secondary); }
        .tool-tab.active { color: var(--text-primary); border-bottom-color: var(--accent); }
        .tool-input {
          width: 100%; padding: 3px 6px; font-size: 12px;
          color: var(--text-primary); background: var(--bg-elevated);
          border: 1px solid var(--border-default); border-radius: var(--radius-sm); outline: none;
        }
        .tool-input:focus { border-color: var(--accent); }
        .tool-section-label {
          font-size: 11px; font-weight: 500; color: var(--text-tertiary);
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .tool-panel-left, .tool-panel-right {
          scrollbar-width: thin; scrollbar-color: var(--border-default) transparent;
        }
        .tool-panel-left::-webkit-scrollbar, .tool-panel-right::-webkit-scrollbar { width: 4px; }
        .tool-panel-left::-webkit-scrollbar-thumb, .tool-panel-right::-webkit-scrollbar-thumb {
          background: var(--border-default); border-radius: 2px;
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Minimal TSX generator (output-pipeline will replace with a full version)
// ---------------------------------------------------------------------------

function generateFrameTSX(name: string, screen: ScreenDef | null): string {
  const componentName = name.replace(/[^a-zA-Z0-9]/g, '') || 'Screen'
  const elements = screen?.elements ?? []

  const elements_tsx = elements.map((el) => {
    const style = Object.entries(el.style ?? {})
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: '${v}'`)
      .join(', ')
    return `    <div style={{ position: 'absolute', left: ${el.x}, top: ${el.y}, width: ${el.width}, height: ${el.height}${style ? ', ' + style : ''} }}>${el.content ?? el.type}</div>`
  }).join('\n')

  return `// Generated by Product OS Design Studio
// Screen: ${name} (${screen?.width ?? 390}×${screen?.height ?? 844})

import React from 'react'

export default function ${componentName}() {
  return (
    <div
      style={{
        position: 'relative',
        width: ${screen?.width ?? 390},
        height: ${screen?.height ?? 844},
        overflow: 'hidden',
        background: '#ffffff',
      }}
    >
${elements_tsx}
    </div>
  )
}
`
}
