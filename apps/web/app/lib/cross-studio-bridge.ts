'use client'

import { useGraphStore, type NodeKind } from './graph-store'
import { useTaskStore } from './task-store'
import { useActivityStore } from './activity-store'
import { useNotificationStore } from './notification-store'

// ---------------------------------------------------------------------------
// Cross-Studio Data Bridge
//
// This module provides functions that propagate changes across studios
// through the shared product graph, maintaining the "one graph, many views"
// architecture. When a token changes in Brand, components that use it get
// flagged. When a workflow state changes, associated pages and tasks update.
// ---------------------------------------------------------------------------

// ── Brand → Components, Design, Pages ──

export function propagateBrandTokenChange(
  productId: string,
  tokenId: string,
  tokenName: string,
  newValue: unknown,
  actorName: string,
) {
  const { nodes, edges, updateNode } = useGraphStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  // Find all components that use this token
  const usingEdges = edges.filter(
    (e) => e.kind === 'uses_token' && e.targetId === tokenId && e.productId === productId
  )
  const affectedNodeIds = new Set(usingEdges.map((e) => e.sourceId))
  const affectedNodes = nodes.filter((n) => affectedNodeIds.has(n.id))

  // Flag affected nodes as needing review
  affectedNodes.forEach((node) => {
    updateNode(node.id, {
      data: {
        ...node.data,
        _tokenUpdatePending: true,
        _lastTokenChange: { tokenName, newValue, changedAt: new Date().toISOString() },
      },
    })
  })

  // Log activity
  addActivity({
    type: 'brand_updated',
    title: `Token "${tokenName}" updated`,
    description: `${affectedNodes.length} connected objects may need review`,
    actor: { id: 'current-user', name: actorName, initials: actorName.split(' ').map(w => w[0]).join('') },
    productId,
    studio: 'brand',
  })

  // Notify if components affected
  if (affectedNodes.length > 0) {
    addNotification({
      type: 'system',
      title: 'Brand Token Changed',
      body: `"${tokenName}" was updated. ${affectedNodes.length} components may need review.`,
      priority: 'normal',
      productId,
      studio: 'brand',
    })
  }

  return affectedNodes
}

// ── Component → Design, Pages, Code ──

export function propagateComponentChange(
  productId: string,
  componentId: string,
  componentLabel: string,
  changeType: 'created' | 'updated' | 'deleted',
  actorName: string,
) {
  const { nodes, edges, updateNode } = useGraphStore.getState()
  const { addActivity } = useActivityStore.getState()

  // Find pages/screens that use this component
  const usingEdges = edges.filter(
    (e) => e.kind === 'uses_component' && e.targetId === componentId && e.productId === productId
  )
  const affectedIds = new Set(usingEdges.map((e) => e.sourceId))
  const affectedNodes = nodes.filter((n) => affectedIds.has(n.id))

  if (changeType === 'updated' || changeType === 'deleted') {
    affectedNodes.forEach((node) => {
      updateNode(node.id, {
        data: {
          ...node.data,
          _componentUpdatePending: true,
          _lastComponentChange: { componentLabel, changeType, changedAt: new Date().toISOString() },
        },
      })
    })
  }

  addActivity({
    type: 'component_created',
    title: `Component "${componentLabel}" ${changeType}`,
    description: affectedNodes.length > 0
      ? `${affectedNodes.length} pages/screens using this component`
      : undefined,
    actor: { id: 'current-user', name: actorName, initials: actorName.split(' ').map(w => w[0]).join('') },
    productId,
    studio: 'components',
  })

  return affectedNodes
}

// ── Workflow State Change → Tasks, Pages, Notifications ──

