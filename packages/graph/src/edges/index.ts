import type { GraphNodeKind } from '../schema/index'

// ---------------------------------------------------------------------------
// Edge kinds — matches the pgEnum in db/schema/graph.ts
// ---------------------------------------------------------------------------

export const graphEdgeKinds = [
  'contains',
  'depends_on',
  'references',
  'implements',
  'inherits',
  'triggers',
  'routes_to',
  'uses_token',
  'uses_component',
  'assigned_to',
  'approves',
  'blocks',
] as const

export type GraphEdgeKind = (typeof graphEdgeKinds)[number]

// ---------------------------------------------------------------------------
// Edge rules — which (source kind, target kind) pairs are valid per edge kind
// ---------------------------------------------------------------------------

export interface EdgeRule {
  source: readonly GraphNodeKind[]
  target: readonly GraphNodeKind[]
}

/**
 * For each edge kind, lists the valid source and target node kinds.
 *
 * A concrete edge is valid if its source node's kind is in `source` and its
 * target node's kind is in `target`.
 */
export const edgeRules: Record<GraphEdgeKind, EdgeRule> = {
  // Containment hierarchy
  contains: {
    source: [
      'product', 'plan', 'template_bundle', 'module',
      'entity', 'component', 'workflow', 'journey', 'page',
    ],
    target: [
      'module', 'feature', 'journey', 'page', 'route',
      'screen', 'workflow', 'entity', 'field', 'component',
      'variant', 'token', 'asset', 'task', 'approval',
      'insight', 'release', 'connector_binding', 'mcp_binding',
      'skill_action', 'computer_action',
    ],
  },

  // Dependency edges
  depends_on: {
    source: [
      'feature', 'module', 'page', 'route', 'workflow',
      'entity', 'component', 'release', 'task',
    ],
    target: [
      'feature', 'module', 'page', 'route', 'workflow',
      'entity', 'component', 'release', 'task',
    ],
  },

  // Generic cross-reference
  references: {
    source: [
      'feature', 'page', 'route', 'screen', 'component',
      'workflow', 'journey', 'insight', 'task', 'approval',
      'connector_binding', 'mcp_binding', 'skill_action', 'computer_action',
    ],
    target: [
      'feature', 'page', 'route', 'screen', 'entity',
      'component', 'token', 'asset', 'workflow', 'journey',
      'module', 'task', 'approval', 'release',
    ],
  },

  // Feature/route implements a design screen or journey
  implements: {
    source: ['page', 'route', 'component'],
    target: ['screen', 'journey', 'feature'],
  },

  // Component/variant inheritance
  inherits: {
    source: ['variant', 'component'],
    target: ['component'],
  },

  // Workflow / automation triggers
  triggers: {
    source: ['workflow', 'connector_binding', 'mcp_binding', 'skill_action'],
    target: ['workflow', 'task', 'release', 'skill_action', 'computer_action'],
  },

  // Navigation / routing
  routes_to: {
    source: ['page', 'route', 'screen'],
    target: ['page', 'route', 'screen'],
  },

  // Design-token usage
  uses_token: {
    source: ['component', 'variant', 'page', 'screen'],
    target: ['token'],
  },

  // Component composition
  uses_component: {
    source: ['page', 'screen', 'component', 'variant'],
    target: ['component'],
  },

  // Collaboration: assignment
  assigned_to: {
    source: ['task'],
    target: ['feature', 'module', 'page', 'component', 'entity', 'workflow'],
  },

  // Approval edges
  approves: {
    source: ['approval'],
    target: [
      'feature', 'release', 'page', 'component',
      'workflow', 'entity', 'module',
    ],
  },

  // Blocking relationships
  blocks: {
    source: ['task', 'feature', 'approval'],
    target: ['task', 'feature', 'release'],
  },
}

// ---------------------------------------------------------------------------
// Edge validation
// ---------------------------------------------------------------------------

export interface EdgeValidationResult {
  valid: boolean
  reason?: string
}

/**
 * Check whether a given edge kind is allowed between a source and target node kind.
 */
export function validateEdge(
  edgeKind: GraphEdgeKind,
  sourceKind: GraphNodeKind,
  targetKind: GraphNodeKind,
): EdgeValidationResult {
  const rule = edgeRules[edgeKind]
  if (!rule) {
    return { valid: false, reason: `Unknown edge kind: "${edgeKind}"` }
  }

  const sourceAllowed = (rule.source as readonly string[]).includes(sourceKind)
  const targetAllowed = (rule.target as readonly string[]).includes(targetKind)

  if (!sourceAllowed && !targetAllowed) {
    return {
      valid: false,
      reason: `Edge "${edgeKind}" does not allow source kind "${sourceKind}" or target kind "${targetKind}"`,
    }
  }
  if (!sourceAllowed) {
    return {
      valid: false,
      reason: `Edge "${edgeKind}" does not allow source kind "${sourceKind}"`,
    }
  }
  if (!targetAllowed) {
    return {
      valid: false,
      reason: `Edge "${edgeKind}" does not allow target kind "${targetKind}"`,
    }
  }

  return { valid: true }
}
