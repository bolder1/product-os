'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check, Minus } from 'lucide-react'
import { cn } from '../lib/utils'

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, label, indeterminate, id, checked, ...props }, ref) => {
    const checkboxId = id || React.useId()
    const resolvedChecked = indeterminate ? 'indeterminate' : checked

    const element = (
      <CheckboxPrimitive.Root
        id={checkboxId}
        ref={ref}
        checked={resolvedChecked}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded border border-white/[0.12] bg-white/[0.03] transition-colors duration-200',
          'hover:border-white/[0.18]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060918]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600',
          'data-[state=indeterminate]:bg-indigo-600 data-[state=indeterminate]:border-indigo-600',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          {indeterminate ? (
            <Minus className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    )

    if (label) {
      return (
        <div className="flex items-center gap-2.5">
          {element}
          <label
            htmlFor={checkboxId}
            className="text-sm text-[#F1F5F9] cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        </div>
      )
    }

    return element
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
