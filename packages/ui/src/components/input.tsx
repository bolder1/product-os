'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, id, ...props }, ref) => {
    const inputId = id || React.useId()
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#94A3B8]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">
              {icon}
            </span>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] transition-colors duration-200',
              'hover:border-white/[0.12]',
              'focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10',
              error && 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-rose-400">{error}</p>
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
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[#94A3B8]"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] transition-colors duration-200 resize-y',
            'hover:border-white/[0.12]',
            'focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-400">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
