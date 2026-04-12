export type NodeKind =
  | 'module'
  | 'feature'
  | 'page'
  | 'entity'
  | 'component'
  | 'workflow'
  | 'token'
  | 'journey'

export type EdgeKind =
  | 'contains'
  | 'depends_on'
  | 'implements'
  | 'uses_component'
  | 'routes_to'

export interface GraphNode {
  id: string
  kind: NodeKind
  label: string
  x: number
  y: number
  data: Record<string, string>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  kind: EdgeKind
}

export interface MockGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export const NODE_KIND_COLORS: Record<NodeKind, string> = {
  module: '#3B82F6',
  feature: '#8B5CF6',
  page: '#06B6D4',
  entity: '#10B981',
  component: '#EC4899',
  workflow: '#F59E0B',
  token: '#64748B',
  journey: '#F97316',
}

export const NODE_KIND_LABELS: Record<NodeKind, string> = {
  module: 'Module',
  feature: 'Feature',
  page: 'Page',
  entity: 'Entity',
  component: 'Component',
  workflow: 'Workflow',
  token: 'Token',
  journey: 'Journey',
}

export const EDGE_KIND_LABELS: Record<EdgeKind, string> = {
  contains: 'Contains',
  depends_on: 'Depends On',
  implements: 'Implements',
  uses_component: 'Uses Component',
  routes_to: 'Routes To',
}

export const mockGraphData: MockGraphData = {
  nodes: [
    // Modules (2)
    { id: 'mod-auth', kind: 'module', label: 'Auth Module', x: 400, y: 200, data: { owner: 'Team Alpha', version: '2.1.0' } },
    { id: 'mod-dashboard', kind: 'module', label: 'Dashboard Module', x: 700, y: 200, data: { owner: 'Team Beta', version: '1.4.0' } },

    // Features (4)
    { id: 'feat-login', kind: 'feature', label: 'Login', x: 250, y: 350, data: { status: 'Shipped', sprint: 'S-12' } },
    { id: 'feat-signup', kind: 'feature', label: 'Sign Up', x: 450, y: 380, data: { status: 'Shipped', sprint: 'S-11' } },
    { id: 'feat-analytics', kind: 'feature', label: 'Analytics View', x: 650, y: 350, data: { status: 'In Progress', sprint: 'S-14' } },
    { id: 'feat-settings', kind: 'feature', label: 'User Settings', x: 850, y: 380, data: { status: 'Planned', sprint: 'S-15' } },

    // Pages (3)
    { id: 'page-login', kind: 'page', label: '/login', x: 200, y: 500, data: { route: '/login', layout: 'auth' } },
    { id: 'page-dashboard', kind: 'page', label: '/dashboard', x: 600, y: 500, data: { route: '/dashboard', layout: 'app' } },
    { id: 'page-settings', kind: 'page', label: '/settings', x: 900, y: 500, data: { route: '/settings', layout: 'app' } },

    // Entities (3)
    { id: 'ent-user', kind: 'entity', label: 'User', x: 350, y: 550, data: { fields: '12', relations: '5' } },
    { id: 'ent-session', kind: 'entity', label: 'Session', x: 500, y: 600, data: { fields: '6', relations: '2' } },
    { id: 'ent-org', kind: 'entity', label: 'Organization', x: 750, y: 580, data: { fields: '8', relations: '4' } },

    // Components (3)
    { id: 'comp-form', kind: 'component', label: 'FormBuilder', x: 150, y: 400, data: { variants: '3', props: '8' } },
    { id: 'comp-chart', kind: 'component', label: 'ChartWidget', x: 700, y: 440, data: { variants: '5', props: '12' } },
    { id: 'comp-table', kind: 'component', label: 'DataTable', x: 850, y: 460, data: { variants: '2', props: '10' } },

    // Workflows (2)
    { id: 'wf-onboard', kind: 'workflow', label: 'Onboarding Flow', x: 450, y: 700, data: { steps: '5', triggers: '2' } },
    { id: 'wf-notify', kind: 'workflow', label: 'Notification Dispatch', x: 700, y: 700, data: { steps: '3', triggers: '4' } },

    // Tokens (2)
    { id: 'tok-color', kind: 'token', label: 'Color Tokens', x: 300, y: 150, data: { count: '24', theme: 'dark' } },
    { id: 'tok-spacing', kind: 'token', label: 'Spacing Tokens', x: 550, y: 130, data: { count: '12', theme: 'global' } },

    // Journey (1)
    { id: 'journey-signup', kind: 'journey', label: 'New User Signup', x: 500, y: 80, data: { steps: '6', conversion: '42%' } },
  ],
  edges: [
    // Module contains features
    { id: 'e-01', source: 'mod-auth', target: 'feat-login', kind: 'contains' },
    { id: 'e-02', source: 'mod-auth', target: 'feat-signup', kind: 'contains' },
    { id: 'e-03', source: 'mod-dashboard', target: 'feat-analytics', kind: 'contains' },
    { id: 'e-04', source: 'mod-dashboard', target: 'feat-settings', kind: 'contains' },

    // Features implement pages
    { id: 'e-05', source: 'feat-login', target: 'page-login', kind: 'implements' },
    { id: 'e-06', source: 'feat-analytics', target: 'page-dashboard', kind: 'implements' },
    { id: 'e-07', source: 'feat-settings', target: 'page-settings', kind: 'implements' },

    // Pages use components
    { id: 'e-08', source: 'page-login', target: 'comp-form', kind: 'uses_component' },
    { id: 'e-09', source: 'page-dashboard', target: 'comp-chart', kind: 'uses_component' },
    { id: 'e-10', source: 'page-dashboard', target: 'comp-table', kind: 'uses_component' },
    { id: 'e-11', source: 'page-settings', target: 'comp-form', kind: 'uses_component' },
    { id: 'e-12', source: 'page-settings', target: 'comp-table', kind: 'uses_component' },

    // Entity dependencies
    { id: 'e-13', source: 'feat-login', target: 'ent-user', kind: 'depends_on' },
    { id: 'e-14', source: 'feat-login', target: 'ent-session', kind: 'depends_on' },
    { id: 'e-15', source: 'feat-signup', target: 'ent-user', kind: 'depends_on' },
    { id: 'e-16', source: 'feat-signup', target: 'ent-org', kind: 'depends_on' },
    { id: 'e-17', source: 'feat-analytics', target: 'ent-org', kind: 'depends_on' },

    // Routes
    { id: 'e-18', source: 'page-login', target: 'page-dashboard', kind: 'routes_to' },
    { id: 'e-19', source: 'page-dashboard', target: 'page-settings', kind: 'routes_to' },

    // Workflows
    { id: 'e-20', source: 'wf-onboard', target: 'ent-user', kind: 'depends_on' },
    { id: 'e-21', source: 'wf-onboard', target: 'feat-signup', kind: 'depends_on' },
    { id: 'e-22', source: 'wf-notify', target: 'ent-user', kind: 'depends_on' },
    { id: 'e-23', source: 'wf-notify', target: 'ent-org', kind: 'depends_on' },

    // Journey
    { id: 'e-24', source: 'journey-signup', target: 'feat-signup', kind: 'depends_on' },
    { id: 'e-25', source: 'journey-signup', target: 'wf-onboard', kind: 'depends_on' },
  ],
}
