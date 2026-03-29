export type ReleaseStatus = 'draft' | 'staging' | 'production' | 'rolled-back'

export interface ReleaseChange {
  name: string
  type: 'component' | 'page' | 'api' | 'config' | 'style'
  changeType: 'added' | 'modified' | 'removed'
}

export interface ReleaseChecklist {
  qa: boolean
  stakeholder: boolean
  docs: boolean
  migration: boolean
}

export interface Release {
  id: string
  version: string
  title: string
  status: ReleaseStatus
  date: string
  notes: string
  changes: ReleaseChange[]
  checklist: ReleaseChecklist
}

export const statusConfig: Record<ReleaseStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
  staging: { label: 'Staging', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  production: { label: 'Production', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  'rolled-back': { label: 'Rolled Back', color: '#F43F5E', bg: 'rgba(244,63,94,0.1)' },
}

export const changeTypeConfig: Record<string, { label: string; color: string }> = {
  added: { label: 'Added', color: '#10B981' },
  modified: { label: 'Modified', color: '#F59E0B' },
  removed: { label: 'Removed', color: '#F43F5E' },
}

export const mockReleases: Release[] = [
  {
    id: 'rel-001',
    version: 'v2.1.0',
    title: 'AI-Powered Workflows',
    status: 'draft',
    date: '2026-03-29',
    notes: `### What's New\n\n- **AI Workflow Suggestions**: OpsPilot now suggests optimal workflow configurations based on team patterns and historical data.\n- **Smart Task Routing**: Tasks are automatically assigned based on team member expertise and current workload.\n- **Template Intelligence**: Templates now adapt their content based on the product context and stage.\n\n### Improvements\n\n- Reduced graph query latency by 40%\n- Updated design token system with new semantic naming\n- Better error handling in the publishing pipeline`,
    changes: [
      { name: 'AI Workflow Engine', type: 'component', changeType: 'added' },
      { name: 'Task Router', type: 'api', changeType: 'added' },
      { name: 'Template Adapter', type: 'component', changeType: 'added' },
      { name: 'Graph Query Optimizer', type: 'api', changeType: 'modified' },
      { name: 'Design Token Schema', type: 'config', changeType: 'modified' },
      { name: 'Publishing Pipeline', type: 'api', changeType: 'modified' },
    ],
    checklist: { qa: false, stakeholder: false, docs: false, migration: false },
  },
  {
    id: 'rel-002',
    version: 'v2.0.1',
    title: 'Hotfix: Auth Session',
    status: 'staging',
    date: '2026-03-25',
    notes: `### Bug Fixes\n\n- Fixed session expiration not refreshing tokens correctly\n- Resolved race condition in concurrent API calls\n- Patched XSS vulnerability in markdown renderer`,
    changes: [
      { name: 'Auth Session Handler', type: 'api', changeType: 'modified' },
      { name: 'Token Refresh Logic', type: 'api', changeType: 'modified' },
      { name: 'Markdown Renderer', type: 'component', changeType: 'modified' },
    ],
    checklist: { qa: true, stakeholder: true, docs: false, migration: false },
  },
  {
    id: 'rel-003',
    version: 'v2.0.0',
    title: 'Product OS 2.0 Launch',
    status: 'production',
    date: '2026-03-15',
    notes: `### Major Release\n\n- Complete UI redesign with new dark theme\n- Graph-based data model replaces flat structures\n- 26 studios fully integrated\n- OpsPilot AI assistant for all workflows\n- Real-time collaboration via WebSocket\n\n### Breaking Changes\n\n- API v1 endpoints deprecated\n- New authentication flow required\n- Database migration from v1 schema`,
    changes: [
      { name: 'UI Theme System', type: 'style', changeType: 'added' },
      { name: 'Graph Data Model', type: 'api', changeType: 'added' },
      { name: 'Studio Framework', type: 'component', changeType: 'added' },
      { name: 'OpsPilot AI', type: 'component', changeType: 'added' },
      { name: 'WebSocket Layer', type: 'api', changeType: 'added' },
      { name: 'API v1 Routes', type: 'api', changeType: 'removed' },
      { name: 'Legacy Auth', type: 'api', changeType: 'removed' },
      { name: 'Dashboard Layout', type: 'page', changeType: 'modified' },
    ],
    checklist: { qa: true, stakeholder: true, docs: true, migration: true },
  },
  {
    id: 'rel-004',
    version: 'v1.2.0',
    title: 'Analytics & Reporting',
    status: 'production',
    date: '2026-02-28',
    notes: `### Features\n\n- New analytics dashboard with real-time charts\n- Export reports as PDF and CSV\n- Custom date range filters\n- Team performance metrics`,
    changes: [
      { name: 'Analytics Dashboard', type: 'page', changeType: 'added' },
      { name: 'Report Exporter', type: 'component', changeType: 'added' },
      { name: 'Date Filter Widget', type: 'component', changeType: 'added' },
      { name: 'Metrics API', type: 'api', changeType: 'added' },
    ],
    checklist: { qa: true, stakeholder: true, docs: true, migration: true },
  },
  {
    id: 'rel-005',
    version: 'v1.1.0',
    title: 'Collaboration Features',
    status: 'rolled-back',
    date: '2026-02-10',
    notes: `### Features (Rolled Back)\n\n- Real-time cursors for multi-user editing\n- Comment threads on any graph node\n- @mention notifications\n\n### Rollback Reason\n\nCritical performance degradation under load. WebSocket connections causing memory leaks in production. Rolled back pending optimization.`,
    changes: [
      { name: 'Real-time Cursors', type: 'component', changeType: 'added' },
      { name: 'Comment System', type: 'component', changeType: 'added' },
      { name: 'Notification Service', type: 'api', changeType: 'added' },
      { name: 'User Presence API', type: 'api', changeType: 'added' },
    ],
    checklist: { qa: true, stakeholder: true, docs: true, migration: false },
  },
]
