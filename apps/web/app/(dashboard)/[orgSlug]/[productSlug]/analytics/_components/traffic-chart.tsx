'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { DailyTraffic } from '../_data/mock-analytics'

interface TrafficChartProps {
  data: DailyTraffic[]
}

function buildPath(
  data: number[],
  width: number,
  height: number,
  padding: { top: number; right: number; bottom: number; left: number }
) {
  const max = Math.max(...data) * 1.1
  const min = 0
  const range = max - min || 1
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW
    const y = padding.top + chartH - ((v - min) / range) * chartH
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
  const lastPt = points[points.length - 1]!
  const firstPt = points[0]!
  const areaPath = `${linePath} L ${lastPt.x},${padding.top + chartH} L ${firstPt.x},${padding.top + chartH} Z`

  return { linePath, areaPath, points, max, chartW, chartH }
}

export function TrafficChart({ data }: TrafficChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const width = 700
  const height = 320
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }

  const pageViews = data.map((d) => d.pageViews)
  const visitors = data.map((d) => d.uniqueVisitors)

  const pvBuild = buildPath(pageViews, width, height, padding)
  const uvBuild = buildPath(visitors, width, height, padding)

  // Y-axis ticks
  const yTicks = [0, 2000, 4000, 6000, 8000]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-white/[0.08] bg-[#0a0f1e] p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#F1F5F9]">Traffic Overview</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-[#3B82F6]" />
            <span className="text-xs text-[#94A3B8]">Page Views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-[#8B5CF6]" />
            <span className="text-xs text-[#94A3B8]">Unique Visitors</span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="pvGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="uvGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick) => {
          const y = padding.top + pvBuild.chartH - (tick / (pvBuild.max || 1)) * pvBuild.chartH
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="4 4"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill="#64748B">
                {tick >= 1000 ? `${tick / 1000}k` : tick}
              </text>
            </g>
          )
        })}

        {/* X-axis labels */}
        {data.map((d, i) => {
          const x = padding.left + (i / (data.length - 1)) * pvBuild.chartW
          return (
            <text
              key={d.date}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="text-[10px]"
              fill="#64748B"
            >
              {d.date}
            </text>
          )
        })}

        {/* Page views area + line */}
        <path d={pvBuild.areaPath} fill="url(#pvGrad)" />
        <path d={pvBuild.linePath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Unique visitors area + line */}
        <path d={uvBuild.areaPath} fill="url(#uvGrad)" />
        <path d={uvBuild.linePath} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {pvBuild.points.map((p, i) => (
          <circle
            key={`pv-${i}`}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 5 : 3}
            fill="#3B82F6"
            stroke="#0a0f1e"
            strokeWidth="2"
            className="transition-all cursor-pointer"
            onMouseEnter={() => setHoveredIndex(i)}
          />
        ))}
        {uvBuild.points.map((p, i) => (
          <circle
            key={`uv-${i}`}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 5 : 3}
            fill="#8B5CF6"
            stroke="#0a0f1e"
            strokeWidth="2"
            className="transition-all cursor-pointer"
            onMouseEnter={() => setHoveredIndex(i)}
          />
        ))}

        {/* Hover tooltip */}
        {hoveredIndex !== null && pvBuild.points[hoveredIndex] && data[hoveredIndex] && (
          <g>
            <line
              x1={pvBuild.points[hoveredIndex]!.x}
              y1={padding.top}
              x2={pvBuild.points[hoveredIndex]!.x}
              y2={padding.top + pvBuild.chartH}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="3 3"
            />
            <rect
              x={pvBuild.points[hoveredIndex]!.x - 55}
              y={padding.top - 2}
              width={110}
              height={42}
              rx={6}
              fill="#1E293B"
              stroke="rgba(255,255,255,0.1)"
            />
            <text x={pvBuild.points[hoveredIndex]!.x} y={padding.top + 14} textAnchor="middle" fill="#3B82F6" className="text-[10px]">
              Views: {data[hoveredIndex]!.pageViews.toLocaleString()}
            </text>
            <text x={pvBuild.points[hoveredIndex]!.x} y={padding.top + 30} textAnchor="middle" fill="#8B5CF6" className="text-[10px]">
              Visitors: {data[hoveredIndex]!.uniqueVisitors.toLocaleString()}
            </text>
          </g>
        )}
      </svg>
    </motion.div>
  )
}
