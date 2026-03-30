import type { ProductOSEvent, EventHandler } from '../types';

// ---------------------------------------------------------------------------
// graphSyncHandler
// ---------------------------------------------------------------------------
// Mirrors graph changes to downstream read-models or caches.
// ---------------------------------------------------------------------------

export const graphSyncHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  switch (event.type) {
    case 'graph.node.created':
    case 'graph.node.updated':
    case 'graph.node.deleted':
    case 'graph.edge.created':
    case 'graph.edge.deleted':
      // TODO: Sync change to read-model / materialized view
      console.debug(`[graphSync] Processing ${event.type} — node/edge ${event.id}`);
      break;
    default:
      // Not a graph event — ignore
      break;
  }
};

// ---------------------------------------------------------------------------
// notificationHandler
// ---------------------------------------------------------------------------
// Generates in-app (and future email/slack) notifications from events.
// ---------------------------------------------------------------------------

export const notificationHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  const notifiable: string[] = [
    'task.created',
    'task.completed',
    'approval.requested',
    'approval.decided',
    'comment.created',
    'release.deployed',
    'release.rolled_back',
  ];

  if (!notifiable.includes(event.type)) return;

  // TODO: Look up notification preferences for relevant users,
  //       build notification payload, and persist via notification service.
  console.debug(
    `[notification] Would notify for ${event.type} in product ${event.productId}`,
  );
};

// ---------------------------------------------------------------------------
// auditHandler
// ---------------------------------------------------------------------------
// Persists every event to an append-only activity_log table for audit
// and compliance purposes.
// ---------------------------------------------------------------------------

export const auditHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  // TODO: Insert into activity_log table via @product-os/db
  //       { id, event_type, product_id, actor_id, payload, timestamp }
  console.debug(
    `[audit] Logging ${event.type} by actor ${event.actorId} at ${event.timestamp}`,
  );
};

// ---------------------------------------------------------------------------
// aiTriggerHandler
// ---------------------------------------------------------------------------
// Triggers AI skill suggestions in response to user actions. For example,
// creating a graph node might prompt an auto-tagging skill.
// ---------------------------------------------------------------------------

export const aiTriggerHandler: EventHandler = async (
  event: ProductOSEvent,
) => {
  const triggerMap: Partial<Record<string, string>> = {
    'graph.node.created': 'auto-tag',
    'task.created': 'estimate-effort',
    'comment.created': 'sentiment-analysis',
    'page.published': 'seo-suggestions',
  };

  const skillHint = triggerMap[event.type];
  if (!skillHint) return;

  // TODO: Dispatch an ai.skill.invoked event or call the AI orchestration
  //       service directly.
  console.debug(
    `[aiTrigger] Event ${event.type} could invoke skill "${skillHint}" for product ${event.productId}`,
  );
};
