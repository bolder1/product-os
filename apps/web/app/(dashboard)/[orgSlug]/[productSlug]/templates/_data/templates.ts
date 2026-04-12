export interface TemplateVariable {
  key: string
  label: string
  default: string
}

export interface TemplateNode {
  kind: string
  label: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  nodeCount: number
  edgeCount: number
  variables: TemplateVariable[]
  nodes: TemplateNode[]
}

export const templates: Template[] = [
  {
    id: 'saas-starter',
    name: 'SaaS Starter',
    description:
      'Complete SaaS product with authentication, dashboard, settings, and billing modules. Perfect for B2B/B2C applications.',
    category: 'SaaS',
    tags: ['authentication', 'dashboard', 'billing', 'settings'],
    nodeCount: 16,
    edgeCount: 11,
    variables: [
      { key: 'product_name', label: 'Product Name', default: 'My SaaS' },
      { key: 'primary_color', label: 'Primary Color', default: '#3B82F6' },
    ],
    nodes: [
      { kind: 'module', label: 'Auth Module' },
      { kind: 'module', label: 'Dashboard Module' },
      { kind: 'module', label: 'Settings Module' },
      { kind: 'module', label: 'Billing Module' },
      { kind: 'feature', label: 'User Login' },
      { kind: 'feature', label: 'User Register' },
      { kind: 'feature', label: 'Analytics Dashboard' },
      { kind: 'feature', label: 'User Settings' },
      { kind: 'feature', label: 'Billing Plans' },
      { kind: 'page', label: 'Login Page' },
      { kind: 'page', label: 'Dashboard Page' },
      { kind: 'page', label: 'Settings Page' },
      { kind: 'page', label: 'Billing Page' },
      { kind: 'entity', label: 'User' },
      { kind: 'entity', label: 'Subscription' },
      { kind: 'entity', label: 'Invoice' },
    ],
  },
  {
    id: 'ops-pilot',
    name: 'OpsPilot',
    description:
      'Internal operations tool for employee onboarding, asset management, access control, and service requests.',
    category: 'Internal Tool',
    tags: ['onboarding', 'assets', 'access-control', 'service-desk'],
    nodeCount: 17,
    edgeCount: 10,
    variables: [
      { key: 'company_name', label: 'Company Name', default: 'Acme Corp' },
      { key: 'departments', label: 'Departments', default: 'Engineering, Design, Product' },
    ],
    nodes: [
      { kind: 'module', label: 'Onboarding' },
      { kind: 'module', label: 'Access Control' },
      { kind: 'module', label: 'Asset Management' },
      { kind: 'module', label: 'Service Desk' },
      { kind: 'workflow', label: 'Onboarding Flow' },
      { kind: 'workflow', label: 'Access Request Flow' },
      { kind: 'workflow', label: 'Asset Assignment Flow' },
      { kind: 'entity', label: 'Employee' },
      { kind: 'entity', label: 'Asset' },
      { kind: 'entity', label: 'AccessRole' },
      { kind: 'entity', label: 'ServiceTicket' },
      { kind: 'page', label: 'Onboarding Dashboard' },
      { kind: 'page', label: 'Asset Inventory' },
      { kind: 'page', label: 'Access Matrix' },
      { kind: 'page', label: 'Service Queue' },
      { kind: 'feature', label: 'Bulk Import' },
      { kind: 'feature', label: 'Auto-provisioning' },
    ],
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description:
      'Marketing landing page with hero, features, pricing, testimonials, and CTA sections.',
    category: 'Marketing',
    tags: ['marketing', 'hero', 'pricing', 'testimonials'],
    nodeCount: 11,
    edgeCount: 10,
    variables: [
      { key: 'product_name', label: 'Product Name', default: 'My Product' },
      { key: 'tagline', label: 'Tagline', default: 'The future of...' },
    ],
    nodes: [
      { kind: 'page', label: 'Landing Page' },
      { kind: 'component', label: 'Hero Section' },
      { kind: 'component', label: 'Features Grid' },
      { kind: 'component', label: 'Pricing Table' },
      { kind: 'component', label: 'Testimonials' },
      { kind: 'component', label: 'CTA Section' },
      { kind: 'component', label: 'Footer' },
      { kind: 'component', label: 'Navigation' },
      { kind: 'token', label: 'Brand Colors' },
      { kind: 'token', label: 'Typography Scale' },
      { kind: 'asset', label: 'Hero Illustration' },
    ],
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description:
      'Mobile application with onboarding, home feed, profile, and notification screens.',
    category: 'Mobile',
    tags: ['mobile', 'onboarding', 'feed', 'profile'],
    nodeCount: 14,
    edgeCount: 9,
    variables: [
      { key: 'app_name', label: 'App Name', default: 'My App' },
      { key: 'platform', label: 'Platform', default: 'iOS & Android' },
    ],
    nodes: [
      { kind: 'module', label: 'Onboarding' },
      { kind: 'module', label: 'Home' },
      { kind: 'module', label: 'Profile' },
      { kind: 'module', label: 'Notifications' },
      { kind: 'screen', label: 'Welcome Screen' },
      { kind: 'screen', label: 'Home Feed' },
      { kind: 'screen', label: 'Detail View' },
      { kind: 'screen', label: 'Profile Screen' },
      { kind: 'screen', label: 'Settings Screen' },
      { kind: 'screen', label: 'Notification List' },
      { kind: 'entity', label: 'User' },
      { kind: 'entity', label: 'Post' },
      { kind: 'entity', label: 'Notification' },
      { kind: 'journey', label: 'First-time User Flow' },
    ],
  },
  {
    id: 'design-system',
    name: 'Design System',
    description: 'Design system starter with tokens, components, and documentation.',
    category: 'Design System',
    tags: ['tokens', 'components', 'documentation', 'variants'],
    nodeCount: 12,
    edgeCount: 8,
    variables: [
      { key: 'system_name', label: 'System Name', default: 'My Design System' },
      { key: 'base_color', label: 'Base Color', default: '#3B82F6' },
    ],
    nodes: [
      { kind: 'token', label: 'Color Tokens' },
      { kind: 'token', label: 'Typography Tokens' },
      { kind: 'token', label: 'Spacing Tokens' },
      { kind: 'token', label: 'Shadow Tokens' },
      { kind: 'component', label: 'Button' },
      { kind: 'component', label: 'Input' },
      { kind: 'component', label: 'Card' },
      { kind: 'component', label: 'Modal' },
      { kind: 'variant', label: 'Button Primary' },
      { kind: 'variant', label: 'Button Secondary' },
      { kind: 'variant', label: 'Input Default' },
      { kind: 'variant', label: 'Input Error' },
    ],
  },
]