export function propagateWorkflowStateChange(
  productId: string,
  entityId: string,
  entityLabel: string,
  fromState: string,
  toState: string,
  actorName: string,
) {
  const { updateNode, getNode } = useGraphStore.getState()
  const { tasks, updateTask } = useTaskStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  // Update entity node with new state
  const entity = getNode(entityId)
  if (entity) {
    updateNode(entityId, {
      data: { ...entity.data, currentState: toState, previousState: fromState },
      status: toState,
    })
  }

  // Auto-create tasks for certain state transitions
  const taskGeneratingStates = ['review', 'testing', 'approval', 'deployed']
  if (taskGeneratingStates.includes(toState.toLowerCase())) {
    const relatedTasks = tasks.filter(
      (t) => t.productId === productId && t.feature === entityLabel && t.status !== 'done'
    )

    // Move related tasks forward
    relatedTasks.forEach((task) => {
      if (toState.toLowerCase() === 'review' && task.status === 'in_progress') {
        updateTask(task.id, { status: 'in_review' })
      }
    })
  }

  addActivity({
    type: 'workflow_updated',
    title: `"${entityLabel}" moved to ${toState}`,
    description: `State changed from "${fromState}" to "${toState}"`,
    actor: { id: 'current-user', name: actorName, initials: actorName.split(' ').map(w => w[0]).join('') },
    productId,
    studio: 'workflows',
  })

  // Notify for important transitions
  const importantStates = ['approved', 'rejected', 'deployed', 'blocked']
  if (importantStates.includes(toState.toLowerCase())) {
    addNotification({
      type: 'system',
      title: `Workflow: ${entityLabel}`,
      body: `State changed to "${toState}" from "${fromState}".`,
      priority: toState.toLowerCase() === 'blocked' ? 'urgent' : 'normal',
      productId,
      studio: 'workflows',
    })
  }
}

// ── Page Published → Analytics, Release, Notifications ──

export function propagatePagePublish(
  productId: string,
  pageId: string,
  pageTitle: string,
  environment: string,
  actorName: string,
) {
  const { updateNode, getNode } = useGraphStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  const page = getNode(pageId)
  if (page) {
    updateNode(pageId, {
      data: {
        ...page.data,
        publishedAt: new Date().toISOString(),
        environment,
        published: true,
      },
      status: 'published',
    })
  }

  addActivity({
    type: 'page_published',
    title: `Page "${pageTitle}" published to ${environment}`,
    actor: { id: 'current-user', name: actorName, initials: actorName.split(' ').map(w => w[0]).join('') },
    productId,
    studio: 'pages',
  })

  addNotification({
    type: 'release_ready',
    title: 'Page Published',
    body: `"${pageTitle}" is now live on ${environment}.`,
    priority: environment === 'production' ? 'high' : 'normal',
    productId,
    studio: 'pages',
  })
}

// ── Approval Decision → Tasks, Notifications, Workflows ──

export function propagateApprovalDecision(
  productId: string,
  approvalId: string,
  entityId: string,
  entityLabel: string,
  decision: 'approved' | 'rejected',
  decidedBy: string,
  reason?: string,
) {
  const { updateNode, getNode } = useGraphStore.getState()
  const { tasks, addTask } = useTaskStore.getState()
  const { addActivity } = useActivityStore.getState()
  const { addNotification } = useNotificationStore.getState()

  // Update the approval node
  const approval = getNode(approvalId)
  if (approval) {
    updateNode(approvalId, {
      data: { ...approval.data, decision, decidedBy, decidedAt: new Date().toISOString(), reason },
      status: decision,
    })
  }

  // If rejected, auto-create a revision task
  if (decision === 'rejected') {
    addTask({
      title: `Revise: ${entityLabel} (approval rejected)`,
      description: reason || 'Approval was rejected. Please address the feedback and resubmit.',
      status: 'todo',
      priority: 'high',
      assignee: { id: 'unassigned', name: 'Unassigned', initials: '??', role: 'team' },
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      studio: 'approvals',
      feature: entityLabel,
      productId,
    })
  }

  addActivity({
    type: 'approval_decided',
    title: `${entityLabel} ${decision}`,
    description: reason,
    actor: { id: 'current-user', name: decidedBy, initials: decidedBy.split(' ').map(w => w[0]).join('') },
    productId,
    studio: 'approvals',
  })

  addNotification({
    type: 'approval_decided',
    title: `Approval ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
    body: `"${entityLabel}" was ${decision}${reason ? ': ' + reason : ''}.`,
    priority: decision === 'rejected' ? 'high' : 'normal',
    productId,
    studio: 'approvals',
  })
}

// ── Task Completed → Activity, Readiness ──

export function propagateTaskCompletion(
  productId: string,
  taskId: string,
  taskTitle: string,
  completedBy: string,
) {
  const { moveTask } = useTaskStore.getState()
  const { addActivity } = useActivityStore.getState()

  moveTask(taskId, 'done')

  addActivity({
    type: 'task_completed',
    title: `Task completed: "${taskTitle}"`,
    actor: { id: 'current-user', name: completedBy, initials: completedBy.split(' ').map(w => w[0]).join('') },
    productId,
    studio: 'tasks',
  })
}
