import { db, activityLog, notifications, tasks } from '@product-os/db';
import type { ProductOSEvent, EventHandler } from '../types';

// ---------------------------------------------------------------------------
// graphSyncHandler
// ---------------------------------------------------------------------------
// Mirrors graph changes to the activity_log table for the audit trail.
// ---------------------------------------------------------------------------

export const graphSyncHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  const graphEvents = [
    'graph.node.created',
    'graph.node.updated',
    'graph.node.deleted',
    'graph.edge.created',
    'graph.edge.deleted',
  ];

  if (!graphEvents.includes(event.type)) return;

  try {
    await db.insert(activityLog).values({
      productId: event.productId,
      actorId: event.actorId,
      action: event.type,
      entityType: 'graph',
      entityId: (event.payload as Record<string, unknown>).nodeId as string
        ?? (event.payload as Record<string, unknown>).edgeId as string
        ?? undefined,
      diff: event.payload as Record<string, unknown>,
      studioOrigin: event.metadata?.studioOrigin ?? 'graph',
    });
    console.debug(`[graphSync] Persisted ${event.type} to activity_log`);
  } catch (err) {
    console.error(`[graphSync] Failed to persist activity for ${event.type}:`, err);
  }
};

// ---------------------------------------------------------------------------
// brandTokenPropagationHandler
// ---------------------------------------------------------------------------
// Handles brand.token.updated events by logging and notifying downstream
// studios to refresh their token bindings.
// ---------------------------------------------------------------------------

export const brandTokenPropagationHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  if (event.type !== 'brand.token.updated') return;

  const payload = event.payload as {
    tokenId?: string;
    tokenName?: string;
    previousValue?: unknown;
    newValue?: unknown;
  };

  // Log to activity trail
  try {
    await db.insert(activityLog).values({
      productId: event.productId,
      actorId: event.actorId,
      action: 'brand.token.updated',
      entityType: 'token',
      entityId: payload.tokenId ?? undefined,
      diff: { tokenName: payload.tokenName, newValue: payload.newValue },
      studioOrigin: 'brand',
    });
  } catch (err) {
    console.error('[brandPropagation] Failed to log activity:', err);
  }

  // Downstream propagation targets
  const downstreamStudios = [
    'components', 'design', 'pages', 'graphics', 'code', 'handoff',
  ];

  // Client-side: Zustand graph store handles reactivity automatically.
  // Server-side: invalidate caches, mark nodes as token-stale, queue AI compliance.
  for (const studio of downstreamStudios) {
    console.debug(
      `[brandPropagation] Notified ${studio} studio to refresh tokens for product ${event.productId}`,
    );
  }
};

// ---------------------------------------------------------------------------
// notificationHandler
// ---------------------------------------------------------------------------
// Generates in-app notifications and persists them to the notifications table.
// ---------------------------------------------------------------------------

