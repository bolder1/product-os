import { z } from 'zod';

// ---------------------------------------------------------------------------
// Event type literals
// ---------------------------------------------------------------------------

export const EVENT_TYPES = [
  // Graph
  'graph.node.created',
  'graph.node.updated',
  'graph.node.deleted',
  'graph.edge.created',
  'graph.edge.deleted',

  // Tasks
  'task.created',
  'task.updated',
  'task.completed',

  // Approvals
  'approval.requested',
  'approval.decided',

  // Comments
  'comment.created',
  'comment.resolved',

  // Versioning
  'version.created',
  'version.branched',
  'version.merged',

  // AI
  'ai.skill.invoked',
  'ai.skill.completed',

  // Releases
  'release.created',
  'release.deployed',
  'release.rolled_back',

  // Connectors
  'connector.synced',
  'connector.error',

  // MCP
  'mcp.tool.called',

  // Brand
  'brand.token.updated',

  // Workflow
  'workflow.state.changed',

  // Pages
  'page.published',
  'page.unpublished',

  // Notifications
  'notification.created',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EventTypeSchema = z.enum(EVENT_TYPES);

// ---------------------------------------------------------------------------
// Per-event payload schemas
// ---------------------------------------------------------------------------

export const GraphNodeCreatedPayload = z.object({
  nodeId: z.string(),
  nodeType: z.string(),
  label: z.string(),
  properties: z.record(z.unknown()).optional(),
});

export const GraphNodeUpdatedPayload = z.object({
  nodeId: z.string(),
  changes: z.record(z.unknown()),
  previousValues: z.record(z.unknown()).optional(),
});

export const GraphNodeDeletedPayload = z.object({
  nodeId: z.string(),
  nodeType: z.string(),
});

export const GraphEdgeCreatedPayload = z.object({
  edgeId: z.string(),
  edgeType: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  properties: z.record(z.unknown()).optional(),
});

export const GraphEdgeDeletedPayload = z.object({
  edgeId: z.string(),
  edgeType: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
});

export const TaskCreatedPayload = z.object({
  taskId: z.string(),
  title: z.string(),
  assigneeId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const TaskUpdatedPayload = z.object({
  taskId: z.string(),
  changes: z.record(z.unknown()),
});

export const TaskCompletedPayload = z.object({
  taskId: z.string(),
  completedBy: z.string(),
  duration: z.number().optional(),
});

export const ApprovalRequestedPayload = z.object({
  approvalId: z.string(),
  entityId: z.string(),
  entityType: z.string(),
  requestedFrom: z.array(z.string()),
});

export const ApprovalDecidedPayload = z.object({
  approvalId: z.string(),
  entityId: z.string(),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional(),
});

export const CommentCreatedPayload = z.object({
  commentId: z.string(),
  entityId: z.string(),
  entityType: z.string(),
  body: z.string(),
  parentCommentId: z.string().optional(),
});

export const CommentResolvedPayload = z.object({
  commentId: z.string(),
  resolvedBy: z.string(),
});

export const VersionCreatedPayload = z.object({
  versionId: z.string(),
  entityId: z.string(),
  versionNumber: z.string(),
  label: z.string().optional(),
});

export const VersionBranchedPayload = z.object({
  branchId: z.string(),
  sourceVersionId: z.string(),
  branchName: z.string(),
});

export const VersionMergedPayload = z.object({
  branchId: z.string(),
  targetVersionId: z.string(),
  conflictsResolved: z.number().optional(),
});

export const AISkillInvokedPayload = z.object({
  skillId: z.string(),
  skillName: z.string(),
  input: z.record(z.unknown()),
  triggeredBy: z.enum(['user', 'automation']),
});

export const AISkillCompletedPayload = z.object({
  skillId: z.string(),
  skillName: z.string(),
  output: z.record(z.unknown()),
  durationMs: z.number(),
  tokenUsage: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
});

export const ReleaseCreatedPayload = z.object({
  releaseId: z.string(),
  versionId: z.string(),
  environment: z.string(),
  changelog: z.string().optional(),
});

export const ReleaseDeployedPayload = z.object({
  releaseId: z.string(),
  environment: z.string(),
  deployedAt: z.string().datetime(),
});

export const ReleaseRolledBackPayload = z.object({
  releaseId: z.string(),
  environment: z.string(),
  reason: z.string(),
  rolledBackTo: z.string(),
});

export const ConnectorSyncedPayload = z.object({
  connectorId: z.string(),
  connectorType: z.string(),
  recordsSynced: z.number(),
  direction: z.enum(['inbound', 'outbound']),
});

export const ConnectorErrorPayload = z.object({
  connectorId: z.string(),
  connectorType: z.string(),
  error: z.string(),
  retryable: z.boolean(),
});

export const MCPToolCalledPayload = z.object({
  toolName: z.string(),
  serverId: z.string(),
  input: z.record(z.unknown()),
  durationMs: z.number().optional(),
});

export const BrandTokenUpdatedPayload = z.object({
  tokenId: z.string(),
  tokenName: z.string(),
  previousValue: z.unknown().optional(),
  newValue: z.unknown(),
});

export const WorkflowStateChangedPayload = z.object({
  entityId: z.string(),
  entityType: z.string(),
  fromState: z.string(),
  toState: z.string(),
  workflowId: z.string(),
});

export const PagePublishedPayload = z.object({
  pageId: z.string(),
  slug: z.string(),
  title: z.string(),
  publishedAt: z.string().datetime(),
});

export const PageUnpublishedPayload = z.object({
  pageId: z.string(),
  slug: z.string(),
  reason: z.string().optional(),
});

export const NotificationCreatedPayload = z.object({
  notificationId: z.string(),
  recipientId: z.string(),
  channel: z.enum(['in_app', 'email', 'slack', 'webhook']),
  title: z.string(),
  body: z.string(),
  actionUrl: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Payload map — maps each EventType to its Zod schema
// ---------------------------------------------------------------------------

export const PayloadSchemas = {
  'graph.node.created': GraphNodeCreatedPayload,
  'graph.node.updated': GraphNodeUpdatedPayload,
  'graph.node.deleted': GraphNodeDeletedPayload,
  'graph.edge.created': GraphEdgeCreatedPayload,
  'graph.edge.deleted': GraphEdgeDeletedPayload,
  'task.created': TaskCreatedPayload,
  'task.updated': TaskUpdatedPayload,
  'task.completed': TaskCompletedPayload,
  'approval.requested': ApprovalRequestedPayload,
  'approval.decided': ApprovalDecidedPayload,
  'comment.created': CommentCreatedPayload,
  'comment.resolved': CommentResolvedPayload,
  'version.created': VersionCreatedPayload,
  'version.branched': VersionBranchedPayload,
  'version.merged': VersionMergedPayload,
  'ai.skill.invoked': AISkillInvokedPayload,
  'ai.skill.completed': AISkillCompletedPayload,
  'release.created': ReleaseCreatedPayload,
  'release.deployed': ReleaseDeployedPayload,
  'release.rolled_back': ReleaseRolledBackPayload,
  'connector.synced': ConnectorSyncedPayload,
  'connector.error': ConnectorErrorPayload,
  'mcp.tool.called': MCPToolCalledPayload,
  'brand.token.updated': BrandTokenUpdatedPayload,
  'workflow.state.changed': WorkflowStateChangedPayload,
  'page.published': PagePublishedPayload,
  'page.unpublished': PageUnpublishedPayload,
  'notification.created': NotificationCreatedPayload,
} as const satisfies Record<EventType, z.ZodTypeAny>;

// ---------------------------------------------------------------------------
// Inferred payload types
// ---------------------------------------------------------------------------

export type PayloadOf<T extends EventType> = z.infer<(typeof PayloadSchemas)[T]>;

// ---------------------------------------------------------------------------
// Event metadata
// ---------------------------------------------------------------------------

export const EventMetadataSchema = z.object({
  studioOrigin: z.string().optional(),
  correlationId: z.string().optional(),
  version: z.number().default(1),
});

export type EventMetadata = z.infer<typeof EventMetadataSchema>;

// ---------------------------------------------------------------------------
// ProductOSEvent — the canonical event envelope
// ---------------------------------------------------------------------------

export interface ProductOSEvent<T extends EventType = EventType> {
  id: string;
  type: T;
  productId: string;
  actorId: string;
  timestamp: string;
  payload: PayloadOf<T>;
  metadata: EventMetadata;
}

export const ProductOSEventSchema = z.object({
  id: z.string().uuid(),
  type: EventTypeSchema,
  productId: z.string(),
  actorId: z.string(),
  timestamp: z.string().datetime(),
  payload: z.record(z.unknown()),
  metadata: EventMetadataSchema,
});

// ---------------------------------------------------------------------------
// Event handler type
// ---------------------------------------------------------------------------

export type EventHandler<T extends EventType = EventType> = (
  event: ProductOSEvent<T>,
) => void | Promise<void>;
