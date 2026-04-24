'use client'

/**
 * R19 — Theme store & hook.
 *
 * Three themes: dark (default) / light / dark-hc.
 * The `data-theme` attribute on <html> drives every color token in
 * globals.css. We keep the source of truth here (+ localStorage)
 * and expose a tiny setTheme action for the topbar switcher.
 *
 * Flash-of-unstyled-theme is handled by an inline <script> in
 * app/layout.tsx that reads localStorage *before* React hydrates.
 * This hook just stays in sync once the client mounts.
 */

import { create } from 'zustand'
import { useEffect } from 'react'

export type Theme = 'dark' | 'light' | 'dark-hc'

const STORAGE_KEY = 'product-os-theme'
const VALID_THEMES: readonly Theme[] = ['dark', 'light', 'dark-hc'] as const

function isValidTheme(value: unknown): value is Theme {
  return typeof value === 'string' && VALID_THEMES.includes(value as Theme)
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (isValidTheme(raw)) return raw
  } catch {
    // localStorage blocked — fall through to default
  }
  return 'dark'
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Re-sync from <html data-theme> (used after hydration) */
  syncFromDom: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',

  setTheme: (theme) => {
    if (!isValidTheme(theme)) return
    set({ theme })
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, theme)
      } catch {
        // best-effort
      }
      // Cross-tab sync + any listener (Copilot, Inspector) that wants to redraw
      window.dispatchEvent(new CustomEvent('theme.changed', { detail: { theme } }))
    }
  },

  syncFromDom: () => {
    if (typeof document === 'undefined') return
    const attr = document.documentElement.getAttribute('data-theme')
    const stored = readStoredTheme()
    const next = isValidTheme(attr) ? attr : stored
    set({ theme: next })
  },
}))

/**
 * Convenience hook for consumers. Runs syncFromDom once after mount
 * so the store reflects whatever the pre-paint script applied.
 */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const syncFromDom = useThemeStore((s) => s.syncFromDom)

  useEffect(() => {
    syncFromDom()

    // Keep multiple tabs in sync
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return
      if (isValidTheme(e.newValue)) {
        useThemeStore.setState({ theme: e.newValue })
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', e.newValue)
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [syncFromDom])

  return { theme, setTheme }
}

/**
 * Plain function form for non-React callers (event handlers, Copilot skill
 * invocations, etc.). Mirrors setTheme without requiring a hook context.
 */
export function setThemeDirect(theme: Theme) {
  useThemeStore.getState().setTheme(theme)
}

export const THEME_OPTIONS: ReadonlyArray<{ value: Theme; label: string; description: string }> = [
  { value: 'light', label: 'Light', description: 'Bright surfaces for day' },
  { value: 'dark', label: 'Dark', description: 'Default editorial dark' },
  { value: 'dark-hc', label: 'High contrast', description: 'WCAG AAA, dark base' },
]
