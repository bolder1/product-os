'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

/**
 * Canonical Page Header primitive.
 * Use across every studio. Enforces editorial typography + rhythm.
 *
 * Layout:
 *   [ eyebrow (optional) ]
 *   [ title                                    actions ]
 *   [ subtitle (optional) ]
 */
export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  /** Use a serif display face for the title (default: true). */
  serif?: boolean
  /** Extra bottom border separator (default: true). */
  bordered?: boolean
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  serif = true,
  bordered = true,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-2',
        'px-10 pt-8 pb-6',
        bordered && 'border-b border-[var(--border-subtle)]',
        className
      )}
      {...props}
    >
      {eyebrow && (
        <div className="page-header-eyebrow">{eyebrow}</div>
      )}
      <div className="flex items-start justify-between gap-6">
        <h1
          className={cn(
            'm-0 tracking-[-0.02em] font-medium text-[var(--text-primary)]',
            'text-[var(--font-size-h1)] leading-[var(--line-height-h1)]',
            serif && 'font-serif'
          )}
        >
          {title}
        </h1>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {subtitle && (
        <p className="m-0 max-w-[60ch] text-[var(--font-size-body)] leading-[var(--line-height-body)] text-[var(--text-secondary)]">
          {subtitle}
        </p>
      )}
    </header>
  )
}
