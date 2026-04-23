import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema/index'
import { randomBytes, scryptSync } from 'crypto'

function hashPassword(plain: string): string {
  const salt = randomBytes(32).toString('hex')
  const hash = scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt:${salt}:${hash.toString('hex')}`
}

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/product_os'
const queryClient = postgres(connectionString)
const db = drizzle(queryClient, { schema })

async function seed() {
  console.log('🌱 Seeding database...')

  // 1. Create demo user
  const [user] = await db
    .insert(schema.users)
    .values({
      email: 'demo@productos.dev',
      name: 'Demo User',
      passwordHash: hashPassword('demo123'),
      emailVerified: true,
    })
    .returning()
  console.log('  ✓ User:', user.id)

  // 2. Create demo session (for dev auth bypass)
  const [session] = await db
    .insert(schema.sessions)
    .values({
      userId: user.id,
      token: 'dev-session-token-product-os',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    })
    .returning()
  console.log('  ✓ Session:', session.id)

  // 3. Create demo organization
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: 'Acme Corp',
      slug: 'acme',
      plan: 'pro',
      settings: { theme: 'dark' },
    })
    .returning()
  console.log('  ✓ Organization:', org.id)

  // 4. Create membership (owner)
  const [membership] = await db
    .insert(schema.memberships)
    .values({
      userId: user.id,
      orgId: org.id,
      role: 'owner',
      acceptedAt: new Date(),
    })
    .returning()
  console.log('  ✓ Membership:', membership.id)

  // 5. Create demo product
  const [product] = await db
    .insert(schema.products)
    .values({
      orgId: org.id,
      name: 'OpsPilot',
      slug: 'opspilot',
      description: 'Internal operations management platform',
      icon: 'rocket',
      status: 'active',
      createdBy: user.id,
      settings: {},
    })
    .returning()
  console.log('  ✓ Product:', product.id)

  // 6. Create initial version and branch
  const [version] = await db
    .insert(schema.versions)
    .values({
      productId: product.id,
      label: 'v0.1.0',
      createdBy: user.id,
    })
    .returning()

  const [branch] = await db
    .insert(schema.branches)
    .values({
      productId: product.id,
      name: 'main',
      baseVersionId: version.id,
      status: 'active',
    })
    .returning()
  console.log('  ✓ Version + Branch:', version.id, branch.id)

  // 7. Create graph nodes (product plan structure)
  const nodeValues = [
    { productId: product.id, kind: 'product' as const, label: 'OpsPilot', data: { description: 'Internal ops platform' }, position: { x: 400, y: 50 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'module' as const, label: 'Dashboard', data: { description: 'Central dashboard module' }, position: { x: 200, y: 200 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'module' as const, label: 'Workflows', data: { description: 'Workflow automation module' }, position: { x: 400, y: 200 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'module' as const, label: 'Analytics', data: { description: 'Analytics & reporting module' }, position: { x: 600, y: 200 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'feature' as const, label: 'Team Overview', data: { description: 'Team status overview widget', priority: 'high' }, position: { x: 100, y: 350 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'feature' as const, label: 'Task Board', data: { description: 'Kanban task board', priority: 'high' }, position: { x: 250, y: 350 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'feature' as const, label: 'Approval Queue', data: { description: 'Pending approval management', priority: 'medium' }, position: { x: 400, y: 350 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'feature' as const, label: 'State Machine', data: { description: 'Visual workflow state machine', priority: 'high' }, position: { x: 500, y: 350 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'page' as const, label: 'Home', data: { route: '/', sections: ['hero', 'stats', 'activity'] }, position: { x: 100, y: 500 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'page' as const, label: 'Settings', data: { route: '/settings', sections: ['profile', 'team', 'billing'] }, position: { x: 300, y: 500 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'component' as const, label: 'Button', data: { variants: ['primary', 'secondary', 'ghost', 'destructive'], sizes: ['sm', 'md', 'lg'] }, position: { x: 500, y: 500 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'component' as const, label: 'Card', data: { variants: ['default', 'elevated', 'outlined'], sizes: ['sm', 'md', 'lg'] }, position: { x: 650, y: 500 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'entity' as const, label: 'Request', data: { fields: ['id', 'title', 'status', 'assignee', 'priority', 'created_at'] }, position: { x: 350, y: 650 }, createdBy: user.id, branchId: branch.id },
    { productId: product.id, kind: 'workflow' as const, label: 'Request Lifecycle', data: { states: ['draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed'] }, position: { x: 550, y: 650 }, createdBy: user.id, branchId: branch.id },
  ]

  const nodes = await db.insert(schema.graphNodes).values(nodeValues).returning()
  console.log(`  ✓ Graph nodes: ${nodes.length} created`)

  // 8. Create graph edges
  const edgeValues = [
    // product -> modules
    { productId: product.id, sourceId: nodes[0].id, targetId: nodes[1].id, kind: 'contains' as const },
    { productId: product.id, sourceId: nodes[0].id, targetId: nodes[2].id, kind: 'contains' as const },
    { productId: product.id, sourceId: nodes[0].id, targetId: nodes[3].id, kind: 'contains' as const },
    // dashboard -> features
    { productId: product.id, sourceId: nodes[1].id, targetId: nodes[4].id, kind: 'contains' as const },
    { productId: product.id, sourceId: nodes[1].id, targetId: nodes[5].id, kind: 'contains' as const },
    { productId: product.id, sourceId: nodes[1].id, targetId: nodes[6].id, kind: 'contains' as const },
    // workflows -> features
    { productId: product.id, sourceId: nodes[2].id, targetId: nodes[7].id, kind: 'contains' as const },
    // feature -> page references
    { productId: product.id, sourceId: nodes[4].id, targetId: nodes[8].id, kind: 'references' as const },
    // page -> component usage
    { productId: product.id, sourceId: nodes[8].id, targetId: nodes[10].id, kind: 'uses_component' as const },
    { productId: product.id, sourceId: nodes[8].id, targetId: nodes[11].id, kind: 'uses_component' as const },
    // entity -> workflow
    { productId: product.id, sourceId: nodes[12].id, targetId: nodes[13].id, kind: 'triggers' as const },
    // approval queue -> entity
    { productId: product.id, sourceId: nodes[6].id, targetId: nodes[12].id, kind: 'references' as const },
  ]

  const edges = await db.insert(schema.graphEdges).values(edgeValues).returning()
  console.log(`  ✓ Graph edges: ${edges.length} created`)

  // 9. Create sample tasks
  const taskValues = [
    { productId: product.id, nodeId: nodes[4].id, title: 'Design team overview widget', status: 'in_progress' as const, priority: 'high' as const, assigneeId: user.id, createdBy: user.id, studioOrigin: 'planner' },
    { productId: product.id, nodeId: nodes[5].id, title: 'Implement task board drag-and-drop', status: 'todo' as const, priority: 'high' as const, createdBy: user.id, studioOrigin: 'planner' },
    { productId: product.id, nodeId: nodes[7].id, title: 'Build state machine editor', status: 'todo' as const, priority: 'medium' as const, createdBy: user.id, studioOrigin: 'workflows' },
    { productId: product.id, nodeId: nodes[10].id, title: 'Create button component variants', status: 'done' as const, priority: 'medium' as const, assigneeId: user.id, createdBy: user.id, studioOrigin: 'components' },
    { productId: product.id, title: 'Set up CI/CD pipeline', status: 'todo' as const, priority: 'low' as const, createdBy: user.id, studioOrigin: 'control-tower' },
  ]

  const tasks = await db.insert(schema.tasks).values(taskValues).returning()
  console.log(`  ✓ Tasks: ${tasks.length} created`)

  // 10. Create sample notifications
  await db.insert(schema.notifications).values([
    { userId: user.id, productId: product.id, type: 'task_assigned' as const, title: 'Task assigned to you', body: 'Design team overview widget', link: `/acme/opspilot/tasks` },
    { userId: user.id, productId: product.id, type: 'system' as const, title: 'Welcome to Product OS', body: 'Your product OpsPilot has been created successfully.' },
  ])
  console.log('  ✓ Notifications: 2 created')

  // 11. Create all 5 built-in template bundles
  const templateBundleValues = [
    {
      name: 'SaaS Starter',
      description: 'Complete SaaS product scaffold with auth, dashboard, settings, billing pages, user management workflows, and design tokens.',
      category: 'saas',
      tags: ['saas', 'dashboard', 'auth', 'billing', 'settings'],
      bundle: (await import('../../../templates/src/bundles/saas-starter.json', { with: { type: 'json' } })).default,
      isPublic: true,
      isBuiltIn: true,
      createdBy: user.id,
    },
    {
      name: 'OpsPilot — Internal Operations',
      description: 'Internal operations SaaS for employee onboarding, access requests, asset provisioning, service requests, and policy acknowledgement.',
      category: 'internal_ops',
      tags: ['ops', 'internal', 'onboarding', 'hr', 'service-desk', 'approvals'],
      bundle: (await import('../../../templates/src/bundles/ops-pilot.json', { with: { type: 'json' } })).default,
      isPublic: true,
      isBuiltIn: true,
      createdBy: user.id,
    },
    {
      name: 'Marketing Landing Page',
      description: 'Marketing landing page with hero, features showcase, pricing tiers, testimonials, and call-to-action sections.',
      category: 'marketing',
      tags: ['landing-page', 'marketing', 'pricing', 'hero', 'testimonials'],
      bundle: (await import('../../../templates/src/bundles/landing-page.json', { with: { type: 'json' } })).default,
      isPublic: true,
      isBuiltIn: true,
      createdBy: user.id,
    },
    {
      name: 'Mobile App Starter',
      description: 'Mobile application scaffold with onboarding, tab navigation, profile, push notifications, and offline-first architecture.',
      category: 'mobile',
      tags: ['mobile', 'ios', 'android', 'onboarding', 'push-notifications'],
      bundle: (await import('../../../templates/src/bundles/mobile-app.json', { with: { type: 'json' } })).default,
      isPublic: true,
      isBuiltIn: true,
      createdBy: user.id,
    },
    {
      name: 'Design System Starter',
      description: 'Comprehensive design system with tokens (colors, typography, spacing, shadows), 12 base components with variants, and documentation pages.',
      category: 'design_system',
      tags: ['design-system', 'tokens', 'components', 'typography', 'colors'],
      bundle: (await import('../../../templates/src/bundles/design-system.json', { with: { type: 'json' } })).default,
      isPublic: true,
      isBuiltIn: true,
      createdBy: user.id,
    },
  ]

  await db.insert(schema.templateBundles).values(templateBundleValues)
  console.log(`  ✓ Template bundles: ${templateBundleValues.length} created`)

  // 12. Activity log entries
  await db.insert(schema.activityLog).values([
    { productId: product.id, actorId: user.id, action: 'product.created', entityType: 'product', entityId: product.id, studioOrigin: 'planner' },
    { productId: product.id, actorId: user.id, action: 'graph.nodes.created', entityType: 'graph_node', diff: { count: nodes.length }, studioOrigin: 'planner' },
    { productId: product.id, actorId: user.id, action: 'task.created', entityType: 'task', diff: { count: tasks.length }, studioOrigin: 'planner' },
  ])
  console.log('  ✓ Activity log: 3 entries')

  console.log('\n✅ Seed complete!')
  console.log(`\n  Demo login: demo@productos.dev`)
  console.log(`  Dev session token: dev-session-token-product-os`)
  console.log(`  Org: acme / Product: opspilot`)
  console.log(`  URL: http://localhost:3006/acme/opspilot/control-tower\n`)

  await queryClient.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
