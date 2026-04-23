'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

/**
 * Canonical EmptyState primitive.
 * Used across every studio — do not re-implement per studio.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'default' | 'accent'
}

function EmptyState({
  icon,
  title,
  description,
  action,
  tone = 'default',
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-8 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            'mb-5 flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] border',
            tone === 'accent'
              ? 'bg-[var(--accent-subtle)] border-[var(--border-accent)] text-[var(--accent-text)]'
              : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-tertiary)]'
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="text-[var(--font-size-h3)] leading-[var(--line-height-h3)] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-[48ch] text-[var(--font-size-body)] leading-[var(--line-height-body)] text-[var(--text-secondary)]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export { EmptyState }
