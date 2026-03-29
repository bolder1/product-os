'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type ApprovalType = 'release' | 'design' | 'workflow' | 'page' | 'component' | 'general'

export interface ApprovalStep {
  id: string
  label: string
  approverRole: string
  approverId?: string
  approverName?: string
  status: ApprovalStatus
  decidedAt?: string
  comment?: string
  order: number
}

export interface ApprovalRequest {
  id: string
  title: string
  description?: string
  type: ApprovalType
  productId: string
  studio: string
  entityId?: string
  entityLabel?: string
  requestedBy: { id: string; name: string; initials: string }
  steps: ApprovalStep[]
  currentStepIndex: number
  status: ApprovalStatus
  createdAt: string
  updatedAt: string
  completedAt?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  tags?: string[]
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface ApprovalState {
  requests: ApprovalRequest[]

  createRequest: (data: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentStepIndex'>) => ApprovalRequest
  decideStep: (requestId: string, stepId: string, decision: 'approved' | 'rejected', comment?: string, approverName?: string) => void
  cancelRequest: (requestId: string) => void
  getRequestsByProduct: (productId: string) => ApprovalRequest[]
  getPendingByRole: (productId: string, role: string) => ApprovalRequest[]
  getRequestsByStudio: (productId: string, studio: string) => ApprovalRequest[]
  getPendingCount: (productId: string) => number
}

let approvalCounter = 0

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      requests: [],

      createRequest: (data) => {
        approvalCounter += 1
        const now = new Date().toISOString()
        const request: ApprovalRequest = {
          ...data,
          id: `apr-${Date.now()}-${approvalCounter}`,
          status: 'pending',
          currentStepIndex: 0,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ requests: [...state.requests, request] }))
        return request
      },

      decideStep: (requestId, stepId, decision, comment, approverName) => {
        set((state) => ({
          requests: state.requests.map((req) => {
            if (req.id !== requestId) return req

            const updatedSteps = req.steps.map((step) => {
              if (step.id !== stepId) return step
              return {
                ...step,
                status: decision,
                decidedAt: new Date().toISOString(),
                comment,
                approverName: approverName || step.approverName,
              }
            })

            // Determine overall status
            const currentStep = updatedSteps.find((s) => s.id === stepId)
            let newStatus = req.status
            let newStepIndex = req.currentStepIndex
            let completedAt = req.completedAt

            if (decision === 'rejected') {
              newStatus = 'rejected'
              completedAt = new Date().toISOString()
            } else if (decision === 'approved') {
              // Check if there are more steps
              const nextPending = updatedSteps.find(
                (s, i) => i > req.currentStepIndex && s.status === 'pending'
              )
              if (nextPending) {
                newStepIndex = updatedSteps.indexOf(nextPending)
              } else {
                // All steps approved
                newStatus = 'approved'
                completedAt = new Date().toISOString()
              }
            }

            return {
              ...req,
              steps: updatedSteps,
              status: newStatus,
              currentStepIndex: newStepIndex,
              updatedAt: new Date().toISOString(),
              completedAt,
            }
          }),
        }))
      },

      cancelRequest: (requestId) => {
        set((state) => ({
          requests: state.requests.map((req) =>
            req.id === requestId
              ? { ...req, status: 'cancelled' as ApprovalStatus, updatedAt: new Date().toISOString(), completedAt: new Date().toISOString() }
              : req
          ),
        }))
      },

      getRequestsByProduct: (productId) =>
        get().requests.filter((r) => r.productId === productId),

      getPendingByRole: (productId, role) =>
        get().requests.filter(
          (r) =>
            r.productId === productId &&
            r.status === 'pending' &&
            r.steps[r.currentStepIndex]?.approverRole === role
        ),

      getRequestsByStudio: (productId, studio) =>
        get().requests.filter((r) => r.productId === productId && r.studio === studio),

      getPendingCount: (productId) =>
        get().requests.filter((r) => r.productId === productId && r.status === 'pending').length,
    }),
    {
      name: 'product-os-approvals',
    }
  )
)
