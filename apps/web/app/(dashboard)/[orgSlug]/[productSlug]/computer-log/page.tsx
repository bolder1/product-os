'use client'

/**
 * R10 — Computer Log.
 *
 * Immutable action history surfaced under Intelligence mode. Every
 * Computer Mode action (suggest / assist / auto) lands here with its
 * input, output, status, and originating studio. Supports rollback for
 * `done` entries that carry reversible diffs.
 */

import { useMemo } from 'react'
import { PageHeader } from '@product-os/ui'
import { Cpu, Check, X, Clock, AlertCircle } from 'lucide-react'
import { useComputerModeStore, type ActionEntry } from '../../../../lib/computer-mode-store'

const STATUS_COLORS: Record<ActionEntry['status'], string> = {
  pending:  'text-[var(--color-warning)] bg-[var(--color-warning-muted)]',
  running:  'text-[var(--accent-text)] bg-[var(--accent-muted)]',
  done:     'text-[var(--color-success)] bg-[var(--color-success-muted)]',
  rejected: 'text-[var(--text-tertiary)] bg-[var(--bg-elevated)]',
  failed:   'text-[var(--color-error)] bg-[var(--color-error-muted)]',
}

const STATUS_ICONS: Record<ActionEntry['status'], typeof Check> = {
  pending:  Clock,
  running:  Cpu,
  done:     Check,
  rejected: X,
  failed:   AlertCircle,
}

export default function ComputerLogPage() {
  const actionLog = useComputerModeStore((s) => s.actionLog)
  const mode = useComputerModeStore((s) => s.mode)

  const entries = useMemo(
    () => [...actionLog].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [actionLog],
  )

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-base)] overflow-hidden">
      <PageHeader
        eyebrow={<span>Intelligence · Computer Log</span>}
        title="Computer Log"
        subtitle={`Immutable record of every AI action. Current mode: ${mode}`}
        bordered={false}
        className="px-10 pt-8 pb-4"
      />

      <div className="px-10 pb-10 flex-1 overflow-y-auto">
        {entries.length === 0 && (
          <div className="max-w-xl mx-auto text-center py-16">
            <Cpu size={32} className="mx-auto text-[var(--text-tertiary)] opacity-60" />
            <h2 className="mt-4 text-[18px] font-medium text-[var(--text-primary)]">No actions yet</h2>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
              When Copilot drafts a change or a Skill runs, it will land here. The log is append-only — rejected
              proposals are kept for audit.
            </p>
          </div>
        )}

        <ul className="space-y-2 max-w-4xl mx-auto">
          {entries.map((a) => {
            const Icon = STATUS_ICONS[a.status]
            return (
              <li
                key={a.id}
                className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md uppercase tracking-wide shrink-0 ${STATUS_COLORS[a.status]}`}
                  >
                    <Icon size={10} />
                    {a.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">{a.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{a.kind}</span>
                    </div>
                    {a.detail && (
                      <p className="mt-1 text-[12px] text-[var(--text-secondary)] leading-relaxed">{a.detail}</p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                      <span>{new Date(a.timestamp).toLocaleString()}</span>
                      {a.studio && <span>· studio: {a.studio}</span>}
                      {a.confirmRequired && <span>· required approval</span>}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
