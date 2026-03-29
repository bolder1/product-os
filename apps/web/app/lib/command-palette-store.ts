'use client'

import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Recent items (persisted to localStorage)
// ---------------------------------------------------------------------------

export interface RecentItem {
  id: string
  label: string
  description?: string
  href: string
  icon?: string
  timestamp: number
}

const RECENT_KEY = 'product-os-recent-pages'
const MAX_RECENT = 5

function loadRecent(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? (JSON.parse(raw) as RecentItem[]) : []
  } catch {
    return []
  }
}

function saveRecent(items: RecentItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items))
  } catch {
    // ignore quota errors
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface CommandPaletteState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void

  recentItems: RecentItem[]
  addRecentItem: (item: Omit<RecentItem, 'timestamp'>) => void
  loadRecentItems: () => void
}

export const useCommandPaletteStore = create<CommandPaletteState>()((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  recentItems: [],

  addRecentItem: (item) => {
    const existing = get().recentItems.filter((r) => r.id !== item.id)
    const updated = [{ ...item, timestamp: Date.now() }, ...existing].slice(0, MAX_RECENT)
    set({ recentItems: updated })
    saveRecent(updated)
  },

  loadRecentItems: () => {
    set({ recentItems: loadRecent() })
  },
}))
