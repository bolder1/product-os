'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

/**
 * Editorial Input — unified with .tool-input utility class.
 * Taller, roomier, consumes CSS vars.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, id, ...props }, ref) => {
    const inputId = id || React.useId()
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[var(--font-size-label)] font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
              {icon}
            </span>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex h-9 w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2',
              'text-[var(--font-size-body)] leading-[var(--line-height-body)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
              'transition-[border-color,box-shadow] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
              'hover:border-[var(--border-strong)]',
              'focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-muted)]',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[var(--font-size-caption)] text-[var(--color-error)]">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id || React.useId()
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-[var(--font-size-label)] font-medium text-[var(--text-secondary)]"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[96px] w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--bg-inset)] px-3 py-2',
            'text-[var(--font-size-body)] leading-[var(--line-height-body)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
            'transition-[border-color,box-shadow] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] resize-y',
            'hover:border-[var(--border-strong)]',
            'focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-subtle)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error-muted)]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-[var(--font-size-caption)] text-[var(--color-error)]">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
