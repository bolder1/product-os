export type OrgRole =
  | 'admin'
  | 'manager'
  | 'business_analyst'
  | 'qa'
  | 'product_designer'
  | 'frontend_dev'
  | 'backend_dev'
  | 'viewer'

export interface RoleConfig {
  label: string
  description: string
  icon: string
  color: string
  studios: string[]
  dashboardWidgets: string[]
}

export const roleConfigs: Record<OrgRole, RoleConfig> = {
  admin: {
    label: 'Admin',
    description: 'Full access to all studios, settings, and admin panel',
    icon: 'Shield',
    color: 'var(--accent)',
    studios: [
      'home', 'agenda',
      'planner', 'roadmap', 'memory', 'templates', 'canvas',
      'brand', 'components', 'design', 'workflow', 'pages', 'graphics',
      'code', 'handoff', 'releases', 'testing',
      'tasks', 'approvals', 'decisions', 'notifications', 'analytics',
      'control-tower', 'graph-explorer', 'graph', 'connectors', 'cortex', 'ai-skills', 'brand-compliance',
      'admin',
    ],
    dashboardWidgets: ['overview', 'analytics', 'tasks', 'approvals', 'releases', 'team', 'settings'],
  },
  manager: {
    label: 'Manager',
    description: 'Oversee planning, templates, tasks, approvals, and releases',
    icon: 'Briefcase',
    color: 'var(--accent)',
    studios: ['home', 'agenda', 'planner', 'roadmap', 'memory', 'templates', 'control-tower', 'graph', 'tasks', 'approvals', 'decisions', 'analytics', 'releases', 'connectors'],
    dashboardWidgets: ['overview', 'analytics', 'tasks', 'approvals', 'releases'],
  },
  business_analyst: {
    label: 'Business Analyst',
    description: 'Analyze requirements, build canvases, and review templates',
    icon: 'BarChart3',
    color: 'var(--accent)',
    studios: ['home', 'agenda', 'planner', 'roadmap', 'memory', 'templates', 'canvas', 'analytics', 'tasks', 'approvals', 'decisions'],
    dashboardWidgets: ['overview', 'analytics', 'tasks', 'approvals'],
  },
  qa: {
    label: 'QA Engineer',
    description: 'Manage testing, track bugs, and verify releases',
    icon: 'Bug',
    color: 'var(--accent)',
    studios: ['home', 'agenda', 'testing', 'tasks', 'approvals', 'releases'],
    dashboardWidgets: ['testing', 'tasks', 'approvals', 'releases'],
  },
  product_designer: {
    label: 'Product Designer',
    description: 'Design brand, components, pages, and graphics',
    icon: 'Palette',
    color: 'var(--accent)',
    studios: ['home', 'agenda', 'memory', 'brand', 'components', 'design', 'graphics', 'pages', 'tasks', 'brand-compliance'],
    dashboardWidgets: ['design', 'components', 'tasks', 'brand'],
  },
  frontend_dev: {
    label: 'Frontend Dev',
    description: 'Build components, pages, and implement handoff specs',
    icon: 'Code2',
    color: 'var(--accent)',
    studios: ['home', 'agenda', 'components', 'pages', 'code', 'handoff', 'tasks'],
    dashboardWidgets: ['code', 'components', 'tasks', 'handoff'],
  },
  backend_dev: {
    label: 'Backend Dev',
    description: 'Build workflows, APIs, and implement handoff specs',
    icon: 'Server',
    color: 'var(--accent)',
    studios: ['home', 'agenda', 'workflow', 'code', 'handoff', 'tasks'],
    dashboardWidgets: ['code', 'workflows', 'tasks', 'handoff'],
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to dashboards and analytics',
    icon: 'Eye',
    color: 'var(--text-tertiary)',
    studios: ['home', 'agenda', 'control-tower', 'analytics'],
    dashboardWidgets: ['overview', 'analytics'],
  },
}

export function getStudioAccess(role: OrgRole): string[] {
  return roleConfigs[role].studios
}

export function hasStudioAccess(role: OrgRole, studioKey: string): boolean {
  if (role === 'admin') return true
  return roleConfigs[role].studios.includes(studioKey)
}

export function getRoleLabel(role: OrgRole): string {
  return roleConfigs[role].label
}
