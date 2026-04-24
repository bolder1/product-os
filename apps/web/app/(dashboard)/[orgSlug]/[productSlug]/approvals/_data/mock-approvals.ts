export interface ApprovalApprover {
  name: string
  initials: string
  color: string
  decision: 'approved' | 'rejected' | 'changes_requested' | 'pending'
  comment?: string
  decidedAt?: string
}

export interface ApprovalEvent {
  id: string
  action: 'created' | 'reviewed' | 'approved' | 'rejected' | 'changes_requested' | 'commented'
  actor: string
  comment?: string
  timestamp: string
}

export interface Approval {
  id: string
  objectName: string
  objectType: 'feature' | 'component' | 'page' | 'schema' | 'palette' | 'layout'
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested'
  requester: { name: string; initials: string; color: string }
  approvers: ApprovalApprover[]
  routing: 'sequential' | 'parallel'
  message: string
  createdAt: string
  timeline: ApprovalEvent[]
}

export const mockApprovals: Approval[] = [
  {
    id: 'apr-001',
    objectName: 'User Auth Feature',
    objectType: 'feature',
    status: 'approved',
    requester: { name: 'Surajit Das', initials: 'SD', color: 'var(--accent)' },
    approvers: [
      {
        name: 'Priya Sharma',
        initials: 'PS',
        color: 'var(--accent)',
        decision: 'approved',
        comment: 'Auth flow looks solid. LGTM.',
        decidedAt: '2026-03-27T14:30:00Z',
      },
      {
        name: 'Arjun Mehta',
        initials: 'AM',
        color: 'var(--color-success)',
        decision: 'approved',
        comment: 'Tested against edge cases. Approved.',
        decidedAt: '2026-03-27T16:10:00Z',
      },
    ],
    routing: 'parallel',
    message: 'Ready for review: OAuth + magic link auth feature with session management.',
    createdAt: '2026-03-26T09:00:00Z',
    timeline: [
      { id: 'e1', action: 'created', actor: 'Surajit Das', timestamp: '2026-03-26T09:00:00Z' },
      { id: 'e2', action: 'reviewed', actor: 'Priya Sharma', comment: 'Auth flow looks solid. LGTM.', timestamp: '2026-03-27T14:30:00Z' },
      { id: 'e3', action: 'approved', actor: 'Priya Sharma', timestamp: '2026-03-27T14:30:00Z' },
      { id: 'e4', action: 'approved', actor: 'Arjun Mehta', comment: 'Tested against edge cases. Approved.', timestamp: '2026-03-27T16:10:00Z' },
    ],
  },
  {
    id: 'apr-002',
    objectName: 'Dashboard Component',
    objectType: 'component',
    status: 'pending',
    requester: { name: 'Priya Sharma', initials: 'PS', color: 'var(--accent)' },
    approvers: [
      {
        name: 'Surajit Das',
        initials: 'SD',
        color: 'var(--accent)',
        decision: 'approved',
        comment: 'Looks great, nice animations.',
        decidedAt: '2026-03-28T11:20:00Z',
      },
      {
        name: 'Neha Gupta',
        initials: 'NG',
        color: 'var(--color-error)',
        decision: 'pending',
      },
    ],
    routing: 'sequential',
    message: 'Dashboard analytics widget with real-time charts. Needs design + eng sign-off.',
    createdAt: '2026-03-27T10:00:00Z',
    timeline: [
      { id: 'e1', action: 'created', actor: 'Priya Sharma', timestamp: '2026-03-27T10:00:00Z' },
      { id: 'e2', action: 'approved', actor: 'Surajit Das', comment: 'Looks great, nice animations.', timestamp: '2026-03-28T11:20:00Z' },
    ],
  },
  {
    id: 'apr-003',
    objectName: 'Brand Color Palette',
    objectType: 'palette',
    status: 'changes_requested',
    requester: { name: 'Neha Gupta', initials: 'NG', color: 'var(--color-error)' },
    approvers: [
      {
        name: 'Surajit Das',
        initials: 'SD',
        color: 'var(--accent)',
        decision: 'changes_requested',
        comment: 'Contrast ratio fails WCAG AA on secondary colors. Please adjust.',
        decidedAt: '2026-03-28T15:45:00Z',
      },
    ],
    routing: 'sequential',
    message: 'Updated brand palette for v2 with new accent colors.',
    createdAt: '2026-03-28T08:00:00Z',
    timeline: [
      { id: 'e1', action: 'created', actor: 'Neha Gupta', timestamp: '2026-03-28T08:00:00Z' },
      { id: 'e2', action: 'changes_requested', actor: 'Surajit Das', comment: 'Contrast ratio fails WCAG AA on secondary colors. Please adjust.', timestamp: '2026-03-28T15:45:00Z' },
    ],
  },
  {
    id: 'apr-004',
    objectName: 'API Schema v2',
    objectType: 'schema',
    status: 'pending',
    requester: { name: 'Arjun Mehta', initials: 'AM', color: 'var(--color-success)' },
    approvers: [
      { name: 'Surajit Das', initials: 'SD', color: 'var(--accent)', decision: 'pending' },
      { name: 'Priya Sharma', initials: 'PS', color: 'var(--accent)', decision: 'pending' },
      { name: 'Neha Gupta', initials: 'NG', color: 'var(--color-error)', decision: 'pending' },
    ],
    routing: 'parallel',
    message: 'Breaking schema changes for v2 API. Need all leads to sign off before migration.',
    createdAt: '2026-03-29T07:00:00Z',
    timeline: [
      { id: 'e1', action: 'created', actor: 'Arjun Mehta', timestamp: '2026-03-29T07:00:00Z' },
    ],
  },
  {
    id: 'apr-005',
    objectName: 'Mobile Nav Component',
    objectType: 'component',
    status: 'rejected',
    requester: { name: 'Surajit Das', initials: 'SD', color: 'var(--accent)' },
    approvers: [
      {
        name: 'Neha Gupta',
        initials: 'NG',
        color: 'var(--color-error)',
        decision: 'rejected',
        comment: 'Navigation pattern conflicts with the design system. Needs rework.',
        decidedAt: '2026-03-27T13:00:00Z',
      },
    ],
    routing: 'sequential',
    message: 'Hamburger menu with slide-in drawer for mobile responsive layout.',
    createdAt: '2026-03-26T16:00:00Z',
    timeline: [
      { id: 'e1', action: 'created', actor: 'Surajit Das', timestamp: '2026-03-26T16:00:00Z' },
      { id: 'e2', action: 'reviewed', actor: 'Neha Gupta', timestamp: '2026-03-27T12:00:00Z' },
      { id: 'e3', action: 'rejected', actor: 'Neha Gupta', comment: 'Navigation pattern conflicts with the design system. Needs rework.', timestamp: '2026-03-27T13:00:00Z' },
    ],
  },
  {
    id: 'apr-006',
    objectName: 'Pricing Page Layout',
    objectType: 'page',
    status: 'approved',
    requester: { name: 'Priya Sharma', initials: 'PS', color: 'var(--accent)' },
    approvers: [
      {
        name: 'Surajit Das',
        initials: 'SD',
        color: 'var(--accent)',
        decision: 'approved',
        comment: 'Clean layout. Ship it.',
        decidedAt: '2026-03-25T10:00:00Z',
      },
      {
        name: 'Arjun Mehta',
        initials: 'AM',
        color: 'var(--color-success)',
        decision: 'approved',
        comment: 'Pricing tiers look good.',
        decidedAt: '2026-03-25T11:30:00Z',
      },
      {
        name: 'Neha Gupta',
        initials: 'NG',
        color: 'var(--color-error)',
        decision: 'approved',
        comment: 'Approved from design side.',
        decidedAt: '2026-03-25T14:00:00Z',
      },
    ],
    routing: 'parallel',
    message: 'Final pricing page layout with 3-tier plan comparison and FAQ accordion.',
    createdAt: '2026-03-24T09:00:00Z',
    timeline: [
      { id: 'e1', action: 'created', actor: 'Priya Sharma', timestamp: '2026-03-24T09:00:00Z' },
      { id: 'e2', action: 'approved', actor: 'Surajit Das', comment: 'Clean layout. Ship it.', timestamp: '2026-03-25T10:00:00Z' },
      { id: 'e3', action: 'approved', actor: 'Arjun Mehta', comment: 'Pricing tiers look good.', timestamp: '2026-03-25T11:30:00Z' },
      { id: 'e4', action: 'approved', actor: 'Neha Gupta', comment: 'Approved from design side.', timestamp: '2026-03-25T14:00:00Z' },
    ],
  },
]

