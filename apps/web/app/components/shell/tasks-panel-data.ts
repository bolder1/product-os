export interface PanelTask {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assignee: { name: string; initials: string }
  dueDate: string
  studio: string
  feature?: string
  description?: string
  role?: string
}

export const panelTasks: PanelTask[] = [
  {
    id: 'pt-001',
    title: 'Finalize brand color tokens',
    status: 'in_progress',
    priority: 'high',
    assignee: { name: 'Eve Santos', initials: 'ES' },
    dueDate: '2026-03-30',
    studio: 'brand',
    feature: 'Brand System',
    description: 'Export finalized color tokens from the brand palette into the design system variables for consistent theming across all studios.',
    role: 'Designer',
  },
  {
    id: 'pt-002',
    title: 'Review workflow state machine for checkout',
    status: 'in_review',
    priority: 'critical',
    assignee: { name: 'Alice Chen', initials: 'AC' },
    dueDate: '2026-03-29',
    studio: 'workflows',
    feature: 'Checkout Flow',
    description: 'Verify the state transitions in the checkout workflow cover all edge cases including payment failures and retry logic.',
    role: 'BA',
  },
  {
    id: 'pt-003',
    title: 'Build hero section component variant',
    status: 'in_progress',
    priority: 'medium',
    assignee: { name: 'Bob Rivera', initials: 'BR' },
    dueDate: '2026-04-01',
    studio: 'components',
    feature: 'Landing Page Kit',
    description: 'Create the dark-mode hero section variant with animated gradient background and CTA button group.',
    role: 'FE Developer',
  },
  {
    id: 'pt-004',
    title: 'Write test cases for auth module',
    status: 'todo',
    priority: 'high',
    assignee: { name: 'Charlie Kim', initials: 'CK' },
    dueDate: '2026-04-03',
    studio: 'testing',
    feature: 'Auth Module',
    description: 'Cover login, signup, password reset, and OAuth flows with integration and unit tests.',
    role: 'QA',
  },
  {
    id: 'pt-005',
    title: 'Design mobile navigation patterns',
    status: 'todo',
    priority: 'medium',
    assignee: { name: 'Dana Patel', initials: 'DP' },
    dueDate: '2026-04-05',
    studio: 'design',
    feature: 'Responsive System',
    description: 'Create mobile-first navigation patterns including bottom tab bar and hamburger menu with gesture support.',
    role: 'Designer',
  },
  {
    id: 'pt-006',
    title: 'Set up analytics event tracking',
    status: 'in_progress',
    priority: 'low',
    assignee: { name: 'Charlie Kim', initials: 'CK' },
    dueDate: '2026-04-07',
    studio: 'analytics',
    feature: 'Tracking Pipeline',
    description: 'Implement event tracking hooks across key user actions: page views, feature usage, and conversion funnels.',
    role: 'BE Developer',
  },
  {
    id: 'pt-007',
    title: 'Approve release candidate v0.2',
    status: 'in_review',
    priority: 'critical',
    assignee: { name: 'Alice Chen', initials: 'AC' },
    dueDate: '2026-03-31',
    studio: 'approvals',
    feature: 'Release Pipeline',
    description: 'Review and approve the release candidate for v0.2 including changelog verification and smoke test sign-off.',
    role: 'Manager',
  },
  {
    id: 'pt-008',
    title: 'Create product landing page layout',
    status: 'todo',
    priority: 'high',
    assignee: { name: 'Bob Rivera', initials: 'BR' },
    dueDate: '2026-04-02',
    studio: 'pages',
    feature: 'Marketing Site',
    description: 'Assemble the product landing page using pre-built sections: hero, features grid, testimonials, pricing, and footer.',
    role: 'FE Developer',
  },
]
