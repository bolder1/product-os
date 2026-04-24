'use client'

/**
 * FirstRunBanner
 *
 * Shown at the top of the main content area when a product has no graph
 * nodes yet (i.e. it's brand new). Guides the user to the three most
 * impactful first actions and can be permanently dismissed per product.
 *
 * Non-blocking — renders above the page content, never replaces it.
 */

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Palette, Sparkles, X, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useGraphStore } from '../../../../lib/graph-store'

const DISMISSED_KEY = 'product-os-first-run-dismissed'

function isDismissed(productId: string): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    return (JSON.parse(raw) as string[]).includes(productId)
  } catch {
    return false
  }
}

function dismiss(productId: string) {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    const existing = raw ? (JSON.parse(raw) as string[]) : []
    if (!existing.includes(productId)) {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify([...existing, productId]))
    }
  } catch {}
}

interface Step {
  icon: React.ElementType
  color: string
  title: string
  description: string
  cta: string
  href: string
}

const STEPS: Step[] = [
  {
    icon: Map,
    color: '#3B82F6',
    title: 'Write your first spec',
    description: 'Define what you\'re building in the Planner. Specs auto-seed design frames and tasks.',
    cta: 'Open Planner',
    href: 'planner',
  },
  {
    icon: Palette,
    color: '#EC4899',
    title: 'Design a screen',
    description: 'Open Design Studio and create your first artboard. Export to TSX when ready.',
    cta: 'Open Design',
    href: 'design',
  },
  {
    icon: Sparkles,
    color: '#8B5CF6',
    title: 'Run an AI skill',
    description: 'Use Intelligence → AI Skills to generate specs, UI, or code from a prompt.',
    cta: 'Open AI Skills',
    href: 'ai-skills',
  },
]

interface FirstRunBannerProps {
  productId: string
}

export function FirstRunBanner({ productId }: FirstRunBannerProps) {
  const graphNodeCount = useGraphStore((s) => s.nodes.filter((n) => n.productId === productId).length)

  const [dismissed, setDismissed] = useState(() => isDismissed(productId))
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const params = useParams()
  const router = useRouter()

  const handleDismiss = useCallback(() => {
    dismiss(productId)
    setDismissed(true)
  }, [productId])

  const handleStep = useCallback((step: Step, index: number) => {
    setCompletedSteps((prev) => new Set([...prev, index]))
    const orgSlug = params?.orgSlug as string
    const productSlug = params?.productSlug as string
    if (orgSlug && productSlug) {
      router.push(`/${orgSlug}/${productSlug}/${step.href}`)
    }
  }, [params, router])

  // Only show when: not dismissed AND product has fewer than 3 graph nodes
  if (dismissed || graphNodeCount >= 3) return null

  const allDone = completedSteps.size === STEPS.length

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mx-3 mt-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
        role="region"
        aria-label="Getting started with your new product"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-2">
            {allDone ? (
              <CheckCircle2 size={14} className="text-[var(--color-success)]" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            )}
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">
              {allDone ? 'You\'re all set! 🎉' : 'Get started with your new product'}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-inset)] px-1.5 py-0.5 rounded-full">
              {completedSteps.size}/{STEPS.length} done
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded"
            aria-label="Dismiss getting started banner"
          >
            <X size={13} />
          </button>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-3 divide-x divide-[var(--border-default)]">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const done = completedSteps.has(i)
            return (
              <button
                key={step.href}
                onClick={() => handleStep(step, i)}
                className={`flex flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)] ${
                  done ? 'opacity-60' : ''
                }`}
                aria-label={`${done ? 'Completed: ' : ''}${step.title}`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${step.color}18` }}
                  >
                    {done
                      ? <CheckCircle2 size={12} style={{ color: step.color }} />
                      : <Icon size={12} style={{ color: step.color }} />
                    }
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-primary)]">{step.title}</span>
                </div>
                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                  {step.description}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: step.color }}>
                  {step.cta}
                  <ArrowRight size={10} />
                </div>
              </button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
