'use client'

import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 rounded-lg bg-white/[0.03] border border-white/[0.08] p-1',
      className
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
      'text-[#64748B] hover:text-[#94A3B8]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:text-[#F1F5F9]',
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

/** Animated tab indicator — place inside TabsList as a layoutId-based underline */
function TabsIndicator({ layoutId = 'tab-indicator' }: { layoutId?: string }) {
  return (
    <motion.div
      layoutId={layoutId}
      className="absolute inset-0 rounded-md bg-white/[0.06]"
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    />
  )
}

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsIndicator, TabsContent }
