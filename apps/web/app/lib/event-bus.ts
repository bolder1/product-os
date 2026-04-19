'use client'

/**
 * Product OS — Typed Cross-Workspace Event Bus
 *
 * All side-effects that cross workspace boundaries MUST flow through here.
 * No direct store-to-store imports for cross-cutting concerns.
 *
 * Usage:
 *   // Emit
 *   eventBus.emit({ type: 'brand.token.changed', productId, tokenId, tokenName, newValue, actor })
 *
 *   // Subscribe (e.g. in a useEffect)
 *   const unsub = eventBus.on('brand.token.changed', (e) => { ... })
 *   return unsub
 *
 *   // Subscribe to all events
 *   const unsub = eventBus.onAny((e) => { ... })
 */

// ---------------------------------------------------------------------------
// Actor type (shared across events)
// ---------------------------------------------------------------------------

export interface EventActor {
  id: string
  name: string
}

function initials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export function makeActor(id: string, name: string): EventActor {
  return { id, name }
}

// ---------------------------------------------------------------------------
// Discriminated union of all bus events
// ---------------------------------------------------------------------------

export type BusEvent =
  // ── Brand / Design tokens ──
  | {
      type: 'brand.token.changed'
      productId: string
      tokenId: string
      tokenName: string
      newValue: unknown
      actor: EventActor
    }

  // ── Component lifecycle ──
  | { type: 'component.created'; productId: string; componentId: string; componentLabel: string; actor: EventActor }
  | { type: 'component.updated'; productId: string; componentId: string; componentLabel: string; actor: EventActor }
  | { type: 'component.deleted'; productId: string; componentId: string; componentLabel: string; actor: EventActor }

  // ── Design frame lifecycle ──
  | { type: 'design.frame.created';  productId: string; frameId: string; frameLabel: string; actor: EventActor }
  | { type: 'design.frame.updated';  productId: string; frameId: string; frameLabel: string; actor: EventActor }
  | { type: 'design.frame.exported'; productId: string; frameId: string; frameLabel: string; exportFormat?: 'tsx' | 'png' | 'svg' | 'pdf' | 'figma-json'; actor: EventActor }

  // ── Spec / Plan ──
  | { type: 'plan.spec.created';  productId: string; specId: string; specTitle: string; actor: EventActor }
  | { type: 'plan.spec.updated';  productId: string; specId: string; specTitle: string; actor: EventActor }
  | { type: 'plan.spec.approved'; productId: string; specId: string; specTitle: string; actor: EventActor }

  // ── Workflow state ──
  | {
      type: 'workflow.state.changed'
      productId: string
      entityId: string
      entityLabel: string
      fromState: string
      toState: string
      actor: EventActor
    }

  // ── Approval ──
  | {
      type: 'approval.decided'
      productId: string
      approvalId: string
      entityId: string
      entityLabel: string
      decision: 'approved' | 'rejected'
      reason?: string
      actor: EventActor
    }

  // ── Task ──
  | { type: 'task.completed'; productId: string; taskId: string; taskTitle: string; actor: EventActor }
  | { type: 'task.created';   productId: string; taskId: string; taskTitle: string; assigneeId?: string; actor: EventActor }
  | { type: 'task.assigned';  productId: string; taskId: string; taskTitle: string; assigneeId: string; actor: EventActor }

  // ── Page / Ship ──
  | {
      type: 'page.published'
      productId: string
      pageId: string
      pageTitle: string
      environment: string
      liveUrl?: string
      actor: EventActor
    }

  // ── Release ──
  | { type: 'release.created';  productId: string; releaseId: string; releaseLabel: string; actor: EventActor }
  | { type: 'release.deployed'; productId: string; releaseId: string; releaseLabel: string; environment: string; actor: EventActor }

  // ── Engineer ──
  | { type: 'engineer.code.generated'; productId: string; componentId: string; filePath: string; actor: EventActor }

  // ── AI ──
  | {
      type: 'ai.skill.completed'
      productId: string
      skillId: string
      skillName: string
      outputNodeIds?: string[]
      actor: EventActor
    }

// ---------------------------------------------------------------------------
// EventBus class
// ---------------------------------------------------------------------------

type EventType = BusEvent['type']
type HandlerFor<T extends EventType> = (event: Extract<BusEvent, { type: T }>) => void
type AnyHandler = (event: BusEvent) => void

class EventBus {
  private handlers = new Map<EventType, Set<HandlerFor<any>>>()
  private anyHandlers = new Set<AnyHandler>()

  /** Subscribe to a specific event type. Returns an unsubscribe function. */
  on<T extends EventType>(type: T, handler: HandlerFor<T>): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set())
    this.handlers.get(type)!.add(handler)
    return () => this.handlers.get(type)?.delete(handler)
  }

  /** Subscribe to every event. Returns an unsubscribe function. */
  onAny(handler: AnyHandler): () => void {
    this.anyHandlers.add(handler)
    return () => this.anyHandlers.delete(handler)
  }

  /** Emit an event — synchronously calls all matching subscribers. */
  emit(event: BusEvent): void {
    this.handlers.get(event.type)?.forEach((h) => h(event as any))
    this.anyHandlers.forEach((h) => h(event))
  }
}

