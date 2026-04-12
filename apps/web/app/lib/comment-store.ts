'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trpcMutate } from './api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Comment {
  id: string
  entityId: string
  entityType: string
  productId: string
  studio: string
  body: string
  authorId: string
  authorName: string
  authorInitials: string
  parentId?: string
  resolved: boolean
  resolvedBy?: string
  createdAt: string
  updatedAt: string
  mentions: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract @username patterns from body text */
export function parseMentions(body: string): string[] {
  const regex = /@(\w+)/g
  const mentions: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(body)) !== null) {
    if (!mentions.includes(match[1])) {
      mentions.push(match[1])
    }
  }
  return mentions
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface CommentState {
  comments: Comment[]

  addComment: (
    data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'resolved' | 'mentions'>
  ) => Comment
  editComment: (id: string, body: string) => void
  deleteComment: (id: string) => void
  resolveComment: (id: string, resolvedBy: string) => void
  getCommentsByEntity: (entityId: string) => Comment[]
  getCommentsByProduct: (productId: string) => Comment[]
  getThreadReplies: (parentId: string) => Comment[]
  getUnresolvedCount: (entityId: string) => number
}

let commentCounter = 0

export const useCommentStore = create<CommentState>()(
  persist(
    (set, get) => ({
      comments: [],

      addComment: (data) => {
        commentCounter += 1
        const now = new Date().toISOString()
        const mentions = parseMentions(data.body)
        const tempId = `cmt-${Date.now()}-${commentCounter}`
        const comment: Comment = {
          ...data,
          id: tempId,
          createdAt: now,
          updatedAt: now,
          resolved: false,
          mentions,
        }
        set((state) => ({
          comments: [...state.comments, comment],
        }))

        // Persist to DB
        trpcMutate<{ id: string }>('comment.create', {
          productId: data.productId,
          nodeId: data.entityId,
          body: data.body,
          parentId: data.parentId,
        }).then((result) => {
          if (result?.id) {
            set((state) => ({
              comments: state.comments.map((c) => (c.id === tempId ? { ...c, id: result.id } : c)),
            }))
          }
        }).catch(() => {})

        return comment
      },

      editComment: (id, body) => {
        const mentions = parseMentions(body)
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === id
              ? { ...c, body, mentions, updatedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      deleteComment: (id) => {
        set((state) => ({
          // Delete the comment and all its replies
          comments: state.comments.filter(
            (c) => c.id !== id && c.parentId !== id
          ),
        }))
      },

      resolveComment: (id, resolvedBy) => {
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === id
              ? { ...c, resolved: true, resolvedBy, updatedAt: new Date().toISOString() }
              : c
          ),
        }))

        // Persist to DB
        trpcMutate('comment.resolve', { id }).catch(() => {})
      },

      getCommentsByEntity: (entityId) =>
        get().comments.filter(
          (c) => c.entityId === entityId && !c.parentId
        ),

      getCommentsByProduct: (productId) =>
        get().comments.filter((c) => c.productId === productId),

      getThreadReplies: (parentId) =>
        get()
          .comments.filter((c) => c.parentId === parentId)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),

      getUnresolvedCount: (entityId) =>
        get().comments.filter(
          (c) => c.entityId === entityId && !c.resolved && !c.parentId
        ).length,
    }),
    {
      name: 'product-os-comments',
    }
  )
)
