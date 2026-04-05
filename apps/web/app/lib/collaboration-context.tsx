'use client'

import { createContext, useContext, type ReactNode } from 'react'
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

export function CollaborationProvider({ roomName, children }: CollaborationProviderProps) {
  const { user } = useAuthStore()

  const collabUser: CollaborationUser | null = user
    ? {
        id: user.id,
        name: user.name,
        initials: user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        color: '#3b82f6',
      }
    : null

  const collab = useCollaboration(roomName, collabUser)
  const presence = usePresence(collab.awareness)

  return (
    <CollaborationContext.Provider value={{ ...collab, ...presence }}>
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
