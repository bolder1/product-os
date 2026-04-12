'use client'

import { create } from 'zustand'
import { trpcMutate, trpcQuery } from './api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DbRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'guest'

export interface Member {
  id: string
  userId: string
  orgId: string
  role: DbRole
  email: string
  name: string
  avatarUrl: string | null
  invitedAt: string | null
  acceptedAt: string | null
  createdAt: string
}

interface MemberState {
  members: Member[]
  isLoading: boolean
  error: string | null

  hydrate: (orgId?: string) => Promise<void>
  invite: (email: string, role: DbRole, orgId?: string) => Promise<void>
  updateRole: (membershipId: string, role: DbRole) => Promise<void>
  remove: (membershipId: string) => Promise<void>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(row: Record<string, unknown>): Member {
  const toIso = (v: unknown): string | null => {
    if (!v) return null
    if (v instanceof Date) return v.toISOString()
    return String(v)
  }
  return {
    id: String(row.id),
    userId: String(row.userId),
    orgId: String(row.orgId),
    role: row.role as DbRole,
    email: String(row.email),
    name: String(row.name),
    avatarUrl: row.avatarUrl ? String(row.avatarUrl) : null,
    invitedAt: toIso(row.invitedAt),
    acceptedAt: toIso(row.acceptedAt),
    createdAt: toIso(row.createdAt) ?? new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  isLoading: false,
  error: null,

  hydrate: async (orgId) => {
    set({ isLoading: true, error: null })
    try {
      const rows = await trpcQuery<Record<string, unknown>[]>('member.list', orgId ? { orgId } : {})
      set({ members: (rows ?? []).map(normalize), isLoading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load members', isLoading: false })
    }
  },

  invite: async (email, role, orgId) => {
    try {
      const created = await trpcMutate<Record<string, unknown>>('member.invite', { email, role, orgId })
      // Re-hydrate to pick up the joined user fields
      await get().hydrate(orgId)
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to invite member' })
      throw e
    }
  },

  updateRole: async (membershipId, role) => {
    set((s) => ({
      members: s.members.map((m) => (m.id === membershipId ? { ...m, role } : m)),
    }))
    try {
      await trpcMutate('member.updateRole', { membershipId, role })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to update role' })
      throw e
    }
  },

  remove: async (membershipId) => {
    const prev = get().members
    set({ members: prev.filter((m) => m.id !== membershipId) })
    try {
      await trpcMutate('member.remove', { membershipId })
    } catch (e) {
      // Roll back on failure
      set({ members: prev, error: e instanceof Error ? e.message : 'Failed to remove member' })
      throw e
    }
  },
}))
