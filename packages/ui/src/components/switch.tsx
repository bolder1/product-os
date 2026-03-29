'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '../lib/utils'

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string
}

const Switch = React.forwardRef<React.ComponentRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const switchId = id || React.useId()
    const element = (
      <SwitchPrimitive.Root
        id={switchId}
        ref={ref}
        className={cn(
          'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060918]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-white/[0.1]',
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200',
            'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
          )}
        />
      </SwitchPrimitive.Root>
    )

    if (label) {
      return (
        <div className="flex items-center gap-2.5">
          {element}
          <label
            htmlFor={switchId}
            className="text-sm text-[#F1F5F9] cursor-pointer select-none"
          >
            {label}
          </label>
        </div>
      )
    }

    return element
  }
)
Switch.displayName = 'Switch'

export { Switch }
