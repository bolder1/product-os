'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '../lib/utils'

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
  xl: 'h-14 w-14 text-lg',
} as const

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-[#64748B]',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
} as const

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  size?: keyof typeof sizeClasses
  status?: keyof typeof statusColors
}

const Avatar = React.forwardRef<React.ComponentRef<typeof AvatarPrimitive.Root>, AvatarProps>(
  ({ className, size = 'md', status, ...props }, ref) => (
    <div className="relative inline-flex shrink-0">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.05] border border-white/[0.08]',
          sizeClasses[size],
          className
        )}
        {...props}
      />
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-[#060918]',
            statusColors[status],
            size === 'sm' ? 'h-2 w-2' : size === 'xl' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'
          )}
        />
      )}
    </div>
  )
)
Avatar.displayName = 'Avatar'

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
))
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-indigo-500/20 font-medium text-indigo-300',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