export const mockGraphNodes = [
  { id: 'node-1', name: 'User Auth Feature', type: 'feature' },
  { id: 'node-2', name: 'Dashboard Component', type: 'component' },
  { id: 'node-3', name: 'Brand Color Palette', type: 'palette' },
  { id: 'node-4', name: 'API Schema v2', type: 'schema' },
  { id: 'node-5', name: 'Mobile Nav Component', type: 'component' },
  { id: 'node-6', name: 'Pricing Page Layout', type: 'page' },
  { id: 'node-7', name: 'Onboarding Flow', type: 'feature' },
  { id: 'node-8', name: 'Settings Panel', type: 'component' },
  { id: 'node-9', name: 'Search Results Page', type: 'page' },
]

export const mockTeamMembers = [
  { id: 'tm-1', name: 'Surajit Das', initials: 'SD', color: 'var(--accent)' },
  { id: 'tm-2', name: 'Priya Sharma', initials: 'PS', color: 'var(--accent)' },
  { id: 'tm-3', name: 'Arjun Mehta', initials: 'AM', color: 'var(--color-success)' },
  { id: 'tm-4', name: 'Neha Gupta', initials: 'NG', color: 'var(--color-error)' },
  { id: 'tm-5', name: 'Rohan Patel', initials: 'RP', color: 'var(--color-warning)' },
]
