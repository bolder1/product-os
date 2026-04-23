'use client'

/**
 * Prompt-gate store — controls the pre-flight gate shown before a prompt runs.
 *
 * The gate has three views: `raw` (two-option choice), `enhanced` (enhancer
 * result), and `estimate` (token estimate). Entry points dispatch openGate()
 * with the raw text + a callback that receives the final prompt and whether
 * the user accepted enhancement.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EnhancedPrompt, EntryPoint, PromptContext } from '@product-os/ai'

export type GatePreference = 'always' | 'low-quality-only' | 'never'
export type GateView = 'raw' | 'enhanced' | 'estimate'

export interface GateSubmission {
  prompt: string
  usedEnhancement: boolean
}

interface PromptGateState {
  open: boolean
  view: GateView
  raw: string
  context: PromptContext | null
  enhancement: EnhancedPrompt | null
  /** Resolver called when the user confirms or cancels. */
  resolver: ((result: GateSubmission | null) => void) | null

  preference: GatePreference
  setPreference: (p: GatePreference) => void

  openGate: (raw: string, context: PromptContext) => Promise<GateSubmission | null>
  setEnhancement: (e: EnhancedPrompt) => void
  setView: (v: GateView) => void
  acceptRaw: () => void
  acceptEnhanced: (finalPrompt: string) => void
  cancel: () => void
}

function shouldGate(raw: string, pref: GatePreference): boolean {
  if (pref === 'never') return false
  if (pref === 'always') return true
  // low-quality-only heuristic: short, or contains hedging/pronoun-only phrases.
  const trimmed = raw.trim()
  if (trimmed.length < 20) return true
  if (/^\s*(make it|fix it|improve it|try again|do that|run it)\b/i.test(trimmed)) return true
  return false
}

export const usePromptGateStore = create<PromptGateState>()(
  persist(
    (set, get) => ({
      open: false,
      view: 'raw',
      raw: '',
      context: null,
      enhancement: null,
      resolver: null,
      preference: 'low-quality-only',

      setPreference: (p) => set({ preference: p }),

      openGate: (raw, context) => {
        // Bypass shortcut or preference-driven skip.
        if (!shouldGate(raw, get().preference)) {
          return Promise.resolve({ prompt: raw, usedEnhancement: false })
        }
        return new Promise<GateSubmission | null>((resolve) => {
          set({
            open: true,
            view: 'raw',
            raw,
            context,
            enhancement: null,
            resolver: resolve,
          })
        })
      },

      setEnhancement: (e) => set({ enhancement: e, view: 'enhanced' }),
      setView: (v) => set({ view: v }),

      acceptRaw: () => {
        const { resolver, raw } = get()
        resolver?.({ prompt: raw, usedEnhancement: false })
        set({ open: false, resolver: null })
      },

      acceptEnhanced: (finalPrompt) => {
        const { resolver } = get()
        resolver?.({ prompt: finalPrompt, usedEnhancement: true })
        set({ open: false, resolver: null })
      },

      cancel: () => {
        const { resolver } = get()
        resolver?.(null)
        set({ open: false, resolver: null })
      },
    }),
    {
      name: 'product-os-prompt-gate',
      partialize: (s) => ({ preference: s.preference }),
    },
  ),
)

/** Convenience hook for prompt entry points. */
export async function submitPromptThroughGate(
  raw: string,
  context: PromptContext,
): Promise<GateSubmission | null> {
  return usePromptGateStore.getState().openGate(raw, context)
}

/** Re-export for consumers who already have `openGate` from the store. */
export type { EntryPoint, PromptContext } from '@product-os/ai'
