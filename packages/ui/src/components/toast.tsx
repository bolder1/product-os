'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  title?: string
  description?: string
  variant: ToastVariant
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const variantConfig = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/20 bg-emerald-500/10',
    iconClass: 'text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    className: 'border-rose-500/20 bg-rose-500/10',
    iconClass: 'text-rose-400',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-amber-500/20 bg-amber-500/10',
    iconClass: 'text-amber-400',
  },
  info: {
    icon: Info,
    className: 'border-cyan-500/20 bg-cyan-500/10',
    iconClass: 'text-cyan-400',
  },
} as const

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

function ToastContainer() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {ctx.toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={ctx.removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const config = variantConfig[toast.variant]
  const Icon = config.icon

  React.useEffect(() => {
    const duration = toast.duration ?? 5000
    const timer = setTimeout(() => onDismiss(toast.id), duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border bg-[#0C1024] p-4 shadow-xl shadow-black/30 backdrop-blur-xl',
        config.className
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconClass)} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-medium text-[#F1F5F9]">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm text-[#94A3B8] mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-0.5 text-[#64748B] hover:text-[#F1F5F9] hover:bg-white/[0.05] transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return {
    toast: ctx.addToast,
    dismiss: ctx.removeToast,
    toasts: ctx.toasts,
  }
}

export { ToastProvider, useToast, type Toast, type ToastVariant }
