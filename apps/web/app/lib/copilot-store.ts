'use client'

/**
 * R9 — Persistent Copilot store.
 *
 * A single conversational thread that follows the user across Modes,
 * studios, and Role switches. Messages persist to localStorage; the
 * panel toggles via `open` and is context-aware via `currentContext`
 * which the product layout updates on every studio change.
 *
 * Deliberately thin — actual model calls are routed through `aiRuntime`
 * and the Computer Mode store; this just holds the thread.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CopilotRole = 'user' | 'assistant' | 'system'

export interface CopilotMessage {
  id: string
  role: CopilotRole
  content: string
  createdAt: string
  /** Studio slug the message was sent from. */
  studio?: string
  /** Attached graph nodes or skill proposals referenced by the message. */
  refs?: Array<{ kind: 'node' | 'skill' | 'decision' | 'memory'; id: string; label?: string }>
  /** True when this message is the AI drafting a Computer Mode action pending approval. */
  pendingAction?: boolean
}

export interface CopilotContext {
  productId: string
  orgSlug: string
  productSlug: string
  studio: string
  selectedNodeId?: string
}

interface CopilotState {
  open: boolean
  width: number
  messages: CopilotMessage[]
  input: string
  currentContext: CopilotContext | null
  busy: boolean

  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
  setWidth: (w: number) => void
  setInput: (v: string) => void
  setContext: (ctx: CopilotContext | null) => void
  addMessage: (m: Omit<CopilotMessage, 'id' | 'createdAt'>) => string
  updateMessage: (id: string, patch: Partial<CopilotMessage>) => void
  clearThread: () => void
  setBusy: (v: boolean) => void
}

let counter = 0
function mkId(): string {
  counter += 1
  return `msg-${Date.now()}-${counter}`
}

export const useCopilotStore = create<CopilotState>()(
  persist(
    (set) => ({
      open: false,
      width: 380,
      messages: [],
      input: '',
      currentContext: null,
      busy: false,

      openPanel: () => set({ open: true }),
      closePanel: () => set({ open: false }),
      togglePanel: () => set((s) => ({ open: !s.open })),
      setWidth: (w) => set({ width: Math.max(320, Math.min(640, w)) }),
      setInput: (v) => set({ input: v }),
      setContext: (ctx) => set({ currentContext: ctx }),
      addMessage: (m) => {
        const id = mkId()
        const msg: CopilotMessage = { ...m, id, createdAt: new Date().toISOString() }
        set((s) => ({ messages: [...s.messages, msg] }))
        return id
      },
      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      clearThread: () => set({ messages: [] }),
      setBusy: (v) => set({ busy: v }),
    }),
    {
      name: 'product-os-copilot',
      partialize: (s) => ({
        messages: s.messages.slice(-100),
        width: s.width,
      }),
    },
  ),
)
