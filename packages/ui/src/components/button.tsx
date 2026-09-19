'use client'

import { forwardRef } from 'react'
import { cn } from '../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Renders a loading state and blocks interaction. */
  loading?: boolean
}

const base =
  'g-button inline-flex items-center justify-center gap-2 whitespace-nowrap ' +
  'font-medium transition-colors select-none ' +
  'disabled:opacity-50 disabled:pointer-events-none'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      className={cn(base, className)}
      {...props}
    >
      {children}
    </button>
  )
})
