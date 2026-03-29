export interface HandoffSpec {
  property: string
  type: string
  value: string
  description: string
}

export interface DesignToken {
  name: string
  value: string
  type: 'color' | 'spacing' | 'typography' | 'radius'
}

export interface HandoffItem {
  id: string
  name: string
  type: 'component' | 'page' | 'token'
  completeness: number
  previewColor: string
  specs: HandoffSpec[]
  tokens: DesignToken[]
  criteria: { text: string; done: boolean }[]
}

export const mockHandoffs: HandoffItem[] = [
  {
    id: 'h-001',
    name: 'Button',
    type: 'component',
    completeness: 95,
    previewColor: '#3B82F6',
    specs: [
      { property: 'padding', type: 'spacing', value: '10px 20px', description: 'Internal padding for default size' },
      { property: 'border-radius', type: 'radius', value: '12px', description: 'Rounded corners for pill shape' },
      { property: 'font-size', type: 'typography', value: '14px', description: 'Default label font size' },
      { property: 'font-weight', type: 'typography', value: '600', description: 'Semi-bold for emphasis' },
      { property: 'height', type: 'spacing', value: '40px', description: 'Default button height' },
      { property: 'min-width', type: 'spacing', value: '80px', description: 'Minimum touch target width' },
    ],
    tokens: [
      { name: '--btn-primary', value: '#3B82F6', type: 'color' },
      { name: '--btn-hover', value: '#2563EB', type: 'color' },
      { name: '--btn-radius', value: '12px', type: 'radius' },
      { name: '--btn-padding', value: '10px 20px', type: 'spacing' },
    ],
    criteria: [
      { text: 'Renders correctly in all 4 variants (primary, secondary, ghost, danger)', done: true },
      { text: 'Supports disabled state with reduced opacity', done: true },
      { text: 'Shows loading spinner when isLoading prop is true', done: true },
      { text: 'Keyboard accessible with visible focus ring', done: false },
    ],
  },
  {
    id: 'h-002',
    name: 'Card',
    type: 'component',
    completeness: 80,
    previewColor: '#10B981',
    specs: [
      { property: 'padding', type: 'spacing', value: '24px', description: 'Internal card padding' },
      { property: 'border-radius', type: 'radius', value: '16px', description: 'Card corner radius' },
      { property: 'border', type: 'color', value: 'rgba(255,255,255,0.08)', description: 'Subtle border' },
      { property: 'background', type: 'color', value: 'rgba(255,255,255,0.03)', description: 'Surface background' },
    ],
    tokens: [
      { name: '--card-bg', value: 'rgba(255,255,255,0.03)', type: 'color' },
      { name: '--card-border', value: 'rgba(255,255,255,0.08)', type: 'color' },
      { name: '--card-radius', value: '16px', type: 'radius' },
      { name: '--card-padding', value: '24px', type: 'spacing' },
    ],
    criteria: [
      { text: 'Renders with glass-morphism surface effect', done: true },
      { text: 'Supports optional header, body, and footer slots', done: true },
      { text: 'Hover state increases border opacity', done: false },
      { text: 'Responsive at all breakpoints', done: false },
    ],
  },
  {
    id: 'h-003',
    name: 'Header',
    type: 'component',
    completeness: 100,
    previewColor: '#8B5CF6',
    specs: [
      { property: 'height', type: 'spacing', value: '64px', description: 'Fixed header height' },
      { property: 'padding-x', type: 'spacing', value: '24px', description: 'Horizontal padding' },
      { property: 'background', type: 'color', value: '#060918', description: 'Matches page background' },
      { property: 'border-bottom', type: 'color', value: 'rgba(255,255,255,0.08)', description: 'Bottom separator' },
    ],
    tokens: [
      { name: '--header-height', value: '64px', type: 'spacing' },
      { name: '--header-bg', value: '#060918', type: 'color' },
      { name: '--header-border', value: 'rgba(255,255,255,0.08)', type: 'color' },
    ],
    criteria: [
      { text: 'Sticky position at top of viewport', done: true },
      { text: 'Contains logo, navigation, and user menu', done: true },
      { text: 'Collapses to hamburger menu on mobile', done: true },
      { text: 'z-index above all content layers', done: true },
    ],
  },
  {
    id: 'h-004',
    name: 'Login Form',
    type: 'page',
    completeness: 70,
    previewColor: '#F59E0B',
    specs: [
      { property: 'max-width', type: 'spacing', value: '400px', description: 'Form container max width' },
      { property: 'gap', type: 'spacing', value: '16px', description: 'Space between form fields' },
      { property: 'padding', type: 'spacing', value: '32px', description: 'Form card padding' },
    ],
    tokens: [
      { name: '--input-bg', value: 'rgba(255,255,255,0.05)', type: 'color' },
      { name: '--input-border', value: 'rgba(255,255,255,0.1)', type: 'color' },
      { name: '--input-focus', value: '#3B82F6', type: 'color' },
    ],
    criteria: [
      { text: 'Email and password fields with validation', done: true },
      { text: 'Error states shown inline below each field', done: true },
      { text: 'Forgot password link navigates correctly', done: false },
      { text: 'Social login buttons (Google, GitHub)', done: false },
    ],
  },
  {
    id: 'h-005',
    name: 'Dashboard',
    type: 'page',
    completeness: 60,
    previewColor: '#06B6D4',
    specs: [
      { property: 'grid-columns', type: 'spacing', value: '4', description: 'Stats grid columns' },
      { property: 'gap', type: 'spacing', value: '24px', description: 'Section gap spacing' },
      { property: 'padding', type: 'spacing', value: '32px', description: 'Page content padding' },
    ],
    tokens: [
      { name: '--stat-card-bg', value: 'rgba(255,255,255,0.03)', type: 'color' },
      { name: '--chart-line', value: '#06B6D4', type: 'color' },
      { name: '--section-gap', value: '24px', type: 'spacing' },
    ],
    criteria: [
      { text: 'Stats grid renders 4 KPI cards', done: true },
      { text: 'Charts load with skeleton placeholders', done: false },
      { text: 'Activity feed shows last 10 events', done: false },
      { text: 'Quick actions panel functional', done: false },
    ],
  },
  {
    id: 'h-006',
    name: 'Sidebar',
    type: 'component',
    completeness: 90,
    previewColor: '#EC4899',
    specs: [
      { property: 'width', type: 'spacing', value: '256px', description: 'Fixed sidebar width' },
      { property: 'padding', type: 'spacing', value: '12px', description: 'Nav item area padding' },
      { property: 'item-height', type: 'spacing', value: '36px', description: 'Navigation item height' },
      { property: 'icon-size', type: 'spacing', value: '16px', description: 'Nav icon dimensions' },
    ],
    tokens: [
      { name: '--sidebar-bg', value: '#0a0f1e', type: 'color' },
      { name: '--sidebar-width', value: '256px', type: 'spacing' },
      { name: '--nav-active', value: 'rgba(6,182,212,0.1)', type: 'color' },
      { name: '--nav-text', value: '#94A3B8', type: 'color' },
    ],
    criteria: [
      { text: 'Collapsible with icon-only mode', done: true },
      { text: 'Active state highlights current route', done: true },
      { text: 'Nested sub-navigation expands inline', done: true },
      { text: 'Tooltip labels in collapsed mode', done: false },
    ],
  },
  {
    id: 'h-007',
    name: 'Modal',
    type: 'component',
    completeness: 85,
    previewColor: '#F43F5E',
    specs: [
      { property: 'max-width', type: 'spacing', value: '512px', description: 'Default modal max-width' },
      { property: 'padding', type: 'spacing', value: '24px', description: 'Modal content padding' },
      { property: 'border-radius', type: 'radius', value: '16px', description: 'Modal corner radius' },
      { property: 'backdrop', type: 'color', value: 'rgba(0,0,0,0.6)', description: 'Overlay backdrop' },
    ],
    tokens: [
      { name: '--modal-bg', value: '#0a0f1e', type: 'color' },
      { name: '--modal-border', value: 'rgba(255,255,255,0.08)', type: 'color' },
      { name: '--modal-radius', value: '16px', type: 'radius' },
      { name: '--modal-backdrop', value: 'rgba(0,0,0,0.6)', type: 'color' },
    ],
    criteria: [
      { text: 'Traps focus within modal when open', done: true },
      { text: 'Closes on backdrop click and Escape key', done: true },
      { text: 'Entrance/exit animations (scale + fade)', done: true },
      { text: 'Prevents body scroll when open', done: false },
    ],
  },
  {
    id: 'h-008',
    name: 'Input',
    type: 'component',
    completeness: 75,
    previewColor: '#A855F7',
    specs: [
      { property: 'height', type: 'spacing', value: '40px', description: 'Default input height' },
      { property: 'padding-x', type: 'spacing', value: '12px', description: 'Horizontal text padding' },
      { property: 'font-size', type: 'typography', value: '14px', description: 'Input text size' },
      { property: 'border-radius', type: 'radius', value: '8px', description: 'Input corner radius' },
    ],
    tokens: [
      { name: '--input-bg', value: 'rgba(255,255,255,0.05)', type: 'color' },
      { name: '--input-border', value: 'rgba(255,255,255,0.1)', type: 'color' },
      { name: '--input-focus', value: '#3B82F6', type: 'color' },
      { name: '--input-error', value: '#F43F5E', type: 'color' },
    ],
    criteria: [
      { text: 'Supports label, placeholder, and helper text', done: true },
      { text: 'Error state with red border and message', done: true },
      { text: 'Optional left/right icon slots', done: false },
      { text: 'Disabled state with reduced opacity', done: true },
    ],
  },
]
