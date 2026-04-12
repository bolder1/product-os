import { eventBus } from './bus';
import {
  graphSyncHandler,
  brandTokenPropagationHandler,
  notificationHandler,
  auditHandler,
  approvalDecisionHandler,
  aiTriggerHandler,
} from './handlers/index';

// ---------------------------------------------------------------------------
// Register all event handlers on the singleton event bus.
// Call this once at server startup.
// ---------------------------------------------------------------------------

let initialized = false;

export function initializeEventHandlers(): void {
  if (initialized) return;
  initialized = true;

  // Graph events → activity log
  eventBus.subscribe(
    ['graph.node.*', 'graph.edge.*'],
    graphSyncHandler,
  );

  // Brand token propagation
  eventBus.on('brand.token.updated', brandTokenPropagationHandler);

  // Notifications for key events
  eventBus.subscribe(
    [
      'task.*',
      'approval.*',
      'comment.created',
      'release.*',
      'brand.token.updated',
    ],
    notificationHandler,
  );

  // Audit trail for all non-graph events
  eventBus.subscribe(['*.*'], auditHandler);

  // Approval decision → follow-up tasks
  eventBus.on('approval.decided', approvalDecisionHandler);

  // AI skill suggestions
  eventBus.subscribe(
    [
      'graph.node.created',
      'task.created',
      'comment.created',
      'page.published',
      'brand.token.updated',
    ],
    aiTriggerHandler,
  );

  console.debug('[events] All event handlers registered');
}
