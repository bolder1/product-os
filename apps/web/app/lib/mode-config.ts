/**
 * Mode-based Information Architecture (R3 of the revamp).
 *
 * Product OS reframes 36 studios across 8 workspaces into **5 Modes**:
 *   Plan · Build · Ship · Operate · Intelligence
 *
 * Each Mode owns ~5 primary studios; persistent rails (Memory, Living Graph,
 * Extensions, Decisions, Work Inbox) live outside Modes and appear at the
 * bottom of the sidebar regardless of Mode.
 *
 * Routes are kept compatible with the existing file-system routes — this
 * layer is a presentational re-grouping, not a route migration.
 *
 * See docs/revamp/01_information_architecture.md for full context.
 */

export type ModeKey = 'plan' | 'build' | 'ship' | 'operate' | 'intelligence'

export interface ModeStudio {
  key: string
  label: string
  /** Route slug appended to /:orgSlug/:productSlug/ */
  href: string
  /** Short description shown in Mode landing pages / tooltips */
  blurb?: string
}

export interface ModeDefinition {
  key: ModeKey
  label: string
  /** Lucide icon name */
  icon: string
  /** Single-line narrative for the Mode landing */
  tagline: string
  /** Studio landed on when switching to this Mode with no current studio */
  defaultHref: string
  studios: ModeStudio[]
}

export const modes: ModeDefinition[] = [
  {
    key: 'plan',
    label: 'Plan',
    icon: 'Compass',
    tagline: 'Capture intent. Shape the product graph.',
    defaultHref: 'workspace',
    studios: [
      { key: 'workspace', label: 'Workspace', href: 'workspace', blurb: 'What you are building now' },
      { key: 'planner', label: 'Planner', href: 'planner', blurb: 'Structured intent capture' },
      { key: 'canvas', label: 'Canvas', href: 'canvas', blurb: 'Visual journey maps' },
      { key: 'roadmap', label: 'Roadmap', href: 'roadmap', blurb: 'Sequenced delivery' },
      { key: 'memory', label: 'Memory', href: 'memory', blurb: 'Product knowledge base' },
    ],
  },
  {
    key: 'build',
    label: 'Build',
    icon: 'Layers',
    tagline: 'Design, model, and compose the product.',
    defaultHref: 'design',
    studios: [
      { key: 'workspace', label: 'Workspace', href: 'workspace', blurb: 'Resume active work' },
      { key: 'design', label: 'Design', href: 'design', blurb: 'Visual composition' },
      { key: 'components', label: 'Components', href: 'components', blurb: 'Reusable primitives' },
      { key: 'pages', label: 'Pages', href: 'pages', blurb: 'Screens and layouts' },
      { key: 'brand', label: 'Brand', href: 'brand', blurb: 'Foundations · Voice · Compliance' },
      { key: 'workflow', label: 'Workflows', href: 'workflows', blurb: 'Behavior and state' },
      { key: 'graphics', label: 'Graphics', href: 'graphics', blurb: 'Illustrations and assets' },
    ],
  },
  {
    key: 'ship',
    label: 'Ship',
    icon: 'Rocket',
    tagline: 'Generate, verify, and release.',
    defaultHref: 'releases',
    studios: [
      { key: 'workspace', label: 'Workspace', href: 'workspace', blurb: 'Resume active work' },
      { key: 'releases', label: 'Releases', href: 'releases', blurb: 'Cut and promote builds' },
      { key: 'testing', label: 'Testing', href: 'testing', blurb: 'Quality gates' },
      { key: 'handoff', label: 'Handoff', href: 'handoff', blurb: 'Spec packages' },
      { key: 'code', label: 'Code', href: 'code', blurb: 'Generated source' },
    ],
  },
  {
    key: 'operate',
    label: 'Operate',
    icon: 'Activity',
    tagline: 'Run the product. Watch the signals.',
    defaultHref: 'control-tower',
    studios: [
      { key: 'workspace', label: 'Workspace', href: 'workspace', blurb: 'Resume active work' },
      { key: 'control-tower', label: 'Control Tower', href: 'control-tower', blurb: 'Live product status' },
      { key: 'work', label: 'Work', href: 'work', blurb: 'Tasks · Approvals · Features' },
      { key: 'analytics', label: 'Analytics', href: 'analytics', blurb: 'Signal and insight' },
      { key: 'decisions', label: 'Decisions', href: 'decisions', blurb: 'Record of changes' },
    ],
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    icon: 'Sparkles',
    tagline: 'Configure the AI spine of your product.',
    defaultHref: 'cortex',
    studios: [
      { key: 'cortex', label: 'Cortex', href: 'cortex', blurb: 'AI command center' },
      { key: 'copilot', label: 'Copilot', href: 'cortex', blurb: 'Conversation home' },
      { key: 'extensions', label: 'Extensions', href: 'extensions', blurb: 'Connectors · MCP · AI Skills' },
      { key: 'computer-log', label: 'Computer Log', href: 'computer-log', blurb: 'AI action history' },
      { key: 'graph', label: 'Living Graph', href: 'graph', blurb: 'Product graph config' },
    ],
  },
]

/** Persistent rails — always visible regardless of Mode. */
export interface RailItem {
  key: string
  label: string
  href: string
  icon: string
}

export const persistentRails: RailItem[] = [
  { key: 'memory', label: 'Memory', href: 'memory', icon: 'BookOpen' },
  { key: 'graph', label: 'Living Graph', href: 'graph', icon: 'Network' },
  { key: 'extensions', label: 'Extensions', href: 'extensions', icon: 'Plug' },
  { key: 'decisions', label: 'Decisions', href: 'decisions', icon: 'ClipboardCheck' },
  { key: 'work', label: 'Work Inbox', href: 'work', icon: 'Inbox' },
]

/** Given a studio slug (3rd URL segment), find which Mode owns it. */
export function modeForStudio(studioHref: string): ModeKey {
  for (const mode of modes) {
    if (mode.studios.some((s) => s.href === studioHref)) return mode.key
  }
  // Persistent rails are reachable from every Mode; default anchor is Operate.
  if (persistentRails.some((r) => r.href === studioHref)) return 'operate'
  return 'plan'
}

export function getMode(key: ModeKey): ModeDefinition {
  return modes.find((m) => m.key === key) ?? modes[0]
}
