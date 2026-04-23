'use client'

/**
 * R12 — 5-Modes tour overlay.
 *
 * A one-time, dismissable overlay that introduces the 5 Modes plus the
 * persistent Copilot and Computer Mode. Shown on first entry to any
 * product dashboard; a small "Show tour" link in the topbar menu can
 * re-open it later (not wired here — surface TBD).
 */

import { useEffect, useState } from 'react'
import { Compass, Layers, Rocket, Activity, Sparkles, Cpu, MessageSquare, ArrowRight, X } from 'lucide-react'

const TOUR_KEY = 'product-os-modes-tour-seen'

const SLIDES = [
  {
    icon: Compass,
    title: 'Plan',
    body: 'Capture intent. Shape the product graph. Planner, Canvas, Roadmap — one spine for every idea.',
    accent: '#8b5cf6',
  },
  {
    icon: Layers,
    title: 'Build',
    body: 'Design, model, and compose the product. Design · Components · Pages · Brand · Workflows — lenses on the same objects.',
    accent: '#3b82f6',
  },
  {
    icon: Rocket,
    title: 'Ship',
    body: 'Generate, verify, release. Releases · Testing · Handoff · Code — the delivery pipe for the graph.',
    accent: '#10b981',
  },
  {
    icon: Activity,
    title: 'Operate',
    body: 'Run the product. Watch signals. Control Tower · Work · Analytics · Decisions — the live surface.',
    accent: '#f59e0b',
  },
  {
    icon: Sparkles,
    title: 'Intelligence',
    body: 'Configure the AI spine. Cortex · Extensions (Connectors + MCP + Skills) · Computer Log · Graph Config.',
    accent: '#ec4899',
  },
  {
    icon: MessageSquare,
    title: 'Copilot, always on',
    body: 'The right-edge Copilot follows you across every Mode. One thread, full context, persistent memory.',
    accent: '#6398ff',
  },
  {
    icon: Cpu,
    title: 'Computer Mode',
    body: 'Suggest · Assist · Auto. Every AI action previews before commit, logged immutably, reversible from the log.',
    accent: '#6398ff',
  },
]

function isSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(TOUR_KEY, '1')
  } catch {}
}

export function ModesTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!isSeen()) setOpen(true)
  }, [])

  function dismiss() {
    markSeen()
    setOpen(false)
  }

  function next() {
    if (step < SLIDES.length - 1) setStep((s) => s + 1)
    else dismiss()
  }

  if (!open) return null

  const slide = SLIDES[step]
  const Icon = slide.icon

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Modes tour"
    >
      <div className="relative w-[520px] max-w-[92vw] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-md text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]"
          aria-label="Dismiss tour"
        >
          <X size={14} />
        </button>

        {/* Hero */}
        <div
          className="px-10 pt-10 pb-8 border-b border-[var(--border-subtle)]"
          style={{
            background: `radial-gradient(circle at 20% 0%, ${slide.accent}22 0%, transparent 60%)`,
          }}
        >
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ background: `${slide.accent}22`, color: slide.accent }}
          >
            <Icon size={22} />
          </div>
          <h2 className="mt-5 font-serif text-[28px] leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
            {slide.title}
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--text-secondary)] max-w-[40ch]">
            {slide.body}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-base)]">
          <div className="flex items-center gap-1">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className="block h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? 20 : 6,
                  background: i === step ? 'var(--accent-text)' : 'var(--border-subtle)',
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={dismiss}
              className="px-3 h-8 text-[12px] font-medium rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition"
            >
              Skip tour
            </button>
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 px-4 h-8 text-[12px] font-medium rounded-md bg-[var(--accent-text)] text-white hover:opacity-90 transition"
            >
              {step < SLIDES.length - 1 ? 'Next' : 'Get started'}
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
