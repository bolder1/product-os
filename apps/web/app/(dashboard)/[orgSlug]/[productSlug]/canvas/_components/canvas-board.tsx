'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import type { CanvasItem } from '../_data/mock-canvas'
import type { ToolType } from './canvas-toolbar'

interface CanvasBoardProps {
  items: CanvasItem[]
  selectedId: string | null
  onSelectItem: (id: string | null) => void
  onMoveItem: (id: string, x: number, y: number) => void
  onAddItem: (item: CanvasItem) => void
  activeTool: ToolType
  zoom: number
  onZoomChange: (zoom: number) => void
  pan: { x: number; y: number }
  onPanChange: (pan: { x: number; y: number }) => void
}

const DOT_SPACING = 24

export function CanvasBoard({
  items,
  selectedId,
  onSelectItem,
  onMoveItem,
  onAddItem,
  activeTool,
  zoom,
  onZoomChange,
  pan,
  onPanChange,
}: CanvasBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<{
    id: string
    offsetX: number
    offsetY: number
  } | null>(null)
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null)

  const svgPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      }
    },
    [zoom, pan]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return
      const target = e.target as SVGElement
      const itemEl = target.closest('[data-item-id]') as SVGElement | null

      if (itemEl) {
        const id = itemEl.getAttribute('data-item-id')!
        const item = items.find((i) => i.id === id)
        if (!item) return
        const pt = svgPoint(e.clientX, e.clientY)
        setDragging({ id, offsetX: pt.x - item.x, offsetY: pt.y - item.y })
        onSelectItem(id)
      } else if (activeTool === 'select' || activeTool === 'connector') {
        // Pan
        setPanning({ startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y })
        onSelectItem(null)
      } else {
        // Add new item
        const pt = svgPoint(e.clientX, e.clientY)
        const newItem = createItem(activeTool, pt.x, pt.y)
        if (newItem) {
          onAddItem(newItem)
          onSelectItem(newItem.id)
        }
      }
    },
    [items, activeTool, svgPoint, onSelectItem, onAddItem, pan]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (dragging) {
        const pt = svgPoint(e.clientX, e.clientY)
        onMoveItem(dragging.id, pt.x - dragging.offsetX, pt.y - dragging.offsetY)
      } else if (panning) {
        const dx = e.clientX - panning.startX
        const dy = e.clientY - panning.startY
        onPanChange({ x: panning.panX + dx, y: panning.panY + dy })
      }
    },
    [dragging, panning, svgPoint, onMoveItem, onPanChange]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
    setPanning(null)
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZoom = Math.min(3, Math.max(0.2, zoom + delta))
      onZoomChange(newZoom)
    },
    [zoom, onZoomChange]
  )

  // Prevent default wheel on the container to avoid page scroll
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const handler = (e: WheelEvent) => e.preventDefault()
    svg.addEventListener('wheel', handler, { passive: false })
    return () => svg.removeEventListener('wheel', handler)
  }, [])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background */}
      <defs>
        <pattern
          id="dot-grid"
          x={pan.x % (DOT_SPACING * zoom)}
          y={pan.y % (DOT_SPACING * zoom)}
          width={DOT_SPACING * zoom}
          height={DOT_SPACING * zoom}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={DOT_SPACING * zoom * 0.5}
            cy={DOT_SPACING * zoom * 0.5}
            r={1}
            fill="rgba(255,255,255,0.06)"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#060918" />
      <rect width="100%" height="100%" fill="url(#dot-grid)" />

      {/* Transformed group */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {items.map((item) => (
          <CanvasItemRenderer
            key={item.id}
            item={item}
            isSelected={item.id === selectedId}
          />
        ))}
      </g>
    </svg>
  )
}

