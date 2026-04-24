'use client'

import { motion } from 'framer-motion'
import { GitBranch, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const kindColors: Record<string, string> = {
  module: '#3B82F6',
  feature: '#8B5CF6',
  page: '#06B6D4',
  entity: '#10B981',
}

const nodes = [
  { id: 'auth', label: 'Auth', kind: 'module', x: 60, y: 40 },
  { id: 'payments', label: 'Payments', kind: 'module', x: 240, y: 50 },
  { id: 'user-login', label: 'Login', kind: 'feature', x: 40, y: 120 },
  { id: 'user-signup', label: 'Signup', kind: 'feature', x: 150, y: 110 },
  { id: 'checkout', label: 'Checkout', kind: 'feature', x: 280, y: 130 },
  { id: 'landing', label: 'Landing', kind: 'page', x: 100, y: 200 },
  { id: 'dashboard', label: 'Dashboard', kind: 'page', x: 220, y: 200 },
  { id: 'user', label: 'User', kind: 'entity', x: 50, y: 270 },
  { id: 'order', label: 'Order', kind: 'entity', x: 180, y: 280 },
  { id: 'settings', label: 'Settings', kind: 'page', x: 310, y: 260 },
]

const edges = [
  { from: 'auth', to: 'user-login' },
  { from: 'auth', to: 'user-signup' },
  { from: 'payments', to: 'checkout' },
  { from: 'user-login', to: 'landing' },
  { from: 'user-signup', to: 'landing' },
  { from: 'checkout', to: 'dashboard' },
  { from: 'landing', to: 'user' },
  { from: 'dashboard', to: 'order' },
  { from: 'dashboard', to: 'settings' },
  { from: 'user', to: 'order' },
]

function getNode(id: string) {
  return nodes.find((n) => n.id === id)!
}

export function DependencyGraphMini() {
  const params = useParams()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Dependency Graph
        </span>
      </div>

      <div className="flex-1 relative">
        <svg width="100%" height="100%" viewBox="0 0 370 310" className="overflow-visible">
          {edges.map((edge, i) => {
            const from = getNode(edge.from)
            const to = getNode(edge.to)
            return (
              <motion.line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={1.5}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
              />
            )
          })}
          {nodes.map((node, i) => {
            const color = kindColors[node.kind]
            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.3, type: 'spring' }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={16}
                  fill={color + '20'}
                  stroke={color}
                  strokeWidth={1.5}
                />
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={color}
                  fontSize="8"
                  fontWeight="600"
                >
                  {node.label}
                </text>
              </motion.g>
            )
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
        <div className="flex gap-3">
          {Object.entries(kindColors).map(([kind, color]) => (
            <div key={kind} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-[var(--text-tertiary)] capitalize">{kind}s</span>
            </div>
          ))}
        </div>
        <Link
          href={`/${params.orgSlug}/${params.productSlug}/graph-explorer`}
          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          Open Graph Explorer
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </motion.div>
  )
}
