'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Plus, ScanSearch, PenTool } from 'lucide-react'
import { mockScreens, type ScreenDef, type ElementDef } from './_data/mock-screens'
import ScreenList from './_components/screen-list'
import DesignCanvas from './_components/design-canvas'
import PropertiesPanel from './_components/properties-panel'
import InspectPanel from './_components/inspect-panel'

let nextScreenId = 100
let nextElementId = 1000

export default function DesignStudioPage() {
  const [screens, setScreens] = useState<ScreenDef[]>(mockScreens)
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(mockScreens[0]?.id ?? null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [inspectMode, setInspectMode] = useState(false)

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
              ? 'rgba(139,92,246,0.25)'
              : type === 'Image' || type === 'Avatar'
                ? 'rgba(139,92,246,0.15)'
                : 'rgba(255,255,255,0.03)',
          borderRadius: type === 'Avatar' ? '50%' : '8px',
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

  // ── Render ──

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <PenTool className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#F1F5F9]">Design Studio</h1>
            <p className="text-xs text-[#64748B]">Design screens and interfaces</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Inspect Mode toggle */}
          <button
            onClick={() => setInspectMode(!inspectMode)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              inspectMode
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                : 'bg-white/[0.03] border-white/[0.08] text-[#94A3B8] hover:bg-white/[0.06]'
            }`}
          >
            <ScanSearch className="w-3.5 h-3.5" />
            Inspect
          </button>

          {/* New Screen */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAddScreen}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#F1F5F9] text-xs font-medium hover:bg-white/[0.06] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Screen
          </motion.button>

          {/* AI Generate */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generate
          </motion.button>
        </div>
      </div>

      {/* Body: three-panel layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Panel — Screen List (18%) */}
        <div className="w-[18%] min-w-[180px] max-w-[260px] border-r border-white/[0.08] bg-white/[0.01]">
          <ScreenList
            screens={screens}
            selectedScreenId={selectedScreenId}
            onSelectScreen={handleSelectScreen}
            onAddScreen={handleAddScreen}
          />
        </div>

        {/* Center Panel — Canvas (57%) */}
        <div className="flex-1 min-w-0 flex">
          <DesignCanvas
            screen={selectedScreen}
            selectedElementId={selectedElementId}
            onSelectElement={handleSelectElement}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
          />
        </div>

        {/* Right Panel — Properties / Inspect (25%) */}
        <div className="w-[25%] min-w-[240px] max-w-[340px] border-l border-white/[0.08] bg-white/[0.01]">
          <AnimatePresence mode="wait">
            <motion.div
              key={inspectMode ? 'inspect' : 'props'}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {inspectMode ? (
                <InspectPanel element={selectedElement} />
              ) : (
                <PropertiesPanel element={selectedElement} onUpdate={handleUpdateElement} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
