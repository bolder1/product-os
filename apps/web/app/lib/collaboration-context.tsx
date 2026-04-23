'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import {
  useCollaboration,
  usePresence,
  type CollaborationState,
  type CollaborationUser,
} from './use-collaboration'
import { useAuthStore } from './auth-store'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface CollaborationContextValue extends CollaborationState {
  setCursor: (cursor: { x: number; y: number } | null) => void
  setSelectedNode: (nodeId: string | null) => void
  setActiveStudio: (studio: string | null) => void
}

const CollaborationContext = createContext<CollaborationContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface CollaborationProviderProps {
  roomName: string | null
  children: ReactNode
}

// Deterministic per-user color from their ID
function pickUserColor(userId: string): string {
  const colors = ['#6398ff', '#3dd68c', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef5350', '#a78bfa']
  let hash = 0
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  return colors[hash % colors.length]
}

export function CollaborationProvider({ roomName, children }: CollaborationProviderProps) {
  // Use targeted selectors to avoid re-rendering on every store mutation
  const userId = useAuthStore((s) => s.user?.id)
  const userName = useAuthStore((s) => s.user?.name)
  const userRole = useAuthStore((s) => s.user?.role)

  const collabUser: CollaborationUser | null = userId && userName
    ? {
        id: userId,
        name: userName,
        initials: userName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        color: pickUserColor(userId),
      }
    : null

  // Silence unused-var lint for role (kept as dep for future use)
  void userRole

  const collab = useCollaboration(roomName, collabUser)
  const presence = usePresence(collab.awareness)

  // Memoize context value so consumers don't re-render on every CollaborationProvider render
  const contextValue = useMemo(
    () => ({ ...collab, ...presence }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collab.status, collab.peers, collab.doc, collab.provider, collab.awareness, collab.localClientId,
     presence.setCursor, presence.setSelectedNode, presence.setActiveStudio]
  )

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCollaborationContext() {
  const ctx = useContext(CollaborationContext)
  if (!ctx) {
    // Return a no-op fallback outside the provider
    return {
      doc: null,
      provider: null,
      awareness: null,
      status: 'disconnected' as const,
      peers: [],
      localClientId: 0,
      setCursor: () => {},
      setSelectedNode: () => {},
      setActiveStudio: () => {},
    }
  }
  return ctx
}
