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

export interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant
  size?: Size
}

/**
 * A link that looks like a button.
 *
 * Navigation is an anchor, not a button — it should be middle-clickable,
 * openable in a new tab, and announced as a link.
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant = 'secondary', size = 'md', className, children, ...props },
  ref,
) {
  return (
    <a
      ref={ref}
      data-variant={variant}
      data-size={size}
      className={cn(base, 'g-button-link', className)}
      {...props}
    >
      {children}
    </a>
  )
})
