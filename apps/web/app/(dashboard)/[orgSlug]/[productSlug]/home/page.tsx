'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import { useAuth } from '../../../../lib/auth-context'
import { roleConfigs, type OrgRole } from '../../../../lib/role-config'

// Shared widgets (reused from control-tower)
import { HealthScore }       from '../control-tower/_components/health-score'
import { QuickStats }        from '../control-tower/_components/quick-stats'
import { OpenTasks }         from '../control-tower/_components/open-tasks'
import { PendingApprovals }  from '../control-tower/_components/pending-approvals'
import { AiInsights }        from '../control-tower/_components/ai-insights'
import { ModuleReadiness }   from '../control-tower/_components/module-readiness'
import { BlockersPanel }     from '../control-tower/_components/blockers-panel'
import { ActivityFeed }      from '../control-tower/_components/activity-feed'

// Role-specific components
import { RoleGreeting }      from './_components/role-greeting'
import { RoleFocusPanel }    from './_components/role-focus-panel'
import { MyTasksPanel }      from './_components/my-tasks-panel'
import { HandoffQueuePanel } from './_components/handoff-queue-panel'
import { RoleSwitcher }      from './_components/role-switcher'

// ---------------------------------------------------------------------------
// Role → layout group
// ---------------------------------------------------------------------------

type RoleGroup = 'pm' | 'designer' | 'frontend' | 'backend' | 'qa' | 'analyst' | 'viewer'

function getRoleGroup(role: OrgRole): RoleGroup {
  switch (role) {
    case 'admin':
    case 'manager':     return 'pm'
    case 'business_analyst': return 'analyst'
    case 'product_designer': return 'designer'
    case 'frontend_dev': return 'frontend'
    case 'backend_dev':  return 'backend'
    case 'qa':           return 'qa'
    case 'viewer':       return 'viewer'
  }
}

// ---------------------------------------------------------------------------
// Per-role grid layouts
// ---------------------------------------------------------------------------

function PMDashboard({ productId }: { productId: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-min">
      {/* Row 1: Health (3) + Stats (9) */}
      <div className="col-span-3"><HealthScore /></div>
      <div className="col-span-9"><QuickStats /></div>

      {/* Row 2: Module Readiness (7) + Blockers (5) */}
      <div className="col-span-7"><ModuleReadiness productId={productId} /></div>
      <div className="col-span-5"><BlockersPanel productId={productId} /></div>

      {/* Row 3: Tasks (4) + Approvals (4) + AI Insights (4) */}
      <div className="col-span-4"><OpenTasks /></div>
      <div className="col-span-4"><PendingApprovals /></div>
      <div className="col-span-4"><AiInsights productId={productId} /></div>
    </div>
  )
}

function AnalystDashboard({ productId }: { productId: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-min">
      {/* Row 1: Stats full width */}
      <div className="col-span-12"><QuickStats /></div>

      {/* Row 2: Focus panel (4) + Module Readiness (8) */}
      <div className="col-span-4"><RoleFocusPanel role="business_analyst" productId={productId} /></div>
      <div className="col-span-8"><ModuleReadiness productId={productId} /></div>

      {/* Row 3: Activity (7) + Tasks (5) */}
      <div className="col-span-7"><ActivityFeed /></div>
      <div className="col-span-5"><MyTasksPanel productId={productId} /></div>

      {/* Row 4: Approvals (6) + AI Insights (6) */}
      <div className="col-span-6"><PendingApprovals /></div>
      <div className="col-span-6"><AiInsights productId={productId} /></div>
    </div>
  )
}

function DesignerDashboard({ productId }: { productId: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-min">
      {/* Row 1: Stats */}
      <div className="col-span-12"><QuickStats /></div>

      {/* Row 2: Role focus (4) + Activity (8) */}
      <div className="col-span-4"><RoleFocusPanel role="product_designer" productId={productId} /></div>
      <div className="col-span-8"><ActivityFeed /></div>

      {/* Row 3: My Tasks (6) + Approvals (6) */}
      <div className="col-span-6"><MyTasksPanel productId={productId} myTasksOnly /></div>
      <div className="col-span-6"><PendingApprovals /></div>

      {/* Row 4: Blockers (full) */}
      <div className="col-span-12"><BlockersPanel productId={productId} /></div>
    </div>
  )
}

