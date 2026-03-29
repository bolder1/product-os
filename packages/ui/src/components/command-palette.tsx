'use client'

import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { cn } from '../lib/utils'

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

const Command = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-xl bg-[#0C1024] text-[#F1F5F9]',
      className
    )}
    {...props}
  />
))
Command.displayName = 'Command'

const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b border-white/[0.08] px-4">
    <Search className="mr-2 h-4 w-4 shrink-0 text-[#64748B]" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-11 w-full bg-transparent py-3 text-sm text-[#F1F5F9] placeholder:text-[#64748B] outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = 'CommandInput'

const CommandList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('max-h-80 overflow-y-auto overscroll-contain p-2', className)}
    {...props}
  />
))
CommandList.displayName = 'CommandList'

const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-8 text-center text-sm text-[#64748B]"
    {...props}
  />
))
CommandEmpty.displayName = 'CommandEmpty'

const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[#64748B] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
      className
    )}
    {...props}
  />
))
CommandGroup.displayName = 'CommandGroup'

const CommandSeparator = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-white/[0.08]', className)}
    {...props}
  />
))
CommandSeparator.displayName = 'CommandSeparator'

const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[#F1F5F9] outline-none transition-colors',
      'data-[selected=true]:bg-white/[0.05] data-[selected=true]:text-white',
      'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      className
    )}
    {...props}
  />
))
CommandItem.displayName = 'CommandItem'

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('ml-auto text-xs tracking-widest text-[#64748B]', className)}
    {...props}
  />
)
CommandShortcut.displayName = 'CommandShortcut'

/* ------------------------------------------------------------------ */
/*  CommandPalette — full Ctrl+K dialog                                */
/* ------------------------------------------------------------------ */

export interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  children: React.ReactNode
}

function CommandPalette({
  open: controlledOpen,
  onOpenChange,
  placeholder = 'Type a command or search...',
  children,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!isOpen)
      }
      if (e.key === 'Escape' && isOpen) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <Command className="border border-white/[0.08] shadow-2xl shadow-black/50">
              <CommandInput placeholder={placeholder} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                {children}
              </CommandList>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  CommandPalette,
}
