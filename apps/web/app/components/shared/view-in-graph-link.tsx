'use client'

/**
 * R13 — ViewInGraphLink.
 *
 * Upgraded from a deep-link into /graph-explorer (now retired) into a
 * one-click trigger for the right-rail <GraphInspector/>. Every existing
 * call site (Pages, Components, Workflows, Features, Entities) now opens
 * the Inspector inline instead of navigating away.
 */

import { Network } from 'lucide-react'
import { useInspectorStore } from '../../lib/inspector-store'

interface Props {
  nodeId: string
  className?: string
  /** Optional label override; defaults to "Graph". */
  label?: string
}

export function ViewInGraphLink({ nodeId, className = '', label = 'Graph' }: Props) {
  const inspect = useInspectorStore((s) => s.inspect)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        inspect(nodeId)
      }}
      title="Inspect in graph"
      aria-label="Inspect in graph"
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--accent-text)] hover:bg-[var(--accent-muted)] border border-[var(--border-subtle)] transition-all ${className}`}
    >
      <Network size={9} />
      {label}
    </button>
  )
}
