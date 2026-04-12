'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render a circle skeleton (e.g., avatar placeholder) */
  circle?: boolean
}

function Skeleton({ className, circle, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-white/[0.05]',
        circle ? 'rounded-full' : 'rounded-lg',
        className
      )}
      {...props}
    />
  )
}

/** Common skeleton patterns */
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton circle className="h-9 w-9" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}

export { Skeleton, SkeletonText, SkeletonCard }
