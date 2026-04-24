'use client'

import { useEffect, useRef } from 'react'
import { trpc } from './trpc'
import { useAuthStore } from './auth-store'
import { useProductStore } from './product-store'
import { useGraphStore } from './graph-store'
import { useTaskStore } from './task-store'
import { useNotificationStore } from './notification-store'
import { useActivityStore } from './activity-store'
import { useApprovalStore } from './approval-store'
import { useCommentStore } from './comment-store'
import { useDecisionStore } from './decision-store'

/**
 * Hydrates all Zustand stores from the real database via tRPC.
 * Call this once in the product layout so data flows from DB → stores → components.
 * Mutations still go through stores (local optimistic) for now.
 */
export function useDataSync(productId: string | undefined) {
  const user = useAuthStore((s) => s.user)
  const synced = useRef(false)

  // --- Products ---
  // product.list only needs the user to be authenticated — it doesn't need a productId.
  // Fetching this unconditionally lets the product layout resolve a product when
  // navigating directly to /{orgSlug}/{productSlug} without visiting the dashboard home first.
  const productsQuery = trpc.product.list.useQuery(
    {},
    { enabled: !!user },
  )

  useEffect(() => {
    if (!productsQuery.data || !user) return
    const store = useProductStore.getState()
    // Replace store products with real DB data
    const resolvedOrgSlug =
      user.orgSlug ||
      user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
      'my-org'

    const dbProducts = productsQuery.data.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      slug: p.slug,
      orgSlug: resolvedOrgSlug,
      color: 'var(--accent)',
      icon: p.icon ?? '🚀',
      status: p.status as 'draft' | 'active' | 'archived',
      createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
      updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    }))
    useProductStore.setState({ products: dbProducts })
  }, [productsQuery.data, user])

  // --- Graph nodes & edges ---
  const nodesQuery = trpc.graph.getNodes.useQuery(
    { productId: productId! },
    { enabled: !!user && !!productId },
  )

  const edgesQuery = trpc.graph.getEdges.useQuery(
    { productId: productId! },
    { enabled: !!user && !!productId },
  )

  useEffect(() => {
    if (!nodesQuery.data) return
    const dbNodes = nodesQuery.data.map((n: any) => ({
      id: n.id,
      kind: n.kind,
      label: n.label,
      productId: n.productId,
      data: n.data ?? {},
      createdAt: n.createdAt?.toISOString?.() ?? n.createdAt,
      updatedAt: n.updatedAt?.toISOString?.() ?? n.updatedAt,
    }))
    useGraphStore.setState((s) => ({
      nodes: [
        ...s.nodes.filter((n) => n.productId !== productId),
        ...dbNodes,
      ],
    }))
  }, [nodesQuery.data, productId])

  useEffect(() => {
    if (!edgesQuery.data) return
    const dbEdges = edgesQuery.data.map((e: any) => ({
      id: e.id,
      kind: e.kind,
      sourceId: e.sourceId,
      targetId: e.targetId,
      productId: e.productId,
      data: e.data ?? {},
      createdAt: e.createdAt?.toISOString?.() ?? e.createdAt,
    }))
    useGraphStore.setState((s) => ({
      edges: [
        ...s.edges.filter((e) => e.productId !== productId),
        ...dbEdges,
      ],
    }))
  }, [edgesQuery.data, productId])

  // --- Tasks ---
  const tasksQuery = trpc.task.list.useQuery(
    { productId: productId! },
    { enabled: !!user && !!productId },
  )

  useEffect(() => {
    if (!tasksQuery.data || !user) return
    const dbTasks = tasksQuery.data.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      status: t.status === 'review' ? 'in_review' : t.status,
      priority: t.priority === 'urgent' ? 'critical' : t.priority,
      assignee: t.assigneeId
        ? { id: t.assigneeId, name: user.name, initials: user.name.slice(0, 2).toUpperCase(), role: user.role }
        : { id: '', name: 'Unassigned', initials: 'UA', role: 'viewer' },
      dueDate: t.dueAt?.toISOString?.() ?? t.dueAt ?? '',
      studio: t.studioOrigin ?? 'planner',
      productId: t.productId,
      tags: [],
      createdAt: t.createdAt?.toISOString?.() ?? t.createdAt,
      updatedAt: t.updatedAt?.toISOString?.() ?? t.updatedAt,
    }))
    useTaskStore.setState((s) => ({
      tasks: [
        ...s.tasks.filter((t) => t.productId !== productId),
        ...dbTasks,
      ],
    }))
  }, [tasksQuery.data, user, productId])

  // --- Notifications ---
  const notifsQuery = trpc.notification.list.useQuery(
    { limit: 50, offset: 0 },
    { enabled: !!user },
  )

  const unreadQuery = trpc.notification.getUnreadCount.useQuery(
    undefined,
    { enabled: !!user },
  )

  useEffect(() => {
    if (!notifsQuery.data) return
    const dbNotifs = notifsQuery.data.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body ?? '',
      priority: 'normal' as const,
      read: n.read,
      actionUrl: n.link ?? undefined,
      productId: n.productId ?? undefined,
      timestamp: n.createdAt?.toISOString?.() ?? n.createdAt,
    }))
    useNotificationStore.setState({
      notifications: dbNotifs,
      unreadCount: unreadQuery.data ?? dbNotifs.filter((n: any) => !n.read).length,
    })
  }, [notifsQuery.data, unreadQuery.data])

  // --- Approvals ---
  const approvalsQuery = trpc.approval.list.useQuery(
    { productId: productId! },
    { enabled: !!user && !!productId },
  )

  useEffect(() => {
    if (!approvalsQuery.data) return
    // Approvals store may have different shape — hydrate if store supports it
    const dbApprovals = approvalsQuery.data.map((a: any) => ({
      id: a.id,
      productId: a.productId,
      nodeId: a.nodeId,
      requestedBy: a.requestedBy,
      status: a.status,
      routing: a.routing,
      decidedAt: a.decidedAt,
      createdAt: a.createdAt?.toISOString?.() ?? a.createdAt,
    }))
    useApprovalStore.setState((s: any) => {
      if (typeof s.approvals !== 'undefined') {
        return { approvals: dbApprovals }
      }
      return s
    })
  }, [approvalsQuery.data])

  // --- Decisions ---
  // Gracefully falls back to localStorage store if the DB table doesn't exist yet.
  // retry:false avoids console noise when the table hasn't been migrated yet.
  const decisionsQuery = trpc.decision.list.useQuery(
    { productId: productId! },
    { enabled: !!user && !!productId, retry: false },
  )

  useEffect(() => {
    if (!decisionsQuery.data) return
    const dbDecisions = decisionsQuery.data.map((d: any) => ({
      id: d.id,
      productId: d.productId,
      title: d.title,
      rationale: d.rationale ?? '',
      alternatives: d.alternatives ?? [],
      status: d.status as 'proposed' | 'decided' | 'revisited' | 'superseded',
      decidedBy: d.decidedBy ?? undefined,
      decidedAt: d.decidedAt?.toISOString?.() ?? d.decidedAt ?? undefined,
      supersededBy: d.supersededBy ?? undefined,
      studio: d.studio ?? 'operate',
      tags: d.tags ?? [],
      relatedEntities: d.relatedEntities ?? [],
      createdAt: d.createdAt?.toISOString?.() ?? d.createdAt,
    }))
    // Merge: keep local-only decisions (those not yet synced to DB) alongside DB ones
    useDecisionStore.setState((s) => ({
      decisions: [
        ...dbDecisions,
        // Keep local decisions that are NOT in DB yet (different id prefix)
        ...s.decisions.filter(
          (local) =>
            local.productId === productId &&
            local.id.startsWith('dec-') && // local-generated ids start with dec-
            !dbDecisions.some((db: any) => db.id === local.id),
        ),
        // Keep decisions belonging to other products untouched
        ...s.decisions.filter((local) => local.productId !== productId),
      ],
    }))
  }, [decisionsQuery.data, productId])

  // --- Comments ---
  // Comments are per-node, so we won't bulk-load all. The comment panel will fetch on demand.

  return {
    isLoading:
      productsQuery.isLoading ||
      nodesQuery.isLoading ||
      edgesQuery.isLoading ||
      tasksQuery.isLoading,
    isError:
      productsQuery.isError ||
      nodesQuery.isError,
    refetch: () => {
      productsQuery.refetch()
      nodesQuery.refetch()
      edgesQuery.refetch()
      tasksQuery.refetch()
      notifsQuery.refetch()
      decisionsQuery.refetch()
    },
  }
}
