'use client'

import { useEffect, useRef, useCallback } from 'react'
import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Client-side Event Bridge
// ---------------------------------------------------------------------------
// A lightweight pub/sub system for cross-studio reactivity on the client.
// Bridges events between Zustand stores without circular dependencies.
//
// Usage:
//   // In Brand Builder — emit when tokens change
//   const emit = useEventBridge()
//   emit('brand.tokens.changed', { productId })
//
//   // In Component Builder — listen for token changes
//   useEventListener('brand.tokens.changed', (data) => {
//     // refresh token bindings
//   })
// ---------------------------------------------------------------------------

export type ClientEventType =
  | 'brand.tokens.changed'
  | 'component.updated'
  | 'graph.node.changed'
  | 'task.status.changed'
  | 'approval.decided'
  | 'notification.received'

export interface ClientEvent {
  type: ClientEventType
  productId?: string
  data?: Record<string, unknown>
  timestamp: number
}

type Listener = (event: ClientEvent) => void

// ---------------------------------------------------------------------------
// Event bridge store — tracks last event for each type + listener registry
// ---------------------------------------------------------------------------

interface EventBridgeState {
  lastEvents: Partial<Record<ClientEventType, ClientEvent>>
  listeners: Map<ClientEventType, Set<Listener>>
  emit: (type: ClientEventType, data?: { productId?: string; data?: Record<string, unknown> }) => void
  on: (type: ClientEventType, listener: Listener) => () => void
}

export const useEventBridgeStore = create<EventBridgeState>()((set, get) => ({
  lastEvents: {},
  listeners: new Map(),

  emit: (type, opts) => {
    const event: ClientEvent = {
      type,
      productId: opts?.productId,
      data: opts?.data,
      timestamp: Date.now(),
    }

    // Update last event
    set((s) => ({
      lastEvents: { ...s.lastEvents, [type]: event },
    }))

    // Notify listeners
    const listeners = get().listeners.get(type)
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event)
        } catch (err) {
          console.error(`[EventBridge] Listener error for ${type}:`, err)
        }
      }
    }
  },

  on: (type, listener) => {
    const { listeners } = get()
    if (!listeners.has(type)) {
      listeners.set(type, new Set())
    }
    listeners.get(type)!.add(listener)

    // Return unsubscribe function
    return () => {
      listeners.get(type)?.delete(listener)
    }
  },
}))

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Returns the emit function for firing client-side events.
 */
export function useEventBridge() {
  return useEventBridgeStore((s) => s.emit)
}

/**
 * Listen for a specific client-side event type.
 * Automatically unsubscribes on unmount.
 */
export function useEventListener(
  type: ClientEventType,
  handler: (event: ClientEvent) => void,
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  const on = useEventBridgeStore((s) => s.on)

  useEffect(() => {
    const unsubscribe = on(type, (event) => {
      handlerRef.current(event)
    })
    return unsubscribe
  }, [type, on])
}

/**
 * Returns the last event of a given type (useful for polling-style reads).
 */
export function useLastEvent(type: ClientEventType): ClientEvent | undefined {
  return useEventBridgeStore((s) => s.lastEvents[type])
}
