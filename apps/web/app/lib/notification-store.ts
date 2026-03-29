'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'approval_required'
  | 'approval_decided'
  | 'comment_mention'
  | 'comment_reply'
  | 'release_ready'
  | 'deadline_approaching'
  | 'access_granted'
  | 'access_requested'
  | 'plan_ready'
  | 'ai_suggestion'
  | 'system'

export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  priority: NotificationPriority
  read: boolean
  actionUrl?: string
  actor?: { id: string; name: string; initials: string }
  productId?: string
  studio?: string
  timestamp: string
  expiresAt?: string
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface NotificationState {
  notifications: Notification[]
  unreadCount: number

  addNotification: (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Notification
  markRead: (id: string) => void
  markAllRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  getByProduct: (productId: string) => Notification[]
  getUnread: () => Notification[]
}

let notifCounter = 0

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (data) => {
        notifCounter += 1
        const notif: Notification = {
          ...data,
          id: `notif-${Date.now()}-${notifCounter}`,
          timestamp: new Date().toISOString(),
          read: false,
        }
        set((state) => ({
          notifications: [notif, ...state.notifications].slice(0, 200),
          unreadCount: state.unreadCount + 1,
        }))
        return notif
      },

      markRead: (id) => {
        const notif = get().notifications.find((n) => n.id === id)
        if (notif && !notif.read) {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }))
        }
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      deleteNotification: (id) => {
        const notif = get().notifications.find((n) => n.id === id)
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: notif && !notif.read
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        }))
      },

      clearAll: () => set({ notifications: [], unreadCount: 0 }),

      getByProduct: (productId) =>
        get().notifications.filter((n) => n.productId === productId),

      getUnread: () =>
        get().notifications.filter((n) => !n.read),
    }),
    {
      name: 'product-os-notifications',
    }
  )
)
