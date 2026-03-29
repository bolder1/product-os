'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import {
  type GraphNode,
  type GraphEdge,
  type NodeKind,
  type EdgeKind,
  NODE_KIND_COLORS,
} from '../_data/mock-graph'

interface GraphCanvasProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  activeNodeKinds: Set<NodeKind>
  activeEdgeKinds: Set<EdgeKind>
  searchQuery: string
  showLabels: boolean
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  nodePositions: Record<string, { x: number; y: number }>
  onUpdateNodePosition: (id: string, x: number, y: number) => void
}

const NODE_RADIUS = 22
const ICON_MAP: Record<NodeKind, string> = {
  module: 'M',
  feature: 'F',
  page: 'P',
  entity: 'E',
  component: 'C',
  workflow: 'W',
  token: 'T',
  journey: 'J',
}

export function GraphCanvas({
  nodes,
  edges,
  activeNodeKinds,
  activeEdgeKinds,
  searchQuery,
  showLabels,
  selectedNodeId,
  onSelectNode,
  nodePositions,
  onUpdateNodePosition,
}: GraphCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1100, h: 800 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [dragNodeId, setDragNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const zoom = useCallback(
    (factor: number) => {
      setViewBox((prev) => {
        const newW = prev.w * factor
        const newH = prev.h * factor
        const dx = (prev.w - newW) / 2
        const dy = (prev.h - newH) / 2
        return { x: prev.x + dx, y: prev.y + dy, w: newW, h: newH }
      })
    },
    []
  )

  const resetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: 1100, h: 800 })
  }, [])

  // Scroll to zoom
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1.08 : 0.92
      zoom(factor)
    }
    svg.addEventListener('wheel', handler, { passive: false })
    return () => svg.removeEventListener('wheel', handler)
  }, [zoom])

  // SVG coordinate helper
  const svgPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      const scaleX = viewBox.w / rect.width
      const scaleY = viewBox.h / rect.height
      return {
        x: viewBox.x + (clientX - rect.left) * scaleX,
        y: viewBox.y + (clientY - rect.top) * scaleY,
      }
    },
    [viewBox]
  )

  // Pan handlers
  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      if (dragNodeId) return
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY })
    },
    [dragNodeId]
  )

  const handlePanMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragNodeId) {
        // Node drag
        const pt = svgPoint(e.clientX, e.clientY)
        onUpdateNodePosition(dragNodeId, pt.x - dragOffset.x, pt.y - dragOffset.y)
        return
      }
      if (!isPanning) return
      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const scaleX = viewBox.w / rect.width
      const scaleY = viewBox.h / rect.height
      const dx = (e.clientX - panStart.x) * scaleX
      const dy = (e.clientY - panStart.y) * scaleY
      setViewBox((prev) => ({ ...prev, x: prev.x - dx, y: prev.y - dy }))
      setPanStart({ x: e.clientX, y: e.clientY })
    },
    [isPanning, panStart, viewBox, dragNodeId, dragOffset, svgPoint, onUpdateNodePosition]
  )

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
    setDragNodeId(null)
  }, [])

  // Node drag start
  const handleNodeDragStart = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation()
      const pt = svgPoint(e.clientX, e.clientY)
      const pos = nodePositions[nodeId]
      if (pos) {
        setDragOffset({ x: pt.x - pos.x, y: pt.y - pos.y })
      }
      setDragNodeId(nodeId)
    },
    [svgPoint, nodePositions]
  )

  // Filter visibility
  const visibleNodes = nodes.filter((n) => {
    if (!activeNodeKinds.has(n.kind)) return false
    if (searchQuery) {
      return n.label.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))

  const visibleEdges = edges.filter(
    (e) =>
      activeEdgeKinds.has(e.kind) &&
      visibleNodeIds.has(e.source) &&
      visibleNodeIds.has(e.target)
  )

  return (
    <div className="relative flex-1 rounded-xl border border-white/[0.08] bg-[#050810] overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button
          onClick={() => zoom(0.8)}
          className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:bg-white/[0.1] transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => zoom(1.2)}
          className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:bg-white/[0.1] transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#94A3B8] hover:bg-white/[0.1] transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
        onClick={() => onSelectNode(null)}
      >
        <defs>
          {/* Glow filter for selected node */}
          <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Hover glow */}
          <filter id="node-hover-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="0.5" fill="rgba(255,255,255,0.04)" />
          </pattern>
        </defs>
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#grid)" />

        {/* Edges */}
        {visibleEdges.map((edge) => {
          const sourcePos = nodePositions[edge.source]
          const targetPos = nodePositions[edge.target]
          if (!sourcePos || !targetPos) return null

          const isSelected = selectedNodeId === edge.source || selectedNodeId === edge.target

          return (
            <line
              key={edge.id}
              x1={sourcePos.x}
              y1={sourcePos.y}
              x2={targetPos.x}
              y2={targetPos.y}
              stroke={isSelected ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={edge.kind === 'depends_on' ? '6 3' : undefined}
              className="transition-all duration-200"
            />
          )
        })}

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const pos = nodePositions[node.id] || { x: node.x, y: node.y }
          const color = NODE_KIND_COLORS[node.kind]
          const isSelected = selectedNodeId === node.id
          const isDimmed =
            selectedNodeId !== null &&
            !isSelected &&
            !visibleEdges.some(
              (e) =>
                (e.source === selectedNodeId && e.target === node.id) ||
                (e.target === selectedNodeId && e.source === node.id)
            )

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              style={{ opacity: isDimmed ? 0.25 : 1, transition: 'opacity 0.2s' }}
              onMouseDown={(e) => handleNodeDragStart(e, node.id)}
              onClick={(e) => {
                e.stopPropagation()
                onSelectNode(node.id === selectedNodeId ? null : node.id)
              }}
            >
              {/* Selection glow */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS + 8}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity="0.4"
                  filter="url(#node-glow)"
                />
              )}

              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill={`${color}20`}
                stroke={color}
                strokeWidth={isSelected ? 2.5 : 1.5}
                className="transition-all"
              />

              {/* Node icon letter */}
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize="13"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {ICON_MAP[node.kind]}
              </text>

              {/* Label */}
              {showLabels && (
                <text
                  x={pos.x}
                  y={pos.y + NODE_RADIUS + 14}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
