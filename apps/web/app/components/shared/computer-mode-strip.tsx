'use client'

/**
 * R10 — Computer Mode strip.
 *
 * A slim strip that appears below the topbar only when the Copilot has
 * drafted actions awaiting approval. Shows:
 *   · Mode badge (suggest / assist / auto)
 *   · Count of pending actions
 *   · Preview (opens the existing <ComputerModePanel/>)
 *   · Approve all
 *   · Reject all
 *
 * Every action writes to the immutable action log — visible under
 * Intelligence → Computer Log.
 */

import { useMemo } from 'react'
import { Cpu, Eye, Check, X as XIcon, Shield } from 'lucide-react'
import { useComputerModeStore } from '../../lib/computer-mode-store'

export function ComputerModeStrip() {
  const pending = useComputerModeStore((s) => s.pendingActions)
  const mode = useComputerModeStore((s) => s.mode)
  const setMode = useComputerModeStore((s) => s.setMode)
  const open = useComputerModeStore((s) => s.open)
  const confirmAction = useComputerModeStore((s) => s.confirmAction)
  const rejectAction = useComputerModeStore((s) => s.rejectAction)

  const count = pending.length
  const firstLabel = useMemo(() => pending[0]?.label ?? '', [pending])

  if (count === 0) return null

  return (
    <div
      role="region"
      aria-label="Computer mode pending actions"
      className="flex items-center justify-between h-10 px-4 border-b border-[var(--border-subtle)] bg-[var(--accent-muted)]/40"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 text-[var(--accent-text)]">
          <Cpu size={13} />
          <span className="text-[11px] uppercase tracking-wide font-semibold">Computer Mode</span>
        </div>
        <ModePill mode={mode} onChange={setMode} />
        <span className="text-[12px] text-[var(--text-primary)] truncate">
          <span className="font-medium">{count}</span>{' '}
          proposed {count === 1 ? 'change' : 'changes'}
          {firstLabel && <span className="text-[var(--text-secondary)]"> — {firstLabel}{count > 1 ? ` +${count - 1} more` : ''}</span>}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={open}
          className="inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
        >
          <Eye size={12} />
          Preview
        </button>
        <button
          onClick={() => pending.forEach((a) => confirmAction(a.id))}
          className="inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium rounded-md bg-[var(--color-success)] text-white hover:opacity-90 transition"
        >
          <Check size={12} />
          Approve all
        </button>
        <button
          onClick={() => pending.forEach((a) => rejectAction(a.id))}
          className="inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
        >
          <XIcon size={12} />
          Reject
        </button>
      </div>
    </div>
  )
}

function ModePill({
  mode,
  onChange,
}: {
  mode: 'suggest' | 'assist' | 'auto'
  onChange: (m: 'suggest' | 'assist' | 'auto') => void
}) {
  const opts = ['suggest', 'assist', 'auto'] as const
  return (
    <div className="inline-flex items-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className="px-2 h-6 text-[10px] uppercase tracking-wide font-semibold transition"
          style={{
            color: mode === o ? 'var(--accent-text)' : 'var(--text-tertiary)',
            background: mode === o ? 'var(--accent-muted)' : 'transparent',
          }}
        >
          {o === 'suggest' && <Shield size={10} className="inline -mt-0.5 mr-1" />}
          {o}
        </button>
      ))}
    </div>
  )
}
