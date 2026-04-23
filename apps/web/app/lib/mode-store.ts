'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ModeKey } from './mode-config'

interface ModeStoreState {
  /** User's last-selected Mode (used when the URL does not imply one). */
  currentMode: ModeKey
  setCurrentMode: (mode: ModeKey) => void
}

export const useModeStore = create<ModeStoreState>()(
  persist(
    (set) => ({
      currentMode: 'plan',
      setCurrentMode: (mode) => set({ currentMode: mode }),
    }),
    {
      name: 'product-os-mode',
      partialize: (s) => ({ currentMode: s.currentMode }),
    }
  )
)
