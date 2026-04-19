/**
 * Product OS — Shared Primitives
 *
 * One implementation of each cross-workspace primitive.
 * Import from here, not from individual studio components.
 */

export { ExportMenu } from './export-menu'
export { ActivityFeed } from './activity-feed'
export { ApprovalsGate } from './approvals-gate'
export { AIActionBar } from './ai-action-bar'

// Re-export existing primitives that already live elsewhere,
// so consumers have a single import path.
export { CommentThread } from '../shared/comment-thread'
export { VersionHistoryPanel } from '../shared/version-history-panel'
export { AIAssistantPanel } from '../shared/ai-assistant-panel'
