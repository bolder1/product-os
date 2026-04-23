'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TonePair {
  axis: string // "formal↔casual"
  value: number // 0..100
}

export interface SamplePhrase {
  context: string // "welcome email" | "error message"
  text: string
}

export interface BrandVoice {
  personality: string[] // 3 adjectives
  tonePairs: TonePair[]
  dos: string[]
  donts: string[]
  samplePhrases: SamplePhrase[]
  forbiddenWords: string[]
  version: number
  updatedAt: string
}

const DEFAULT_VOICE: BrandVoice = {
  personality: ['Clear', 'Confident', 'Human'],
  tonePairs: [
    { axis: 'formal↔casual', value: 50 },
    { axis: 'serious↔playful', value: 50 },
    { axis: 'reserved↔bold', value: 50 },
    { axis: 'technical↔plain', value: 50 },
  ],
  dos: ['Lead with outcomes', 'Use short sentences', 'Prefer verbs over nouns'],
  donts: ['Avoid jargon without explanation', 'Don’t use all-caps for emphasis', 'Never talk down to users'],
  samplePhrases: [
    { context: 'welcome', text: 'Welcome. Let’s get you set up in about a minute.' },
    { context: 'error', text: 'Something went wrong — here’s what to try next.' },
  ],
  forbiddenWords: [],
  version: 1,
  updatedAt: new Date().toISOString(),
}

interface VoiceState {
  byProduct: Record<string, BrandVoice>
  setVoice: (productId: string, voice: BrandVoice) => void
  patchVoice: (productId: string, patch: Partial<BrandVoice>) => void
  getVoice: (productId: string) => BrandVoice
}

export const useBrandVoiceStore = create<VoiceState>()(
  persist(
    (set, get) => ({
      byProduct: {},
      setVoice: (productId, voice) =>
        set((s) => ({
          byProduct: {
            ...s.byProduct,
            [productId]: { ...voice, version: (s.byProduct[productId]?.version ?? 0) + 1, updatedAt: new Date().toISOString() },
          },
        })),
      patchVoice: (productId, patch) =>
        set((s) => {
          const prev = s.byProduct[productId] ?? DEFAULT_VOICE
          return {
            byProduct: {
              ...s.byProduct,
              [productId]: {
                ...prev,
                ...patch,
                version: prev.version + 1,
                updatedAt: new Date().toISOString(),
              },
            },
          }
        }),
      getVoice: (productId) => get().byProduct[productId] ?? DEFAULT_VOICE,
    }),
    { name: 'product-os-brand-voice' },
  ),
)

export { DEFAULT_VOICE }