function CanvasItemRenderer({ item, isSelected }: { item: CanvasItem; isSelected: boolean }) {
  const strokeProps = isSelected
    ? { stroke: '#3B82F6', strokeWidth: 2, strokeDasharray: '4 2' }
    : {}

  if (item.type === 'sticky') {
    return (
      <g data-item-id={item.id} style={{ cursor: 'grab' }}>
        <rect
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          rx={8}
          fill={item.color + '20'}
          {...strokeProps}
        />
        <rect
          x={item.x}
          y={item.y}
          width={item.width}
          height={4}
          rx={2}
          fill={item.color}
        />
        <foreignObject
          x={item.x + 12}
          y={item.y + 16}
          width={item.width - 24}
          height={item.height - 28}
        >
          <div
            style={{
              color: '#F1F5F9',
              fontSize: 13,
              fontWeight: 500,
              lineHeight: '1.4',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {item.text}
          </div>
        </foreignObject>
      </g>
    )
  }

  if (item.type === 'text') {
    return (
      <g data-item-id={item.id} style={{ cursor: 'grab' }}>
        {isSelected && (
          <rect
            x={item.x - 4}
            y={item.y - 4}
            width={item.width + 8}
            height={item.height + 8}
            rx={4}
            fill="transparent"
            {...strokeProps}
          />
        )}
        <foreignObject x={item.x} y={item.y} width={item.width} height={item.height}>
          <div
            style={{
              color: item.color,
              fontSize: 14,
              lineHeight: '1.5',
              wordBreak: 'break-word',
            }}
          >
            {item.text}
          </div>
        </foreignObject>
      </g>
    )
  }

  if (item.type === 'shape') {
    if (item.shapeKind === 'circle') {
      const cx = item.x + item.width / 2
      const cy = item.y + item.height / 2
      const rx = item.width / 2
      const ry = item.height / 2
      return (
        <g data-item-id={item.id} style={{ cursor: 'grab' }}>
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={item.color + '15'}
            stroke={isSelected ? '#3B82F6' : item.color + '40'}
            strokeWidth={isSelected ? 2 : 1.5}
            strokeDasharray={isSelected ? '4 2' : undefined}
          />
          <foreignObject
            x={item.x + 16}
            y={item.y + item.height / 2 - 10}
            width={item.width - 32}
            height={20}
          >
            <div
              style={{
                color: '#F1F5F9',
                fontSize: 12,
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              {item.text}
            </div>
          </foreignObject>
        </g>
      )
    }

    if (item.shapeKind === 'diamond') {
      const cx = item.x + item.width / 2
      const cy = item.y + item.height / 2
      const hw = item.width / 2
      const hh = item.height / 2
      const points = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`
      return (
        <g data-item-id={item.id} style={{ cursor: 'grab' }}>
          <polygon
            points={points}
            fill={item.color + '15'}
            stroke={isSelected ? '#3B82F6' : item.color + '40'}
            strokeWidth={isSelected ? 2 : 1.5}
            strokeDasharray={isSelected ? '4 2' : undefined}
          />
          <foreignObject
            x={item.x + item.width * 0.2}
            y={cy - 10}
            width={item.width * 0.6}
            height={20}
          >
            <div
              style={{
                color: '#F1F5F9',
                fontSize: 11,
                textAlign: 'center',
                fontWeight: 500,
              }}
            >
              {item.text}
            </div>
          </foreignObject>
        </g>
      )
    }

    // Rectangle (default shape)
    return (
      <g data-item-id={item.id} style={{ cursor: 'grab' }}>
        <rect
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          rx={6}
          fill={item.color + '15'}
          stroke={isSelected ? '#3B82F6' : item.color + '40'}
          strokeWidth={isSelected ? 2 : 1.5}
          strokeDasharray={isSelected ? '4 2' : undefined}
        />
        <foreignObject
          x={item.x + 12}
          y={item.y + item.height / 2 - 10}
          width={item.width - 24}
          height={20}
        >
          <div
            style={{
              color: '#F1F5F9',
              fontSize: 12,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {item.text}
          </div>
        </foreignObject>
      </g>
    )
  }

  return null
}

let itemCounter = 100

function createItem(tool: ToolType, x: number, y: number): CanvasItem | null {
  itemCounter++
  const id = `item-new-${itemCounter}`

  switch (tool) {
    case 'sticky':
      return { id, type: 'sticky', x, y, width: 180, height: 140, text: 'New Note', color: '#F59E0B' }
    case 'text':
      return { id, type: 'text', x, y, width: 200, height: 40, text: 'New text block', color: '#F1F5F9' }
    case 'rectangle':
      return { id, type: 'shape', shapeKind: 'rectangle', x, y, width: 160, height: 100, text: 'Label', color: '#10B981' }
    case 'circle':
      return { id, type: 'shape', shapeKind: 'circle', x, y, width: 120, height: 120, text: 'Label', color: '#3B82F6' }
    case 'diamond':
      return { id, type: 'shape', shapeKind: 'diamond', x, y, width: 120, height: 120, text: 'Decision', color: '#8B5CF6' }
    default:
      return null
  }
}
