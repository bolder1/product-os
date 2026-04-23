'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PlanStep = 'memory' | 'brief' | 'summary' | 'template' | 'team' | 'tasks' | 'done'

export interface MCQAnswer {
  building?: 'saas' | 'mobile' | 'marketing' | 'internal' | 'other'
  audience?: 'consumers' | 'smb' | 'enterprise' | 'internal'
  stage?: 'idea' | 'prototype' | 'beta' | 'production'
  vibe?: 'playful' | 'professional' | 'technical' | 'minimal' | 'bold'
  primaryColor?: string
  voice?: 'friendly' | 'authoritative' | 'casual' | 'witty' | 'neutral'
}

export interface AISummary {
  oneLiner: string
  targetUsers: string
  voiceAdjectives: string[]
  palette: string[] // 5 hex swatches
  features: Array<{ name: string; description: string; priority: 'must' | 'should' | 'nice' }>
}

export interface PlanModeState {
  sessionId: string | null
  productId: string | null
  step: PlanStep
  freeformBrief: string
  mcq: MCQAnswer
  summary: AISummary | null
  memoryAssetIds: string[]
  selectedTemplateId: string | null
  invitees: Array<{ email: string; role: string }>
  autopilotTasks: boolean
  skippedTaskIds: string[]

  setSession: (sessionId: string, productId: string) => void
  setStep: (step: PlanStep) => void
  setFreeform: (text: string) => void
  setMCQ: (patch: Partial<MCQAnswer>) => void
  setSummary: (summary: AISummary) => void
  patchSummary: (patch: Partial<AISummary>) => void
  addMemoryAsset: (id: string) => void
  removeMemoryAsset: (id: string) => void
  setTemplate: (id: string | null) => void
  addInvitee: (invitee: { email: string; role: string }) => void
  removeInvitee: (email: string) => void
  setAutopilot: (value: boolean) => void
  toggleSkippedTask: (taskId: string) => void
  reset: () => void
}

const initial: Omit<PlanModeState,
  'setSession' | 'setStep' | 'setFreeform' | 'setMCQ' | 'setSummary' | 'patchSummary'
  | 'addMemoryAsset' | 'removeMemoryAsset' | 'setTemplate' | 'addInvitee' | 'removeInvitee'
  | 'setAutopilot' | 'toggleSkippedTask' | 'reset'
> = {
  sessionId: null,
  productId: null,
  step: 'memory',
  freeformBrief: '',
  mcq: {},
  summary: null,
  memoryAssetIds: [],
  selectedTemplateId: null,
  invitees: [],
  autopilotTasks: true,
  skippedTaskIds: [],
}

export const usePlanModeStore = create<PlanModeState>()(
  persist(
    (set) => ({
      ...initial,
      setSession: (sessionId, productId) => set({ sessionId, productId }),
      setStep: (step) => set({ step }),
      setFreeform: (freeformBrief) => set({ freeformBrief }),
      setMCQ: (patch) => set((s) => ({ mcq: { ...s.mcq, ...patch } })),
      setSummary: (summary) => set({ summary }),
      patchSummary: (patch) =>
        set((s) => ({ summary: s.summary ? { ...s.summary, ...patch } : s.summary })),
      addMemoryAsset: (id) =>
        set((s) => ({ memoryAssetIds: Array.from(new Set([...s.memoryAssetIds, id])) })),
      removeMemoryAsset: (id) =>
        set((s) => ({ memoryAssetIds: s.memoryAssetIds.filter((a) => a !== id) })),
      setTemplate: (selectedTemplateId) => set({ selectedTemplateId }),
      addInvitee: (invitee) =>
        set((s) => ({
          invitees: [...s.invitees.filter((i) => i.email !== invitee.email), invitee],
        })),
      removeInvitee: (email) =>
        set((s) => ({ invitees: s.invitees.filter((i) => i.email !== email) })),
      setAutopilot: (autopilotTasks) => set({ autopilotTasks }),
      toggleSkippedTask: (taskId) =>
        set((s) => ({
          skippedTaskIds: s.skippedTaskIds.includes(taskId)
            ? s.skippedTaskIds.filter((id) => id !== taskId)
            : [...s.skippedTaskIds, taskId],
        })),
      reset: () => set({ ...initial }),
    }),
    { name: 'product-os-plan-mode' },
  ),
)
