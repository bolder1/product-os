'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import type { Awareness } from 'y-protocols/awareness'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollaborationUser {
  id: string
  name: string
  initials: string
  color: string
}

export interface PresenceState {
  user: CollaborationUser
  cursor?: { x: number; y: number }
  selectedNodeId?: string
  activeStudio?: string
  lastActive: number
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

export interface CollaborationState {
  doc: Y.Doc | null
  provider: WebsocketProvider | null
  awareness: Awareness | null
  status: ConnectionStatus
  peers: PresenceState[]
  localClientId: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const YJS_WS_URL = process.env.NEXT_PUBLIC_YJS_URL ?? 'ws://localhost:4000'

// R20: user-presence palette — each connected user gets a distinct color
// via hash for cursors/avatars in the collaboration layer. These are
// *functional* identity tints (distinguishing users in real time), not
// studio chrome, and intentionally span the full spectrum so N users in
// a room are visually separable. Left literal and eslint-disabled.
const COLORS = [
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#ef4444',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#f97316',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#eab308',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#22c55e',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#06b6d4',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#3b82f6',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#8b5cf6',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#ec4899',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#14b8a6',
  // eslint-disable-next-line no-hardcoded-hex -- presence palette
  '#f59e0b',
]

function pickColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash |= 0
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}

// ---------------------------------------------------------------------------
// Hook: useCollaboration
// ---------------------------------------------------------------------------

/**
 * Connects to a Yjs collaboration room via WebSocket.
 * Returns the shared Y.Doc, awareness, connection status, and peers list.
 *
 * @param roomName — typically `${orgSlug}:${productSlug}` or a product UUID
 * @param user — current user info for awareness
 */
export function useCollaboration(
  roomName: string | null,
  user: CollaborationUser | null
): CollaborationState {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [peers, setPeers] = useState<PresenceState[]>([])
  const [localClientId, setLocalClientId] = useState(0)

  const docRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)

  useEffect(() => {
    if (!roomName || !user) return

    const doc = new Y.Doc()
    const provider = new WebsocketProvider(YJS_WS_URL, roomName, doc, {
      connect: true,
      params: {},
    })

    docRef.current = doc
    providerRef.current = provider

    // Set awareness local state
    const awareness = provider.awareness
    setLocalClientId(awareness.clientID)

    awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      initials: user.initials,
      color: pickColor(user.id),
    })
    awareness.setLocalStateField('lastActive', Date.now())

    // Connection status
    provider.on('status', ({ status: s }: { status: string }) => {
      setStatus(s === 'connected' ? 'connected' : s === 'connecting' ? 'connecting' : 'disconnected')
    })

    // Track peers via awareness changes
    const updatePeers = () => {
      const states: PresenceState[] = []
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return
        if (state.user) {
          states.push({
            user: state.user as CollaborationUser,
            cursor: state.cursor as { x: number; y: number } | undefined,
            selectedNodeId: state.selectedNodeId as string | undefined,
            activeStudio: state.activeStudio as string | undefined,
            lastActive: (state.lastActive as number) ?? Date.now(),
          })
        }
      })
      setPeers(states)
    }

    awareness.on('change', updatePeers)
    updatePeers()

    // Heartbeat — keep lastActive fresh
    const heartbeat = setInterval(() => {
      awareness.setLocalStateField('lastActive', Date.now())
    }, 15000)

    return () => {
      clearInterval(heartbeat)
      awareness.off('change', updatePeers)
      provider.disconnect()
      provider.destroy()
      doc.destroy()
      docRef.current = null
      providerRef.current = null
      setStatus('disconnected')
      setPeers([])
    }
  }, [roomName, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    doc: docRef.current,
    provider: providerRef.current,
    awareness: providerRef.current?.awareness ?? null,
    status,
    peers,
    localClientId,
  }
}

// ---------------------------------------------------------------------------
// Hook: usePresence — update local awareness fields
// ---------------------------------------------------------------------------

export function usePresence(awareness: Awareness | null) {
  const setCursor = useCallback(
    (cursor: { x: number; y: number } | null) => {
      awareness?.setLocalStateField('cursor', cursor)
    },
    [awareness]
  )

  const setSelectedNode = useCallback(
    (nodeId: string | null) => {
      awareness?.setLocalStateField('selectedNodeId', nodeId)
    },
    [awareness]
  )

  const setActiveStudio = useCallback(
    (studio: string | null) => {
      awareness?.setLocalStateField('activeStudio', studio)
    },
    [awareness]
  )

  return { setCursor, setSelectedNode, setActiveStudio }
}

// ---------------------------------------------------------------------------
// Hook: useYMap — bind a Y.Map to React state
// ---------------------------------------------------------------------------

export function useYMap<T extends Record<string, unknown>>(
  doc: Y.Doc | null,
  mapName: string
): [T | null, (key: string, value: unknown) => void] {
  const [state, setState] = useState<T | null>(null)

  const yMapRef = useRef<Y.Map<unknown> | null>(null)

  useEffect(() => {
    if (!doc) return

    const yMap = doc.getMap(mapName)
    yMapRef.current = yMap

    const update = () => {
      const obj: Record<string, unknown> = {}
      yMap.forEach((value, key) => {
        obj[key] = value
      })
      setState(obj as T)
    }

    yMap.observe(update)
    update()

    return () => {
      yMap.unobserve(update)
      yMapRef.current = null
    }
  }, [doc, mapName])

  const set = useCallback((key: string, value: unknown) => {
    yMapRef.current?.set(key, value)
  }, [])

  return [state, set]
}

// ---------------------------------------------------------------------------
// Hook: useYArray — bind a Y.Array to React state
// ---------------------------------------------------------------------------

export function useYArray<T>(
  doc: Y.Doc | null,
  arrayName: string
): [T[], (item: T) => void, (index: number) => void] {
  const [state, setState] = useState<T[]>([])
  const yArrayRef = useRef<Y.Array<T> | null>(null)

  useEffect(() => {
    if (!doc) return

    const yArray = doc.getArray<T>(arrayName)
    yArrayRef.current = yArray

    const update = () => {
      setState(yArray.toArray())
    }

    yArray.observe(update)
    update()

    return () => {
      yArray.unobserve(update)
      yArrayRef.current = null
    }
  }, [doc, arrayName])

  const push = useCallback((item: T) => {
    yArrayRef.current?.push([item])
  }, [])

  const remove = useCallback((index: number) => {
    yArrayRef.current?.delete(index, 1)
  }, [])

  return [state, push, remove]
}
