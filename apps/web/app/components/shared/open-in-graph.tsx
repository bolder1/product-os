'use client'

/**
 * R8 — <OpenInGraph/> / <ShowImpact/>.
 *
 * Drop-in button any studio can render to surface an object in the
 * Inspector or jump straight into the Living Graph. Two presentation
 * styles: `button` (inline chip) and `icon` (square toolbar icon).
 *
 * Prefer `<InspectEntity>` when the studio's object is derived from the
 * graph but the caller doesn't have the node id handy — it falls back to
 * a (kind, id) pair and the Inspector resolves it.
 */

import { Network, ArrowUpRight, AlertTriangle } from 'lucide-react'
import { useInspectorStore } from '../../lib/inspector-store'

type Variant = 'button' | 'icon' | 'menu'

interface BaseProps {
  variant?: Variant
  label?: string
  className?: string
}

interface NodeProps extends BaseProps {
  nodeId: string
}

interface EntityProps extends BaseProps {
  kind: string
  id: string
}

export function OpenInGraph({ nodeId, variant = 'button', label = 'Open in Graph', className = '' }: NodeProps) {
  const inspect = useInspectorStore((s) => s.inspect)
  return (
    <BtnShell onClick={() => inspect(nodeId)} variant={variant} label={label} icon={Network} className={className} />
  )
}

export function ShowImpact({ nodeId, variant = 'button', label = 'Show Impact', className = '' }: NodeProps) {
  const inspect = useInspectorStore((s) => s.inspect)
  const setTab = useInspectorStore((s) => s.setTab)
  return (
    <BtnShell
      onClick={() => {
        inspect(nodeId)
        setTab('impact')
      }}
      variant={variant}
      label={label}
      icon={AlertTriangle}
      className={className}
    />
  )
}

export function InspectEntity({ kind, id, variant = 'button', label = 'Open in Graph', className = '' }: EntityProps) {
  const inspectEntity = useInspectorStore((s) => s.inspectEntity)
  return (
    <BtnShell
      onClick={() => inspectEntity(kind, id)}
      variant={variant}
      label={label}
      icon={ArrowUpRight}
      className={className}
    />
  )
}

// ---------------------------------------------------------------------------

function BtnShell({
  onClick,
  variant,
  label,
  icon: Icon,
  className,
}: {
  onClick: () => void
  variant: Variant
  label: string
  icon: typeof Network
  className: string
}) {
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition ${className}`}
      >
        <Icon size={13} />
      </button>
    )
  }
  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition ${className}`}
      >
        <Icon size={13} className="text-[var(--text-tertiary)]" />
        <span>{label}</span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition ${className}`}
    >
      <Icon size={12} />
      <span>{label}</span>
    </button>
  )
}