function FrontendDashboard({ productId }: { productId: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-min">
      {/* Row 1: Health (3) + Stats (9) */}
      <div className="col-span-3"><HealthScore /></div>
      <div className="col-span-9"><QuickStats /></div>

      {/* Row 2: Focus (5) + My Tasks (7) */}
      <div className="col-span-5"><RoleFocusPanel role="frontend_dev" productId={productId} /></div>
      <div className="col-span-7"><MyTasksPanel productId={productId} myTasksOnly /></div>

      {/* Row 3: Handoff Queue (5) + Blockers (7) */}
      <div className="col-span-5"><HandoffQueuePanel productId={productId} /></div>
      <div className="col-span-7"><BlockersPanel productId={productId} /></div>
    </div>
  )
}

function BackendDashboard({ productId }: { productId: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-min">
      {/* Row 1: Stats */}
      <div className="col-span-12"><QuickStats /></div>

      {/* Row 2: Focus (5) + My Tasks (7) */}
      <div className="col-span-5"><RoleFocusPanel role="backend_dev" productId={productId} /></div>
      <div className="col-span-7"><MyTasksPanel productId={productId} myTasksOnly /></div>

      {/* Row 3: Handoff Queue (5) + Blockers (7) */}
      <div className="col-span-5"><HandoffQueuePanel productId={productId} /></div>
      <div className="col-span-7"><BlockersPanel productId={productId} /></div>
    </div>
  )
}

function QADashboard({ productId }: { productId: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-min">
      {/* Row 1: Stats */}
      <div className="col-span-12"><QuickStats /></div>

      {/* Row 2: QA Focus (5) + Module Readiness (7) */}
      <div className="col-span-5"><RoleFocusPanel role="qa" productId={productId} /></div>
      <div className="col-span-7"><ModuleReadiness productId={productId} /></div>

      {/* Row 3: My Tasks (6) + Approvals (6) */}
      <div className="col-span-6"><MyTasksPanel productId={productId} myTasksOnly={false} /></div>
      <div className="col-span-6"><PendingApprovals /></div>

      {/* Row 4: Blockers (full) */}
      <div className="col-span-12"><BlockersPanel productId={productId} /></div>
    </div>
  )
}

function ViewerDashboard({ productId }: { productId: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 auto-rows-min">
      <div className="col-span-4"><HealthScore /></div>
      <div className="col-span-8"><QuickStats /></div>
      <div className="col-span-12"><ModuleReadiness productId={productId} /></div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomeDashboardPage() {
  const params    = useParams<{ orgSlug: string; productSlug: string }>()
  const product   = useProduct()
  const productId = product?.id ?? params.productSlug
  const { user }  = useAuth()

  const [previewRole, setPreviewRole] = useState<OrgRole | null>(null)
  const effectiveRole = previewRole ?? ((user?.role ?? 'admin') as OrgRole)
  const isAdmin = (user?.role ?? 'admin') === 'admin'

  const config     = roleConfigs[effectiveRole] ?? roleConfigs.admin
  const roleGroup  = getRoleGroup(effectiveRole)

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 h-[var(--toolbar-h)] border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex-shrink-0">
        <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Home</span>
        <div className="ml-auto flex items-center gap-2">
          {/* Admins can preview any role */}
          {isAdmin && (
            <RoleSwitcher currentRole={effectiveRole} onChange={setPreviewRole} />
          )}
          {!isAdmin && (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              Viewing as <span style={{ color: config.color }}>{config.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto p-3">
        <div className="max-w-[1400px] mx-auto space-y-3">
          {/* Greeting banner — always full width */}
          <RoleGreeting
            role={effectiveRole}
            config={config}
            userName={user?.name}
          />

          {/* Role-specific grid */}
          {roleGroup === 'pm'       && <PMDashboard       productId={productId} />}
          {roleGroup === 'analyst'  && <AnalystDashboard  productId={productId} />}
          {roleGroup === 'designer' && <DesignerDashboard productId={productId} />}
          {roleGroup === 'frontend' && <FrontendDashboard productId={productId} />}
          {roleGroup === 'backend'  && <BackendDashboard  productId={productId} />}
          {roleGroup === 'qa'       && <QADashboard       productId={productId} />}
          {roleGroup === 'viewer'   && <ViewerDashboard   productId={productId} />}
        </div>
      </div>
    </div>
  )
}