/** Singleton event bus — import and use anywhere (stores, components, server actions). */
export const eventBus = new EventBus()

// ---------------------------------------------------------------------------
// Built-in cross-workspace side-effect handlers
// Wired here so they're active as soon as the module is imported.
// ---------------------------------------------------------------------------

import { useGraphStore } from './graph-store'
import { useTaskStore } from './task-store'
import { useActivityStore } from './activity-store'
import { useNotificationStore } from './notification-store'

// ── brand.token.changed → flag graph nodes that use this token ──
eventBus.on('brand.token.changed', (e) => {
  const { nodes, edges, updateNode } = useGraphStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  const affected = edges
    .filter((edge) => edge.kind === 'uses_token' && edge.targetId === e.tokenId && edge.productId === e.productId)
    .map((edge) => nodes.find((n) => n.id === edge.sourceId))
    .filter(Boolean) as typeof nodes

  affected.forEach((node) => {
    updateNode(node.id, {
      data: {
        ...node.data,
        _tokenUpdatePending: true,
        _lastTokenChange: { tokenName: e.tokenName, newValue: e.newValue, changedAt: new Date().toISOString() },
      },
    })
  })

  addActivity({
    type: 'brand_updated',
    title: `Token "${e.tokenName}" updated`,
    description: affected.length > 0 ? `${affected.length} connected objects may need review` : undefined,
    actor: { id: e.actor.id, name: e.actor.name, initials: initials(e.actor.name) },
    productId: e.productId,
    studio: 'brand',
  })

  if (affected.length > 0) {
    addNotification({
      type: 'system',
      title: 'Brand Token Changed',
      body: `"${e.tokenName}" updated — ${affected.length} component${affected.length !== 1 ? 's' : ''} may need review.`,
      priority: 'normal',
      productId: e.productId,
      studio: 'brand',
    })
  }
})

// ── component.updated / deleted → flag pages and screens ──
eventBus.on('component.updated', (e) => _propagateComponentChange('updated', e))
eventBus.on('component.deleted', (e) => _propagateComponentChange('deleted', e))

function _propagateComponentChange(
  changeType: 'created' | 'updated' | 'deleted',
  e: { productId: string; componentId: string; componentLabel: string; actor: EventActor }
) {
  const { nodes, edges, updateNode } = useGraphStore.getState()
  const { addActivity } = useActivityStore.getState()

  const affected = edges
    .filter((edge) => edge.kind === 'uses_component' && edge.targetId === e.componentId && edge.productId === e.productId)
    .map((edge) => nodes.find((n) => n.id === edge.sourceId))
    .filter(Boolean) as typeof nodes

  if (changeType !== 'created') {
    affected.forEach((node) => {
      updateNode(node.id, {
        data: {
          ...node.data,
          _componentUpdatePending: true,
          _lastComponentChange: { componentLabel: e.componentLabel, changeType, changedAt: new Date().toISOString() },
        },
      })
    })
  }

  addActivity({
    type: 'component_created',
    title: `Component "${e.componentLabel}" ${changeType}`,
    description: affected.length > 0 ? `${affected.length} pages/screens using this component` : undefined,
    actor: { id: e.actor.id, name: e.actor.name, initials: initials(e.actor.name) },
    productId: e.productId,
    studio: 'components',
  })
}

// ── workflow.state.changed → update graph node, advance tasks ──
eventBus.on('workflow.state.changed', (e) => {
  const { updateNode, getNode } = useGraphStore.getState()
  const { tasks, updateTask } = useTaskStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  const entity = getNode(e.entityId)
  if (entity) {
    updateNode(e.entityId, {
      data: { ...entity.data, currentState: e.toState, previousState: e.fromState },
      status: e.toState,
    })
  }

  const advancingStates = ['review', 'testing', 'approval', 'deployed']
  if (advancingStates.includes(e.toState.toLowerCase())) {
    tasks
      .filter((t) => t.productId === e.productId && t.feature === e.entityLabel && t.status !== 'done')
      .forEach((task) => {
        if (e.toState.toLowerCase() === 'review' && task.status === 'in_progress') {
          updateTask(task.id, { status: 'in_review' })
        }
      })
  }

  addActivity({
    type: 'workflow_updated',
    title: `"${e.entityLabel}" moved to ${e.toState}`,
    description: `State changed from "${e.fromState}" to "${e.toState}"`,
    actor: { id: e.actor.id, name: e.actor.name, initials: initials(e.actor.name) },
    productId: e.productId,
    studio: 'workflows',
  })

  const importantStates = ['approved', 'rejected', 'deployed', 'blocked']
  if (importantStates.includes(e.toState.toLowerCase())) {
    addNotification({
      type: 'system',
      title: `Workflow: ${e.entityLabel}`,
      body: `State changed to "${e.toState}" from "${e.fromState}".`,
      priority: e.toState.toLowerCase() === 'blocked' ? 'urgent' : 'normal',
      productId: e.productId,
      studio: 'workflows',
    })
  }
})

