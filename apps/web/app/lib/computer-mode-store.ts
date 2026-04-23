'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ComputerMode = 'suggest' | 'assist' | 'auto'

export type ActionStatus =
  | 'pending'     // waiting for user confirmation (assist mode)
  | 'running'     // currently executing
  | 'done'        // completed successfully
  | 'rejected'    // user declined
  | 'failed'      // execution error

export type ActionKind =
  | 'suggest'     // AI surfaces suggestions, no mutation
  | 'scaffold'    // AI creates draft graph nodes (needs confirm in assist)
  | 'analyze'     // AI reads graph, produces insights
  | 'create_task' // AI creates a task node
  | 'update_node' // AI patches an existing graph node
  | 'run_plan'    // AI executes a multi-step plan

export interface ActionEntry {
  id: string
  timestamp: string
  kind: ActionKind
  label: string                       // Human-readable summary ("Scaffold onboarding module")
  detail?: string                     // Longer explanation
  status: ActionStatus
  studio?: string                     // originating studio
  productId?: string
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  confirmRequired: boolean            // true in assist mode for mutations
}

export interface ExecutionPlan {
  id: string
  goal: string                        // "Fix onboarding drop-off"
  steps: Array<{
    order: number
    kind: ActionKind
    label: string
    status: 'pending' | 'running' | 'done' | 'skipped'
  }>
  currentStep: number
  status: 'planning' | 'running' | 'paused' | 'done' | 'aborted'
  createdAt: string
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

interface ComputerModeState {
  mode: ComputerMode
  isOpen: boolean
  actionLog: ActionEntry[]
  pendingActions: ActionEntry[]       // subset of log awaiting confirmation
  activePlan: ExecutionPlan | null
  commandInput: string

  /* UI actions */
  setMode: (m: ComputerMode) => void
  open: () => void
  close: () => void
  setCommandInput: (v: string) => void

  /* Log management */
  addAction: (entry: Omit<ActionEntry, 'id' | 'timestamp'>) => string
  updateAction: (id: string, patch: Partial<ActionEntry>) => void
  confirmAction: (id: string) => void
  rejectAction: (id: string) => void
  clearLog: () => void

  /* Plan management */
  startPlan: (goal: string, steps: Omit<ExecutionPlan['steps'][number], 'status'>[]) => string
  advancePlan: (planId: string) => void
  abortPlan: (planId: string) => void
}

export const useComputerModeStore = create<ComputerModeState>()(
  persist(
    (set, get) => ({
      mode: 'suggest',
      isOpen: false,
      actionLog: [],
      pendingActions: [],
      activePlan: null,
      commandInput: '',

      setMode: (m) => set({ mode: m }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setCommandInput: (v) => set({ commandInput: v }),

      addAction: (entry) => {
        const id = `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const timestamp = new Date().toISOString()
        const full: ActionEntry = { id, timestamp, ...entry }
        const isPending = entry.status === 'pending' && entry.confirmRequired
        set((s) => ({
          actionLog: [full, ...s.actionLog].slice(0, 200), // cap at 200
          pendingActions: isPending
            ? [full, ...s.pendingActions]
            : s.pendingActions,
        }))
        return id
      },

      updateAction: (id, patch) =>
        set((s) => ({
          actionLog: s.actionLog.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
          pendingActions: s.pendingActions
            .map((a) => (a.id === id ? { ...a, ...patch } : a))
            .filter((a) => a.status === 'pending'),
        })),

      confirmAction: (id) => {
        set((s) => ({
          actionLog: s.actionLog.map((a) =>
            a.id === id ? { ...a, status: 'running' as ActionStatus } : a,
          ),
          pendingActions: s.pendingActions.filter((a) => a.id !== id),
        }))
      },

      rejectAction: (id) => {
        set((s) => ({
          actionLog: s.actionLog.map((a) =>
            a.id === id ? { ...a, status: 'rejected' as ActionStatus } : a,
          ),
          pendingActions: s.pendingActions.filter((a) => a.id !== id),
        }))
      },

      clearLog: () => set({ actionLog: [], pendingActions: [] }),

      startPlan: (goal, steps) => {
        const id = `plan-${Date.now()}`
        const plan: ExecutionPlan = {
          id,
          goal,
          steps: steps.map((s, i) => ({ ...s, order: i, status: 'pending' })),
          currentStep: 0,
          status: 'planning',
          createdAt: new Date().toISOString(),
        }
        set({ activePlan: plan })
        return id
      },

      advancePlan: (planId) =>
        set((s) => {
          if (!s.activePlan || s.activePlan.id !== planId) return {}
          const plan = s.activePlan
          const nextStep = plan.currentStep + 1
          if (nextStep >= plan.steps.length) {
            return {
              activePlan: {
                ...plan,
                status: 'done',
                steps: plan.steps.map((st, i) =>
                  i === plan.currentStep ? { ...st, status: 'done' } : st,
                ),
              },
            }
          }
          return {
            activePlan: {
              ...plan,
              status: 'running',
              currentStep: nextStep,
              steps: plan.steps.map((st, i) => {
                if (i === plan.currentStep) return { ...st, status: 'done' }
                if (i === nextStep) return { ...st, status: 'running' }
                return st
              }),
            },
          }
        }),

      abortPlan: (planId) =>
        set((s) => {
          if (!s.activePlan || s.activePlan.id !== planId) return {}
          return { activePlan: { ...s.activePlan, status: 'aborted' } }
        }),
    }),
    {
      name: 'product-os-computer-mode',
      partialize: (s) => ({ mode: s.mode, actionLog: s.actionLog.slice(0, 50) }),
    },
  ),
)
