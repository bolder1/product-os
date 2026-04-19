'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Tablet, Smartphone, Plus } from 'lucide-react'
import type { ScreenDef } from '../_data/mock-screens'
import { FrameThumbnail } from '../../../../../lib/frame-renderer'
import { useDesignCanvasStore } from '../../../../../lib/design-canvas-store'

interface ScreenListProps {
  screens: ScreenDef[]
  selectedScreenId: string | null
  onSelectScreen: (id: string) => void
  onAddScreen: () => void
  productId?: string
}

const categoryConfig = {
  mobile: { label: 'Mobile', icon: Smartphone },
  tablet: { label: 'Tablet', icon: Tablet },
  desktop: { label: 'Desktop', icon: Monitor },
} as const

const categoryOrder: Array<'mobile' | 'tablet' | 'desktop'> = ['mobile', 'tablet', 'desktop']

// Color based on element type for thumbnail
function elementColor(type: string): string {
  switch (type) {
    case 'Button':
      return 'rgba(139,92,246,0.35)'
    case 'Image':
    case 'Avatar':
      return 'rgba(139,92,246,0.18)'
    case 'Card':
    case 'Grid':
      return 'rgba(255,255,255,0.06)'
    default:
      return 'rgba(255,255,255,0.04)'
  }
}

export default function ScreenList({ screens, selectedScreenId, onSelectScreen, onAddScreen, productId = '' }: ScreenListProps) {
  // Check which screen ids have real canvas frames (for live thumbnail rendering)
  const rawFrames = useDesignCanvasStore((s) => s.frames)
  const frameIds = useMemo(() => new Set(rawFrames.map((f) => f.id)), [rawFrames])
  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    screens: screens.filter((s) => s.category === cat),
  }))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-3 py-3 border-b border-white/[0.08]">
        <p className="text-[10px] uppercase tracking-widest text-[#64748B] font-semibold">Screens</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {grouped.map(({ category, screens: catScreens }) => {
          if (catScreens.length === 0) return null
          const cfg = categoryConfig[category]
          const Icon = cfg.icon
          return (
            <div key={category}>
              <div className="flex items-center gap-1.5 px-1 mb-2">
                <Icon className="w-3 h-3 text-[#64748B]" />
                <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium">
                  {cfg.label}
                </span>
              </div>

              <div className="space-y-1.5">
                {catScreens.map((screen) => {
                  const isSelected = selectedScreenId === screen.id
                  // Scale for thumbnail
                  const thumbW = 140
                  const scale = thumbW / screen.width
                  const thumbH = screen.height * scale

                  return (
                    <motion.button
                      key={screen.id}
                      onClick={() => onSelectScreen(screen.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left rounded-lg p-2 transition-colors ${
                        isSelected
                          ? 'bg-white/[0.06] border-l-2 border-violet-500'
                          : 'bg-transparent hover:bg-white/[0.03] border-l-2 border-transparent'
                      }`}
                    >
                      {/* Mini Thumbnail — live render if canvas frame exists, else placeholder */}
                      <div
                        className="relative rounded-md overflow-hidden border border-white/[0.06] mb-2 mx-auto bg-[#080c20]"
                        style={{ width: thumbW, height: Math.min(thumbH, 90) }}
                      >
                        {frameIds.has(screen.id) && productId ? (
                          <FrameThumbnail
                            frameId={screen.id}
                            productId={productId}
                            maxWidth={thumbW}
                            maxHeight={90}
                          />
                        ) : (
                          screen.elements.map((el) => (
                            <div
                              key={el.id}
                              className="absolute"
                              style={{
                                left: el.x * scale,
                                top: el.y * scale,
                                width: el.width * scale,
                                height: el.height * scale,
                                background: elementColor(el.type),
                                borderRadius: 2,
                              }}
                            />
                          ))
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium truncate ${isSelected ? 'text-[#F1F5F9]' : 'text-[#94A3B8]'}`}>
                          {screen.name}
                        </span>
                        <span className="text-[9px] text-[#64748B] bg-white/[0.04] px-1.5 py-0.5 rounded-md font-mono">
                          {screen.width}x{screen.height}
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Add Screen card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAddScreen}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border border-dashed border-white/[0.12] hover:border-violet-500/40 hover:bg-white/[0.02] transition-colors"
        >
          <Plus className="w-5 h-5 text-[#64748B]" />
          <span className="text-xs text-[#64748B]">Add Screen</span>
        </motion.button>
      </div>
    </div>
  )
}
