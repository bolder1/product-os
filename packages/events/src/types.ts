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

  // Members
  'member.invited',
  'member.role_changed',
  'member.removed',

  // Components
  'component.created',
  'component.updated',
  'component.deleted',
  'component.version_saved',
  'component.version_restored',
  'component.extracted',

  // Design
  'design.screen.created',
  'design.screen.updated',
  'design.screen.deleted',
  'design.component.placed',

  // Pages
  'page.created',
  'page.updated',
  'page.deleted',
  'page.published',
  'page.unpublished',

  // Workflows (entities + state machines + automations)
  'workflow.entity.created',
  'workflow.entity.updated',
  'workflow.entity.deleted',
  'workflow.created',
  'workflow.updated',
  'workflow.deleted',
  'workflow.automation.created',

  // Code Studio
  'code.module.created',
  'code.module.updated',
  'code.module.deleted',

  // Handoff
  'handoff.created',
  'handoff.updated',
  'handoff.deleted',

  // Analytics
  'analytics.insight.created',
  'analytics.experiment.created',

  // Testing
  'testing.suite.created',
  'testing.run.completed',

  // Graphics
  'graphics.asset.created',
  'graphics.asset.updated',
  'graphics.asset.deleted',
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

// Members
export const MemberInvitedPayload = z.object({
  membershipId: z.string(),
  email: z.string(),
  role: z.string(),
  orgId: z.string(),
});
export const MemberRoleChangedPayload = z.object({
  membershipId: z.string(),
  oldRole: z.string(),
  newRole: z.string(),
});
export const MemberRemovedPayload = z.object({
  membershipId: z.string(),
  userId: z.string(),
});

// Components
export const ComponentCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  userId: z.string(),
});
export const ComponentUpdatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  version: z.number().optional(),
  userId: z.string(),
});
export const ComponentDeletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});
export const ComponentVersionSavedPayload = z.object({
  nodeId: z.string(),
  label: z.string(),
  userId: z.string(),
});
export const ComponentVersionRestoredPayload = z.object({
  nodeId: z.string(),
  versionLabel: z.string(),
  userId: z.string(),
});
export const ComponentExtractedPayload = z.object({
  nodeId: z.string(),
  screenNodeId: z.string(),
  label: z.string(),
  userId: z.string(),
});

// Design
export const DesignScreenCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  category: z.string(),
  userId: z.string(),
});
export const DesignScreenUpdatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});
export const DesignScreenDeletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});
export const DesignComponentPlacedPayload = z.object({
  screenId: z.string(),
  componentId: z.string(),
  componentLabel: z.string(),
  userId: z.string(),
});

// Pages (Phase 18)
export const PageCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  slug: z.string(),
  userId: z.string(),
});
export const PageUpdatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  version: z.number().optional(),
  userId: z.string(),
});
export const PageDeletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});
// Note: PagePublishedPayload and PageUnpublishedPayload already exist above

// Workflows (Phase 18)
export const WorkflowEntityCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  userId: z.string(),
});
export const WorkflowEntityUpdatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  userId: z.string(),
});
export const WorkflowEntityDeletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});
export const WorkflowCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  stateCount: z.number(),
  userId: z.string(),
});
export const WorkflowUpdatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  userId: z.string(),
});
export const WorkflowDeletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});
export const WorkflowAutomationCreatedPayload = z.object({
  nodeId: z.string(),
  label: z.string(),
  triggerType: z.string(),
  userId: z.string(),
});

// Code Studio (Phase 19)
export const CodeModuleCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  userId: z.string(),
});
export const CodeModuleUpdatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  userId: z.string(),
});
export const CodeModuleDeletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});

// Handoff (Phase 19)
export const HandoffCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  type: z.string(),
  userId: z.string(),
});
export const HandoffUpdatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});
export const HandoffDeletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});

// Analytics (Phase 19)
export const AnalyticsInsightCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  severity: z.string(),
  userId: z.string(),
});
export const AnalyticsExperimentCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  userId: z.string(),
});

// Testing (Phase 19)
export const TestingSuiteCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  testCount: z.number(),
  userId: z.string(),
});
export const TestingRunCompletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  passed: z.number(),
  failed: z.number(),
  status: z.string(),
  userId: z.string(),
});

// Graphics (Phase 19)
export const GraphicsAssetCreatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  label: z.string(),
  assetType: z.string(),
  userId: z.string(),
});
export const GraphicsAssetUpdatedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
});
export const GraphicsAssetDeletedPayload = z.object({
  nodeId: z.string(),
  productId: z.string(),
  userId: z.string(),
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
  'member.invited': MemberInvitedPayload,
  'member.role_changed': MemberRoleChangedPayload,
  'member.removed': MemberRemovedPayload,
  'component.created': ComponentCreatedPayload,
  'component.updated': ComponentUpdatedPayload,
  'component.deleted': ComponentDeletedPayload,
  'component.version_saved': ComponentVersionSavedPayload,
  'component.version_restored': ComponentVersionRestoredPayload,
  'component.extracted': ComponentExtractedPayload,
  'design.screen.created': DesignScreenCreatedPayload,
  'design.screen.updated': DesignScreenUpdatedPayload,
  'design.screen.deleted': DesignScreenDeletedPayload,
  'design.component.placed': DesignComponentPlacedPayload,
  'page.created': PageCreatedPayload,
  'page.updated': PageUpdatedPayload,
  'page.deleted': PageDeletedPayload,
  'workflow.entity.created': WorkflowEntityCreatedPayload,
  'workflow.entity.updated': WorkflowEntityUpdatedPayload,
  'workflow.entity.deleted': WorkflowEntityDeletedPayload,
  'workflow.created': WorkflowCreatedPayload,
  'workflow.updated': WorkflowUpdatedPayload,
  'workflow.deleted': WorkflowDeletedPayload,
  'workflow.automation.created': WorkflowAutomationCreatedPayload,
  'code.module.created': CodeModuleCreatedPayload,
  'code.module.updated': CodeModuleUpdatedPayload,
  'code.module.deleted': CodeModuleDeletedPayload,
  'handoff.created': HandoffCreatedPayload,
  'handoff.updated': HandoffUpdatedPayload,
  'handoff.deleted': HandoffDeletedPayload,
  'analytics.insight.created': AnalyticsInsightCreatedPayload,
  'analytics.experiment.created': AnalyticsExperimentCreatedPayload,
  'testing.suite.created': TestingSuiteCreatedPayload,
  'testing.run.completed': TestingRunCompletedPayload,
  'graphics.asset.created': GraphicsAssetCreatedPayload,
  'graphics.asset.updated': GraphicsAssetUpdatedPayload,
  'graphics.asset.deleted': GraphicsAssetDeletedPayload,
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