// ── plan.spec.approved → auto-seed design frames + create tasks ──
eventBus.on('plan.spec.approved', (e) => {
  const { addNode, addEdge, getNodesByKind } = useGraphStore.getState()
  const { addTask } = useTaskStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  // Seed a design frame node linked to this spec
  const frame = addNode({
    kind: 'screen',
    label: `${e.specTitle} — Design`,
    productId: e.productId,
    data: { seededFromSpec: e.specId, status: 'pending-design', specTitle: e.specTitle },
  })

  // Link frame to spec
  addEdge({
    kind: 'implements',
    sourceId: frame.id,
    targetId: e.specId,
    productId: e.productId,
  })

  // Auto-create a design task
  addTask({
    title: `Design screens for: ${e.specTitle}`,
    description: `Spec "${e.specTitle}" approved. Create screens in Design Studio.`,
    status: 'todo',
    priority: 'high',
    assignee: { id: 'unassigned', name: 'Unassigned', initials: '??', role: 'designer' },
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    studio: 'design',
    feature: e.specTitle,
    productId: e.productId,
  })

  addActivity({
    type: 'spec_approved' as any,
    title: `Spec approved: "${e.specTitle}"`,
    description: 'Design frame seeded — tasks created.',
    actor: { id: e.actor.id, name: e.actor.name, initials: initials(e.actor.name) },
    productId: e.productId,
    studio: 'planner',
  })

  addNotification({
    type: 'plan_ready',
    title: 'Spec Approved',
    body: `"${e.specTitle}" approved. Design Studio frame and tasks are ready.`,
    priority: 'high',
    productId: e.productId,
    studio: 'planner',
  })
})

// ── approval.decided → update graph, auto-create revision task if rejected ──
eventBus.on('approval.decided', (e) => {
  const { updateNode, getNode } = useGraphStore.getState()
  const { addTask } = useTaskStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  const approval = getNode(e.approvalId)
  if (approval) {
    updateNode(e.approvalId, {
      data: { ...approval.data, decision: e.decision, decidedBy: e.actor.name, decidedAt: new Date().toISOString(), reason: e.reason },
      status: e.decision,
    })
  }

  if (e.decision === 'rejected') {
    addTask({
      title: `Revise: ${e.entityLabel} (approval rejected)`,
      description: e.reason || 'Approval rejected. Please address feedback and resubmit.',
      status: 'todo',
      priority: 'high',
      assignee: { id: 'unassigned', name: 'Unassigned', initials: '??', role: 'team' },
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      studio: 'approvals',
      feature: e.entityLabel,
      productId: e.productId,
    })
  }

  addActivity({
    type: 'approval_decided',
    title: `${e.entityLabel} ${e.decision}`,
    description: e.reason,
    actor: { id: e.actor.id, name: e.actor.name, initials: initials(e.actor.name) },
    productId: e.productId,
    studio: 'approvals',
  })

  addNotification({
    type: 'approval_decided',
    title: `Approval ${e.decision === 'approved' ? 'Approved ✓' : 'Rejected'}`,
    body: `"${e.entityLabel}" was ${e.decision}${e.reason ? ': ' + e.reason : ''}.`,
    priority: e.decision === 'rejected' ? 'high' : 'normal',
    productId: e.productId,
    studio: 'approvals',
  })
})

// ── page.published → update graph node, notify ──
eventBus.on('page.published', (e) => {
  const { updateNode, getNode } = useGraphStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  const page = getNode(e.pageId)
  if (page) {
    updateNode(e.pageId, {
      data: { ...page.data, publishedAt: new Date().toISOString(), environment: e.environment, published: true, liveUrl: e.liveUrl },
      status: 'published',
    })
  }

  addActivity({
    type: 'page_published',
    title: `"${e.pageTitle}" published to ${e.environment}`,
    description: e.liveUrl ? `Live at ${e.liveUrl}` : undefined,
    actor: { id: e.actor.id, name: e.actor.name, initials: initials(e.actor.name) },
    productId: e.productId,
    studio: 'pages',
  })

  addNotification({
    type: 'release_ready',
    title: 'Page Published',
    body: `"${e.pageTitle}" is live on ${e.environment}${e.liveUrl ? ` — ${e.liveUrl}` : ''}.`,
    priority: e.environment === 'production' ? 'high' : 'normal',
    productId: e.productId,
    studio: 'pages',
  })
})

// ── task.completed → activity log ──
eventBus.on('task.completed', (e) => {
  const { moveTask } = useTaskStore.getState()
  const { addActivity } = useActivityStore.getState()

  moveTask(e.taskId, 'done')

  addActivity({
    type: 'task_completed',
    title: `Task completed: "${e.taskTitle}"`,
    actor: { id: e.actor.id, name: e.actor.name, initials: initials(e.actor.name) },
    productId: e.productId,
    studio: 'tasks',
  })
})
