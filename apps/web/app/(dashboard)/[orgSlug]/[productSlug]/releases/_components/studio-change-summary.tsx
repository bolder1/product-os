'use client'

import { useMemo } from 'react'
import { useGraphStore, type GraphNode } from '../../../../../lib/graph-store'
import {
  Palette,
  Puzzle,
  Layout,
  FileText,
  GitBranch,
  Code,
  Send,
} from 'lucide-react'

export interface StudioChangeSummaryProps {
  productId: string
  sinceDate: string // ISO date string
}

interface StudioRow {
  key: string
  label: string
  icon: React.ReactNode
  count: number
}

const STUDIOS: { key: string; label: string; icon: React.ReactNode; kinds: string[] }[] = [
  {
    key: 'brand',
    label: 'Brand',
    icon: <Palette size={12} />,
    kinds: ['token', 'asset'],
  },
  {
    key: 'components',
    label: 'Components',
    icon: <Puzzle size={12} />,
    kinds: ['component', 'variant'],
  },
  {
    key: 'design',
    label: 'Design',
    icon: <Layout size={12} />,
    kinds: ['screen', 'page', 'route'],
  },
  {
    key: 'pages',
    label: 'Pages',
    icon: <FileText size={12} />,
    kinds: ['page', 'route'],
  },
  {
    key: 'workflows',
    label: 'Workflows',
    icon: <GitBranch size={12} />,
    kinds: ['workflow'],
  },
  {
    key: 'code',
    label: 'Code',
    icon: <Code size={12} />,
    kinds: ['entity', 'field', 'connector_binding', 'mcp_binding'],
  },
  {
    key: 'handoff',
    label: 'Handoff',
    icon: <Send size={12} />,
    kinds: ['handoff_item'],
  },
]

export function StudioChangeSummary({ productId, sinceDate }: StudioChangeSummaryProps) {
  const nodes = useGraphStore((s: { nodes: GraphNode[] }) => s.nodes)

  const rows: StudioRow[] = useMemo(() => {
    const sinceMs = new Date(sinceDate).getTime()
    const productNodes = nodes.filter((n) => n.productId === productId)

    return STUDIOS.map((studio) => {
      const count = productNodes.filter(
        (n) =>
          studio.kinds.includes(n.kind) &&
          new Date(n.updatedAt).getTime() > sinceMs,
      ).length
      return { key: studio.key, label: studio.label, icon: studio.icon, count }
    })
  }, [nodes, productId, sinceDate])

  const totalChanged = rows.reduce((s, r) => s + r.count, 0)

  return (
    <div
      className="rounded-xl border flex flex-col gap-3 p-4"
      style={{
        background: 'var(--bg-card, rgba(255,255,255,0.03))',
        borderColor: 'var(--border-default, rgba(255,255,255,0.08))',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          What Changed
        </span>
        {totalChanged > 0 ? (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-bg, rgba(139,92,246,0.15))', color: 'var(--accent-text, #A78BFA)' }}
          >
            {totalChanged} update{totalChanged !== 1 ? 's' : ''}
          </span>
        ) : (
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            No changes
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-subtle, rgba(255,255,255,0.03))' }}
          >
            <span style={{ color: 'var(--text-tertiary)' }}>{row.icon}</span>
            <span
              className="flex-1 text-[11px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {row.label}
            </span>
            {row.count > 0 ? (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(96,165,250,0.12)',
                  color: '#60A5FA',
                  minWidth: 20,
                  textAlign: 'center',
                }}
              >
                {row.count}
              </span>
            ) : (
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                —
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
