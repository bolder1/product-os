'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '../lib/utils'

const colorVariants = {
  default: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  info: 'bg-cyan-500',
} as const

export interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  label?: string
  showPercentage?: boolean
  color?: keyof typeof colorVariants
}

const Progress = React.forwardRef<React.ComponentRef<typeof ProgressPrimitive.Root>, ProgressProps>(
  ({ className, value = 0, label, showPercentage, color = 'default', ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, value ?? 0))

    return (
      <div className="flex flex-col gap-1.5">
        {(label || showPercentage) && (
          <div className="flex items-center justify-between">
            {label && <span className="text-sm text-[#94A3B8]">{label}</span>}
            {showPercentage && (
              <span className="text-xs font-medium text-[#64748B]">{Math.round(pct)}%</span>
            )}
          </div>
        )}
        <ProgressPrimitive.Root
          ref={ref}
          value={pct}
          className={cn(
            'relative h-2 w-full overflow-hidden rounded-full bg-white/[0.05]',
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              colorVariants[color]
            )}
            style={{ width: `${pct}%` }}
          />
        </ProgressPrimitive.Root>
      </div>
    )
  }
)
Progress.displayName = 'Progress'

export { Progress }
