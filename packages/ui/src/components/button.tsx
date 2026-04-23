'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'

/**
 * Editorial/spatial Button.
 * Consumes CSS vars from globals.css so theme shifts propagate globally.
 * Aligns visually with `.tool-btn` utility classes.
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium transition-[background-color,border-color,color,box-shadow]',
    'duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
    'disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--accent)] text-white border border-[var(--accent)] hover:bg-[var(--accent-hover)] hover:border-[var(--accent-hover)]',
        secondary:
          'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong)]',
        ghost:
          'bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        danger:
          'bg-transparent text-[var(--color-error)] border border-[var(--border-default)] hover:bg-[var(--color-error-muted)]',
        outline:
          'bg-transparent text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--surface-hover)]',
      },
      size: {
        sm: 'h-8 px-3 text-[var(--font-size-caption)] rounded-[var(--radius-xs)]',
        md: 'h-9 px-4 text-[var(--font-size-label)] rounded-[var(--radius-sm)]',
        lg: 'h-11 px-6 text-[var(--font-size-body)] rounded-[var(--radius-md)]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, icon, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
