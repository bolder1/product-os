export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assignee: { name: string; initials: string; color: string }
  dueDate: string
  linkedNode?: { kind: string; label: string }
  createdAt: string
}

export type TaskStatus = Task['status']
export type TaskPriority = Task['priority']

// R20.6 — status/priority map to semantic tokens (color) + pre-composed
// Tailwind class pairs (pill) to avoid template-literal concatenation.
export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dotColor: string; pill: string }> = {
  todo:        { label: 'Todo',        color: 'var(--text-tertiary)', dotColor: 'var(--text-tertiary)', pill: 'bg-[var(--bg-inset)] text-[var(--text-tertiary)]' },
  in_progress: { label: 'In Progress', color: 'var(--accent)',        dotColor: 'var(--accent)',        pill: 'bg-[var(--accent-subtle)] text-[var(--accent-text)]' },
  in_review:   { label: 'In Review',   color: 'var(--color-warning)', dotColor: 'var(--color-warning)', pill: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]' },
  done:        { label: 'Done',        color: 'var(--color-success)', dotColor: 'var(--color-success)', pill: 'bg-[var(--color-success-muted)] text-[var(--color-success)]' },
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; pill: string }> = {
  critical: { label: 'Critical', color: 'var(--color-error)',   pill: 'bg-[var(--color-error-muted)] text-[var(--color-error)]' },
  high:     { label: 'High',     color: 'var(--color-warning)', pill: 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]' },
  medium:   { label: 'Medium',   color: 'var(--accent)',        pill: 'bg-[var(--accent-subtle)] text-[var(--accent-text)]' },
  low:      { label: 'Low',      color: 'var(--text-tertiary)', pill: 'bg-[var(--bg-inset)] text-[var(--text-tertiary)]' },
}

export const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done']
export const PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low']

export const mockTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Implement user authentication',
    description: 'Build login/signup flow with OAuth2 and email/password support including session management.',
    status: 'in_progress',
    priority: 'critical',
    assignee: { name: 'Alice Chen', initials: 'AC', color: 'var(--accent)' },
    dueDate: '2026-04-02',
    linkedNode: { kind: 'Feature', label: 'Auth Module' },
    createdAt: '2026-03-20',
  },
  {
    id: 'task-002',
    title: 'Design dashboard layout',
    description: 'Create high-fidelity mockups for the main dashboard with widget grid and analytics overview.',
    status: 'in_review',
    priority: 'high',
    assignee: { name: 'Bob Rivera', initials: 'BR', color: 'var(--accent)' },
    dueDate: '2026-03-30',
    linkedNode: { kind: 'Page', label: 'Dashboard' },
    createdAt: '2026-03-18',
  },
  {
    id: 'task-003',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing, linting, and deployment to staging.',
    status: 'todo',
    priority: 'medium',
    assignee: { name: 'Charlie Kim', initials: 'CK', color: 'var(--accent)' },
    dueDate: '2026-04-05',
    linkedNode: { kind: 'System', label: 'DevOps' },
    createdAt: '2026-03-22',
  },
  {
    id: 'task-004',
    title: 'Write API documentation',
    description: 'Document all REST endpoints with request/response schemas using OpenAPI spec.',
    status: 'todo',
    priority: 'low',
    assignee: { name: 'Dana Patel', initials: 'DP', color: 'var(--accent)' },
    dueDate: '2026-04-10',
    linkedNode: { kind: 'Document', label: 'API Docs' },
    createdAt: '2026-03-21',
  },
  {
    id: 'task-005',
    title: 'Fix navigation bug',
    description: 'Sidebar collapses unexpectedly on route change in Firefox and Safari browsers.',
    status: 'in_progress',
    priority: 'high',
    assignee: { name: 'Eve Santos', initials: 'ES', color: 'var(--accent)' },
    dueDate: '2026-03-29',
    linkedNode: { kind: 'Bug', label: 'NAV-142' },
    createdAt: '2026-03-25',
  },
  {
    id: 'task-006',
    title: 'Create onboarding flow',
    description: 'Build a 4-step onboarding wizard for new users including org setup and team invite.',
    status: 'todo',
    priority: 'medium',
    assignee: { name: 'Alice Chen', initials: 'AC', color: 'var(--accent)' },
    dueDate: '2026-04-08',
    linkedNode: { kind: 'Feature', label: 'Onboarding' },
    createdAt: '2026-03-23',
  },
  {
    id: 'task-007',
    title: 'Optimize database queries',
    description: 'Add indexes and rewrite N+1 queries in the product listing and graph explorer modules.',
    status: 'in_review',
    priority: 'medium',
    assignee: { name: 'Charlie Kim', initials: 'CK', color: 'var(--accent)' },
    dueDate: '2026-04-01',
    linkedNode: { kind: 'System', label: 'Database' },
    createdAt: '2026-03-19',
  },
  {
    id: 'task-008',
    title: 'Add search functionality',
    description: 'Implement full-text search across tasks, documents, and graph nodes with fuzzy matching.',
    status: 'todo',
    priority: 'high',
    assignee: { name: 'Bob Rivera', initials: 'BR', color: 'var(--accent)' },
    dueDate: '2026-04-04',
    linkedNode: { kind: 'Feature', label: 'Search' },
    createdAt: '2026-03-24',
  },
  {
    id: 'task-009',
    title: 'Deploy staging environment',
    description: 'Provision and deploy the full stack to the staging environment with seed data.',
    status: 'done',
    priority: 'critical',
    assignee: { name: 'Charlie Kim', initials: 'CK', color: 'var(--accent)' },
    dueDate: '2026-03-26',
    linkedNode: { kind: 'System', label: 'Infrastructure' },
    createdAt: '2026-03-15',
  },
  {
    id: 'task-010',
    title: 'User testing round 1',
    description: 'Conduct usability testing sessions with 5 participants on the core workflow.',
    status: 'done',
    priority: 'medium',
    assignee: { name: 'Dana Patel', initials: 'DP', color: 'var(--accent)' },
    dueDate: '2026-03-27',
    linkedNode: { kind: 'Milestone', label: 'Beta Feedback' },
    createdAt: '2026-03-16',
  },
  {
    id: 'task-011',
    title: 'Brand guidelines doc',
    description: 'Compile typography, color palette, logo usage, and tone of voice into a brand guide.',
    status: 'done',
    priority: 'low',
    assignee: { name: 'Eve Santos', initials: 'ES', color: 'var(--accent)' },
    dueDate: '2026-03-25',
    linkedNode: { kind: 'Document', label: 'Brand Guide' },
    createdAt: '2026-03-14',
  },
  {
    id: 'task-012',
    title: 'Mobile responsive fixes',
    description: 'Fix layout breakpoints and touch targets for screens below 768px across all pages.',
    status: 'todo',
    priority: 'high',
    assignee: { name: 'Eve Santos', initials: 'ES', color: 'var(--accent)' },
    dueDate: '2026-04-03',
    linkedNode: { kind: 'Bug', label: 'RES-087' },
    createdAt: '2026-03-26',
  },
]
