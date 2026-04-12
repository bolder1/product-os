'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import { Sparkles, Plus, ScanSearch, PenTool, Layers, ChevronDown, MousePointer2, Hand, Square, Type, Image, Minus } from 'lucide-react'
import { mockScreens, type ScreenDef, type ElementDef } from './_data/mock-screens'
import ScreenList from './_components/screen-list'
import DesignCanvas from './_components/design-canvas'
import PropertiesPanel from './_components/properties-panel'
import InspectPanel from './_components/inspect-panel'
import { StudioHealthBadge } from '../../../../components/shared/studio-health-badge'
import { AnalyticsOverlay } from '../../../../components/shared/analytics-overlay'

let nextScreenId = 100
let nextElementId = 1000

export default function DesignStudioPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const [screens, setScreens] = useState<ScreenDef[]>(mockScreens)
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(mockScreens[0]?.id ?? null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [inspectMode, setInspectMode] = useState(false)
  const [rightTab, setRightTab] = useState<'properties' | 'inspect'>('properties')

  const selectedScreen = screens.find((s) => s.id === selectedScreenId) ?? null
  const selectedElement =
    selectedScreen?.elements.find((e) => e.id === selectedElementId) ?? null

  // ── Screen actions ──

  const handleSelectScreen = useCallback((id: string) => {
    setSelectedScreenId(id)
    setSelectedElementId(null)
  }, [])

  const handleAddScreen = useCallback(() => {
    const id = `scr-new-${nextScreenId++}`
    const newScreen: ScreenDef = {
      id,
      name: 'New Screen',
      width: 390,
      height: 844,
      category: 'mobile',
      elements: [],
    }
    setScreens((prev) => [...prev, newScreen])
    setSelectedScreenId(id)
    setSelectedElementId(null)
  }, [])

  // ── Element actions ──

  const handleSelectElement = useCallback((id: string | null) => {
    setSelectedElementId(id)
  }, [])

  const handleAddElement = useCallback(
    (type: string) => {
      if (!selectedScreenId) return
      const id = `el-new-${nextElementId++}`
      const newEl: ElementDef = {
        id,
        type,
        x: 40,
        y: 40,
        width: 200,
        height: type === 'Divider' ? 2 : 80,
        style: {
          background:
            type === 'Button'
              ? 'rgba(76,141,255,0.18)'
              : type === 'Image' || type === 'Avatar'
                ? 'rgba(76,141,255,0.10)'
                : 'rgba(255,255,255,0.03)',
          borderRadius: type === 'Avatar' ? '50%' : '4px',
        },
        content: type,
      }
      setScreens((prev) =>
        prev.map((s) =>
          s.id === selectedScreenId ? { ...s, elements: [...s.elements, newEl] } : s
        )
      )
      setSelectedElementId(id)
    },
    [selectedScreenId]
  )

  const handleUpdateElement = useCallback(
    (id: string, updates: Partial<ElementDef>) => {
      if (!selectedScreenId) return
      setScreens((prev) =>
        prev.map((s) =>
          s.id === selectedScreenId
            ? {
                ...s,
                elements: s.elements.map((el) =>
                  el.id === id ? { ...el, ...updates, style: { ...el.style, ...(updates.style ?? {}) } } : el
                ),
              }
            : s
        )
      )
    },
    [selectedScreenId]
  )

  const handleSetInspectMode = useCallback((val: boolean) => {
    setInspectMode(val)
    if (val) setRightTab('inspect')
    else setRightTab('properties')
  }, [])

  // ── Render ──

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-workspace)]">
      {/* ── Top Toolbar ── */}
      <div className="shrink-0 h-[var(--toolbar-h)] flex items-center justify-between px-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Left: title + badge */}
        <div className="flex items-center gap-2">
          <PenTool className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)] leading-none">Design</span>
          <StudioHealthBadge productId={productId} studio="design" />
        </div>

        {/* Center: tool buttons */}
        <div className="flex items-center gap-0.5">
          <button className="tool-btn" title="Select">
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>
          <button className="tool-btn" title="Hand">
            <Hand className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[var(--border-default)] mx-1" />
          <button className="tool-btn" title="Rectangle" onClick={() => handleAddElement('Rectangle')}>
            <Square className="w-3.5 h-3.5" />
          </button>
          <button className="tool-btn" title="Text" onClick={() => handleAddElement('Text')}>
            <Type className="w-3.5 h-3.5" />
          </button>
          <button className="tool-btn" title="Image" onClick={() => handleAddElement('Image')}>
            <Image className="w-3.5 h-3.5" />
          </button>
          <button className="tool-btn" title="Divider" onClick={() => handleAddElement('Divider')}>
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSetInspectMode(!inspectMode)}
            className={`tool-btn ${inspectMode ? 'text-[var(--accent-text)] bg-[var(--accent)]/[0.08]' : ''}`}
            title="Inspect mode"
          >
            <ScanSearch className="w-3.5 h-3.5" />
            <span className="text-[11px]">Inspect</span>
          </button>
          <button onClick={handleAddScreen} className="tool-btn" title="New screen">
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">Screen</span>
          </button>
          <button className="tool-btn text-[var(--accent-text)]" title="AI Generate">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px]">AI</span>
          </button>
        </div>
      </div>

      {/* ── Analytics bar ── */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <AnalyticsOverlay productId={productId} context="design" />
      </div>

      {/* ── Three-panel body ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel — Screens */}
        <div
          className="tool-panel-left border-r border-[var(--border-default)] bg-[var(--bg-surface)] overflow-y-auto"
          style={{ width: 180, minWidth: 180 }}
        >
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[var(--text-tertiary)]" />
              <span className="tool-section-label">Screens</span>
            </div>
            <span className="text-[11px] text-[var(--text-tertiary)]">{screens.length}</span>
          </div>
          <ScreenList
            screens={screens}
            selectedScreenId={selectedScreenId}
            onSelectScreen={handleSelectScreen}
            onAddScreen={handleAddScreen}
          />
        </div>

        {/* Center — Canvas */}
        <div className="flex-1 min-w-0 bg-[var(--bg-workspace)]">
          <DesignCanvas
            screen={selectedScreen}
            selectedElementId={selectedElementId}
            onSelectElement={handleSelectElement}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
          />
        </div>

        {/* Right Panel — Properties / Inspect */}
        <div
          className="tool-panel-right border-l border-[var(--border-default)] bg-[var(--bg-surface)] overflow-y-auto"
          style={{ width: 220, minWidth: 220 }}
        >
          {/* Tab bar */}
          <div className="tool-tabs border-b border-[var(--border-default)]">
            <button
              className={`tool-tab ${rightTab === 'properties' ? 'active' : ''}`}
              onClick={() => { setRightTab('properties'); setInspectMode(false) }}
            >
              Properties
            </button>
            <button
              className={`tool-tab ${rightTab === 'inspect' ? 'active' : ''}`}
              onClick={() => { setRightTab('inspect'); setInspectMode(true) }}
            >
              Inspect
            </button>
          </div>

          {rightTab === 'inspect' ? (
            <InspectPanel element={selectedElement} />
          ) : (
            <PropertiesPanel element={selectedElement} onUpdate={handleUpdateElement} />
          )}
        </div>
      </div>

      {/* ── Utility styles ── */}
      <style jsx global>{`
        .tool-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 6px;
          height: 24px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.1s, color 0.1s;
        }
        .tool-btn:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-primary);
        }
        .tool-tabs {
          display: flex;
          height: 28px;
          background: var(--bg-surface);
        }
        .tool-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: var(--text-tertiary);
          background: transparent;
          border: none;
          cursor: pointer;
          border-bottom: 1px solid transparent;
          transition: color 0.1s;
        }
        .tool-tab:hover {
          color: var(--text-secondary);
        }
        .tool-tab.active {
          color: var(--text-primary);
          border-bottom-color: var(--accent);
        }
        .tool-input {
          width: 100%;
          padding: 3px 6px;
          font-size: 12px;
          color: var(--text-primary);
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          outline: none;
        }
        .tool-input:focus {
          border-color: var(--accent);
        }
        .tool-section-label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .tool-surface {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
        }
        .tool-panel-left,
        .tool-panel-right {
          scrollbar-width: thin;
          scrollbar-color: var(--border-default) transparent;
        }
        .tool-panel-left::-webkit-scrollbar,
        .tool-panel-right::-webkit-scrollbar {
          width: 4px;
        }
        .tool-panel-left::-webkit-scrollbar-thumb,
        .tool-panel-right::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
