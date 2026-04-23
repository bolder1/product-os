/**
 * Maps graph NodeKind → the studio that owns it, so any panel can deep-link
 * directly into the right studio with the node pre-selected.
 *
 * Usage:
 *   const { href, label } = nodeStudioHref('/acme/my-app', 'feature', 'node-123')
 *   router.push(href)   // → /acme/my-app/features?nodeId=node-123
 */

import type { NodeKind } from '../graph-explorer/_data/mock-graph'

export interface StudioLinkInfo {
  /** Absolute path including search param, e.g. /acme/app/features?nodeId=x */
  href: string
  /** Human-readable studio name, e.g. "Features" */
  label: string
  /** The slug segment, e.g. "features" */
  studio: string
}

/** Maps each NodeKind to its owning studio slug. */
const KIND_STUDIO: Record<NodeKind, string> = {
  module:    'features',
  feature:   'features',
  journey:   'canvas',
  page:      'pages',
  entity:    'workflows',
  workflow:  'workflows',
  component: 'components',
  token:     'brand',
}

const STUDIO_LABELS: Record<string, string> = {
  features:   'Features',
  canvas:     'Canvas Planner',
  pages:      'Page Builder',
  workflows:  'Workflow Builder',
  components: 'Component Builder',
  brand:      'Brand Builder',
  design:     'Design Studio',
  analytics:  'Analytics',
  testing:    'Test Center',
  handoff:    'Dev Handoff',
  releases:   'Release Center',
  tasks:      'Tasks',
  approvals:  'Approvals',
}

/**
 * Build a deep-link href for a graph node.
 *
 * @param basePath   e.g. "/acme/my-app" (no trailing slash)
 * @param kind       NodeKind from the graph
 * @param nodeId     The node's ID to pass as ?nodeId=
 */
export function nodeStudioHref(
  basePath: string,
  kind: NodeKind,
  nodeId: string,
): StudioLinkInfo {
  const studio = KIND_STUDIO[kind] ?? 'graph-explorer'
  const label  = STUDIO_LABELS[studio] ?? 'Graph Explorer'
  const href   = `${basePath}/${studio}?nodeId=${encodeURIComponent(nodeId)}`
  return { href, label, studio }
}
