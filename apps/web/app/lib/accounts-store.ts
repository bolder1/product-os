'use client'

/**
 * Manages a list of saved accounts in localStorage so users can switch
 * between sessions without fully logging out — similar to Google's account switcher.
 */

export interface SavedAccount {
  token: string
  orgId: string
  user: {
    id: string
    name: string
    email: string
    role: string
    orgId: string
    orgName: string
    orgSlug: string
    avatar?: string
  }
  savedAt: string
}

const KEY = 'product-os-saved-accounts'
const MAX_ACCOUNTS = 5

export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveAccount(account: SavedAccount): void {
  if (typeof window === 'undefined') return
  // De-dupe by user id — always keep the freshest entry at index 0
  const accounts = getSavedAccounts().filter((a) => a.user.id !== account.user.id)
  accounts.unshift(account)
  localStorage.setItem(KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)))
}

export function removeAccount(userId: string): void {
  if (typeof window === 'undefined') return
  const accounts = getSavedAccounts().filter((a) => a.user.id !== userId)
  localStorage.setItem(KEY, JSON.stringify(accounts))
}

export function updateCurrentAccountSnapshot(): void {
  if (typeof window === 'undefined') return
  const token = localStorage.getItem('product-os-session-token')
  const orgId = localStorage.getItem('product-os-org-id')
  if (!token || !orgId) return

  // The caller (auth-store) fills in the user snapshot after calling this
  // — we only touch the token/orgId sync here.
}
