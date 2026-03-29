'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] text-[#64748B]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#F1F5F9]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[#94A3B8]">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export { EmptyState }
