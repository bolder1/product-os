'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trpcMutate } from './api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType =
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'approval_requested'
  | 'approval_decided'
  | 'comment_added'
  | 'product_created'
  | 'plan_created'
  | 'brand_updated'
  | 'component_created'
  | 'page_published'
  | 'release_created'
  | 'workflow_updated'
  | 'design_updated'
  | 'template_applied'
  | 'ai_skill_used'
  | 'member_joined'
  | 'settings_updated'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  actor: { id: string; name: string; initials: string }
  productId?: string
  studio?: string
  entityId?: string
  entityType?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ActivityState {
  activities: Activity[]

  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => Activity
  getActivitiesByProduct: (productId: string, limit?: number) => Activity[]
  getRecentActivities: (limit?: number) => Activity[]
  getActivitiesByStudio: (productId: string, studio: string, limit?: number) => Activity[]
  clearActivities: (productId?: string) => void
}

let activityCounter = 0

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],

      addActivity: (data) => {
        activityCounter += 1
        const tempId = `act-${Date.now()}-${activityCounter}`
        const activity: Activity = {
          ...data,
          id: tempId,
          timestamp: new Date().toISOString(),
        }
        set((state) => ({
          activities: [activity, ...state.activities].slice(0, 500),
        }))

        // Persist to DB (fire-and-forget)
        if (data.productId) {
          trpcMutate<{ id: string }>('activity.create', {
            productId: data.productId,
            action: `${data.type}: ${data.title}`,
            entityType: data.entityType ?? data.type,
            entityId: data.entityId,
            studioOrigin: data.studio,
          }).then((result) => {
            if (result?.id) {
              set((state) => ({
                activities: state.activities.map((a) => (a.id === tempId ? { ...a, id: result.id } : a)),
              }))
            }
          }).catch(() => {})
        }

        return activity
      },

      getActivitiesByProduct: (productId, limit = 50) =>
        get()
          .activities.filter((a) => a.productId === productId)
          .slice(0, limit),

      getRecentActivities: (limit = 20) =>
        get().activities.slice(0, limit),

      getActivitiesByStudio: (productId, studio, limit = 20) =>
        get()
          .activities.filter(
            (a) => a.productId === productId && a.studio === studio
          )
          .slice(0, limit),

      clearActivities: (productId) => {
        if (productId) {
          set((state) => ({
            activities: state.activities.filter((a) => a.productId !== productId),
          }))
        } else {
          set({ activities: [] })
        }
      },
    }),
    {
      name: 'product-os-activity',
    }
  )
)
