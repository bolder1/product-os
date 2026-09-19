'use client'

import { cn } from '../lib/utils'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn('g-spinner', className)}>
      <span className="g-spinner-mark" aria-hidden="true" />
    </span>
  )
}
