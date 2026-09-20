'use client'

import { cn } from '../lib/utils'

export type EntryState = 'grounded' | 'drifted' | 'draft'

export interface ContextEntryRowProps extends React.HTMLAttributes<HTMLButtonElement> {
  title: string
  /** The entry's type — the equivalent of a supertag. Rendered as a quiet pill. */
  kind: string
  state: EntryState
  /** Human-readable ageing, e.g. "confirmed 4d ago" or "stale · 94d". */
  age: string
  selected?: boolean
}

/**
 * One row in the context list.
 *
 * Visible ageing is the point: a markdown file cannot tell you it has gone
 * stale, so every row carries when it was last confirmed.
 */
export function ContextEntryRow({
  title,
  kind,
  state,
  age,
  selected,
  className,
  ...props
}: ContextEntryRowProps) {
  return (
    <button
      type="button"
      data-state={state}
      data-selected={selected || undefined}
      className={cn('g-entry', className)}
      {...props}
    >
      <span aria-hidden="true" className="g-entry-dot" />
      <span className="g-entry-title">{title}</span>
      <span className="g-entry-kind">{kind}</span>
      <span className="g-entry-age">{age}</span>
      <span className="g-sr-only">
        {state === 'drifted' ? 'Drifted' : state === 'grounded' ? 'Grounded' : 'Draft'}
      </span>
    </button>
  )
}

export interface FieldRowProps {
  label: string
  /** Omit or leave empty to render the unset state. */
  value?: string
  /** Shown in place of a missing value. */
  placeholder?: string
  className?: string
}

/**
 * A label/value pair inside a context entry.
 *
 * An unset field keeps its row and shows a muted placeholder — a half-filled
 * entry should display its own gaps rather than hide them.
 */
export function FieldRow({ label, value, placeholder = 'Not set', className }: FieldRowProps) {
  const empty = !value
  return (
    <div className={cn('g-fieldrow', className)} data-empty={empty || undefined}>
      <span className="g-fieldrow-label">{label}</span>
      <span className="g-fieldrow-value">{empty ? placeholder : value}</span>
    </div>
  )
}

/**
 * The logo figure as a divider: one strong line, then shorter and fainter.
 * The only ornament in the system.
 */
export function StrataRule({ width = 320, className }: { width?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('g-strata', className)}
      style={{ ['--g-strata-w' as string]: `${width}px` }}
    >
      <i />
      <i />
      <i />
    </span>
  )
}
