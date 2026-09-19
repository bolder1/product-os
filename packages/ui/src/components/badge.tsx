'use client'

import { cn } from '../lib/utils'

type Tone = 'neutral' | 'grounded' | 'drift' | 'danger' | 'info'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  /**
   * Status badges carry a dot as well as a label — colour is never the only
   * carrier of meaning.
   */
  dot?: boolean
}

export function Badge({ tone = 'neutral', dot, className, children, ...props }: BadgeProps) {
  return (
    <span data-tone={tone} className={cn('g-badge', className)} {...props}>
      {dot ? <span aria-hidden="true" className="g-badge-dot" /> : null}
      {children}
    </span>
  )
}