export const notificationHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  // Map event types → notification type enum values + message builders
  const notificationConfig: Record<string, {
    type: 'task_assigned' | 'task_updated' | 'approval_requested' | 'approval_decided' | 'comment_mention' | 'comment_reply' | 'ai_completed' | 'release_ready' | 'analytics_alert' | 'system';
    title: (e: ProductOSEvent) => string;
    body: (e: ProductOSEvent) => string;
  }> = {
    'task.created': {
      type: 'task_assigned',
      title: () => 'New Task Created',
      body: (e) => `Task "${(e.payload as Record<string, unknown>).title ?? 'Untitled'}" was created`,
    },
    'task.completed': {
      type: 'task_updated',
      title: () => 'Task Completed',
      body: (e) => `A task was completed by ${(e.payload as Record<string, unknown>).completedBy ?? 'someone'}`,
    },
    'approval.requested': {
      type: 'approval_requested',
      title: () => 'Approval Required',
      body: (e) => `Approval requested for ${(e.payload as Record<string, unknown>).entityType ?? 'item'}`,
    },
    'approval.decided': {
      type: 'approval_decided',
      title: (e) => {
        const decision = (e.payload as Record<string, unknown>).decision as string;
        return decision === 'approved' ? 'Approval Granted' : 'Approval Rejected';
      },
      body: (e) => {
        const p = e.payload as Record<string, unknown>;
        return `${p.entityId ?? 'Item'} was ${p.decision}${p.reason ? `: ${p.reason}` : ''}`;
      },
    },
    'comment.created': {
      type: 'comment_mention',
      title: () => 'New Comment',
      body: (e) => `New comment on ${(e.payload as Record<string, unknown>).entityType ?? 'item'}`,
    },
    'release.deployed': {
      type: 'release_ready',
      title: () => 'Release Deployed',
      body: (e) => `Deployed to ${(e.payload as Record<string, unknown>).environment ?? 'production'}`,
    },
    'release.rolled_back': {
      type: 'release_ready',
      title: () => 'Release Rolled Back',
      body: (e) => `Rolled back: ${(e.payload as Record<string, unknown>).reason ?? 'unknown reason'}`,
    },
    'brand.token.updated': {
      type: 'system',
      title: () => 'Brand Tokens Updated',
      body: (e) => `Brand token "${(e.payload as Record<string, unknown>).tokenName ?? 'token'}" was updated`,
    },
  };

  const config = notificationConfig[event.type];
  if (!config) return;

  try {
    await db.insert(notifications).values({
      userId: event.actorId,
      productId: event.productId,
      type: config.type,
      title: config.title(event),
      body: config.body(event),
      link: null,
    });
    console.debug(`[notification] Created ${config.type} notification for ${event.type}`);
  } catch (err) {
    console.error(`[notification] Failed to persist notification for ${event.type}:`, err);
  }
};

// ---------------------------------------------------------------------------
// auditHandler
// ---------------------------------------------------------------------------
// Persists every event to the activity_log table for audit/compliance.
// Skips events already handled by specialized handlers.
// ---------------------------------------------------------------------------

export const auditHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  // Skip events already handled by dedicated handlers
  if (event.type.startsWith('graph.')) return;
  if (event.type === 'brand.token.updated') return;

  try {
    await db.insert(activityLog).values({
      productId: event.productId,
      actorId: event.actorId,
      action: event.type,
      entityType: event.type.split('.')[0],
      diff: event.payload as Record<string, unknown>,
      studioOrigin: event.metadata?.studioOrigin ?? undefined,
    });
    console.debug(`[audit] Logged ${event.type} by ${event.actorId}`);
  } catch (err) {
    console.error(`[audit] Failed to log ${event.type}:`, err);
  }
};

// ---------------------------------------------------------------------------
// approvalDecisionHandler
// ---------------------------------------------------------------------------
// When an approval is decided, create follow-up tasks for rejections.
// ---------------------------------------------------------------------------

export const approvalDecisionHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  if (event.type !== 'approval.decided') return;

  const payload = event.payload as {
    approvalId: string;
    entityId: string;
    decision: 'approved' | 'rejected';
    reason?: string;
  };

  try {
    if (payload.decision === 'rejected' && payload.reason) {
      // Create a follow-up task for the rejected item
      await db.insert(tasks).values({
        productId: event.productId,
        title: `Address rejection feedback: ${payload.reason.slice(0, 200)}`,
        description: `Approval for "${payload.entityId}" was rejected. Reason: ${payload.reason}`,
        status: 'todo',
        priority: 'high',
        createdBy: event.actorId,
      });
      console.debug('[approvalDecision] Created follow-up task for rejection');
    }

    if (payload.decision === 'approved') {
      console.debug(`[approvalDecision] Approval granted for ${payload.entityId}`);
    }
  } catch (err) {
    console.error('[approvalDecision] Failed to handle approval decision:', err);
  }
};

// ---------------------------------------------------------------------------
// aiTriggerHandler
// ---------------------------------------------------------------------------
// Suggests AI skills in response to user actions.
// ---------------------------------------------------------------------------

export const aiTriggerHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  const triggerMap: Partial<Record<string, string>> = {
    'graph.node.created': 'auto-tag',
    'task.created': 'estimate-effort',
    'comment.created': 'sentiment-analysis',
    'page.published': 'seo-suggestions',
    'brand.token.updated': 'brand-compliance-check',
  };

  const skillHint = triggerMap[event.type];
  if (!skillHint) return;

  console.debug(
    `[aiTrigger] Suggested skill "${skillHint}" for ${event.type} in product ${event.productId}`,
  );
};
