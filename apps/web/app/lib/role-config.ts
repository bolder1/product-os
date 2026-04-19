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
    color: '#EF4444',
    studios: [
      'home',
      'planner', 'templates', 'canvas',
      'brand', 'components', 'design', 'workflow', 'pages', 'graphics',
      'code', 'handoff', 'releases', 'testing',
      'tasks', 'approvals', 'decisions', 'notifications', 'analytics',
      'roadmap', 'control-tower', 'graph-explorer', 'connectors', 'ai-skills', 'brand-compliance',
      'admin',
    ],
    dashboardWidgets: ['overview', 'analytics', 'tasks', 'approvals', 'releases', 'team', 'settings'],
  },
  manager: {
    label: 'Manager',
    description: 'Oversee planning, templates, tasks, approvals, and releases',
    icon: 'Briefcase',
    color: '#3B82F6',
    studios: ['home', 'planner', 'roadmap', 'templates', 'control-tower', 'tasks', 'approvals', 'decisions', 'analytics', 'releases', 'connectors'],
    dashboardWidgets: ['overview', 'analytics', 'tasks', 'approvals', 'releases'],
  },
  business_analyst: {
    label: 'Business Analyst',
    description: 'Analyze requirements, build canvases, and review templates',
    icon: 'BarChart3',
    color: '#8B5CF6',
    studios: ['home', 'planner', 'roadmap', 'templates', 'canvas', 'analytics', 'tasks', 'approvals', 'decisions'],
    dashboardWidgets: ['overview', 'analytics', 'tasks', 'approvals'],
  },
  qa: {
    label: 'QA Engineer',
    description: 'Manage testing, track bugs, and verify releases',
    icon: 'Bug',
    color: '#F59E0B',
    studios: ['home', 'testing', 'tasks', 'approvals', 'releases'],
    dashboardWidgets: ['testing', 'tasks', 'approvals', 'releases'],
  },
  product_designer: {
    label: 'Product Designer',
    description: 'Design brand, components, pages, and graphics',
    icon: 'Palette',
    color: '#EC4899',
    studios: ['home', 'brand', 'components', 'design', 'graphics', 'pages', 'tasks', 'brand-compliance'],
    dashboardWidgets: ['design', 'components', 'tasks', 'brand'],
  },
  frontend_dev: {
    label: 'Frontend Dev',
    description: 'Build components, pages, and implement handoff specs',
    icon: 'Code2',
    color: '#06B6D4',
    studios: ['home', 'components', 'pages', 'code', 'handoff', 'tasks'],
    dashboardWidgets: ['code', 'components', 'tasks', 'handoff'],
  },
  backend_dev: {
    label: 'Backend Dev',
    description: 'Build workflows, APIs, and implement handoff specs',
    icon: 'Server',
    color: '#10B981',
    studios: ['home', 'workflow', 'code', 'handoff', 'tasks'],
    dashboardWidgets: ['code', 'workflows', 'tasks', 'handoff'],
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to dashboards and analytics',
    icon: 'Eye',
    color: '#64748B',
    studios: ['home', 'control-tower', 'analytics'],
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
