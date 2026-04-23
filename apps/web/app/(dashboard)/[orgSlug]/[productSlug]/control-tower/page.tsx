'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import { Wand2, Shield, GitCompare, Store, Brain, Plug } from 'lucide-react'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { HealthScore }        from './_components/health-score'
import { QuickStats }         from './_components/quick-stats'
import { ActivityFeed }       from './_components/activity-feed'
import { DependencyGraphMini } from './_components/dependency-graph-mini'
import { OpenTasks }          from './_components/open-tasks'
import { PendingApprovals }   from './_components/pending-approvals'
import { AiInsights }         from './_components/ai-insights'
import { ModuleReadiness }    from './_components/module-readiness'
import { BlockersPanel }      from './_components/blockers-panel'
import { AIRemixEngine, type RemixRequest } from '../../../../components/shared/ai-remix-engine'
import { GraphConflictResolver } from '../../../../components/shared/graph-conflict-resolver'
import { BrandComplianceChecker } from '../../../../components/shared/brand-compliance-checker'
import { DriftDetector }     from '../../../../components/shared/drift-detector'
import { TemplateMarketplace } from '../../../../components/shared/template-marketplace'
import { ConnectorsPanel }   from '../../../../components/shared/connectors-panel'
import { AISkillsPanel }     from '../../../../components/shared/ai-skills-panel'
import { useAuth }           from '../../../../lib/auth-context'
import { roleConfigs, type OrgRole } from '../../../../lib/role-config'

const ALWAYS_ON_WIDGETS = new Set(['health', 'stats'])

const WIDGET_ROLE_TAGS: Record<string, string[]> = {
  health:   ['overview', 'analytics'],
  stats:    ['overview', 'analytics'],
  activity: ['overview', 'team'],
  graph:    ['analytics', 'code', 'workflows'],
  tasks:    ['tasks'],
  approvals:['approvals'],
  insights: ['analytics', 'design', 'brand'],
  modules:  ['overview', 'analytics', 'workflows'],
  blockers: ['overview', 'code', 'workflows', 'settings'],
}

const TOOL_ROLE_TAGS: Record<string, string[]> = {
  remix:      ['design', 'brand', 'components'],
  conflict:   ['code', 'workflows', 'settings'],
  compliance: ['brand', 'design'],
  drift:      ['design', 'code'],
  marketplace:['design', 'components', 'settings'],
  connectors: ['code', 'settings'],
  skills:     ['design', 'code', 'tasks'],
}

function rolesOverlap(allowed: string[] | undefined, needed: string[]): boolean {
  if (!allowed || allowed.length === 0) return false
  return needed.some((n) => allowed.includes(n))
}

const ALL_TOOL_BUTTONS = [
  { key: 'remix',       label: 'AI Remix',    icon: Wand2   },
  { key: 'conflict',    label: 'Conflicts',   icon: Shield  },
  { key: 'compliance',  label: 'Compliance',  icon: Shield  },
  { key: 'drift',       label: 'Drift',       icon: GitCompare },
  { key: 'marketplace', label: 'Marketplace', icon: Store   },
  { key: 'connectors',  label: 'Connectors',  icon: Plug    },
  { key: 'skills',      label: 'AI Skills',   icon: Brain   },
] as const

export default function ControlTowerPage() {
  const params    = useParams<{ productSlug: string }>()
  const product   = useProduct()
  const productId = product?.id ?? params.productSlug
  const { user }  = useAuth()

  const [openModal, setOpenModal] = useState<string | null>(null)

  const role    = (user?.role ?? 'admin') as OrgRole
  const isAdmin = role === 'admin'

  const allowedWidgets = useMemo<string[]>(() => {
    return roleConfigs[role]?.dashboardWidgets ?? roleConfigs.admin.dashboardWidgets
  }, [role])

  const show = (tag: keyof typeof WIDGET_ROLE_TAGS) =>
    isAdmin || ALWAYS_ON_WIDGETS.has(tag) || rolesOverlap(allowedWidgets, WIDGET_ROLE_TAGS[tag])

  const toolButtons = useMemo(
    () =>
      isAdmin
        ? [...ALL_TOOL_BUTTONS]
        : ALL_TOOL_BUTTONS.filter((t) => rolesOverlap(allowedWidgets, TOOL_ROLE_TAGS[t.key] ?? [])),
    [isAdmin, allowedWidgets],
  )

  const remixRequest: RemixRequest = {
    target: 'component',
    sourceLabel: 'Selected Element',
    sourceProps: { variant: 'primary', size: 'md' },
  }

  // Widget visibility
  const showHealth   = show('health')
  const showStats    = show('stats')
  const showActivity = show('activity')
  const showGraph    = show('graph')
  const showTasks    = show('tasks')
  const showApprovals= show('approvals')
  const showInsights = show('insights')
  const showModules  = show('modules')
  const showBlockers = show('blockers')

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1 px-3 h-[var(--toolbar-h)] border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex-shrink-0">
        <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mr-2">Tools</span>
        {toolButtons.length === 0 ? (
          <span className="text-[10px] text-[var(--text-tertiary)] italic">No tools available for your role</span>
        ) : (
          toolButtons.map((t) => (
            <button
              key={t.key}
              onClick={() => setOpenModal(t.key)}
              className="tool-btn text-[10px] h-[22px] px-2 py-0 gap-1"
            >
              <t.icon size={11} />
              {t.label}
            </button>
          ))
        )}
        <div className="ml-auto flex items-center gap-2">
          <AIActionBar workspace="system" productId={productId} compact />
          {user && (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              Viewing as <span className="text-[var(--text-secondary)]">{roleConfigs[role]?.label ?? role}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="flex-1 overflow-auto p-3">
        <div className="grid grid-cols-12 gap-3 auto-rows-min">

          {/* ── Row 1: Health gauge (left) + Quick stats (right) ── */}
          {showHealth && (
            <div className={showStats ? 'col-span-3' : 'col-span-12'}>
              <HealthScore />
            </div>
          )}
          {showStats && (
            <div className={showHealth ? 'col-span-9' : 'col-span-12'}>
              <QuickStats />
            </div>
          )}

          {/* ── Row 2: Module Readiness (left) + Blockers (right) ── */}
          {showModules && (
            <div className={showBlockers ? 'col-span-7' : 'col-span-12'}>
              <ModuleReadiness productId={productId} />
            </div>
          )}
          {showBlockers && (
            <div className={showModules ? 'col-span-5' : 'col-span-12'}>
              <BlockersPanel productId={productId} />
            </div>
          )}

          {/* ── Row 3: Activity (left) + Graph mini (right) ── */}
          {showActivity && (
            <div className={showGraph ? 'col-span-7' : 'col-span-12'}>
              <ActivityFeed />
            </div>
          )}
          {showGraph && (
            <div className={showActivity ? 'col-span-5' : 'col-span-12'}>
              <DependencyGraphMini />
            </div>
          )}

          {/* ── Row 4: Tasks + Approvals + AI Insights ── */}
          {(() => {
            const bottomCount = [showTasks, showApprovals, showInsights].filter(Boolean).length
            const span = bottomCount === 3 ? 'col-span-4' : bottomCount === 2 ? 'col-span-6' : 'col-span-12'
            return (
              <>
                {showTasks     && <div className={span}><OpenTasks /></div>}
                {showApprovals && <div className={span}><PendingApprovals /></div>}
                {showInsights  && <div className={span}><AiInsights productId={productId} /></div>}
              </>
            )
          })()}

          {/* Empty fallback */}
          {!showHealth && !showStats && !showActivity && !showGraph &&
           !showTasks  && !showApprovals && !showInsights &&
           !showModules && !showBlockers && (
            <div className="col-span-12 flex items-center justify-center py-16 text-[11px] text-[var(--text-tertiary)]">
              No Control Tower widgets available for your role.
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <AIRemixEngine open={openModal === 'remix'} onClose={() => setOpenModal(null)} request={remixRequest} />
      <GraphConflictResolver productId={productId} open={openModal === 'conflict'} onClose={() => setOpenModal(null)} />
      <BrandComplianceChecker productId={productId} open={openModal === 'compliance'} onClose={() => setOpenModal(null)} />
      <DriftDetector productId={productId} open={openModal === 'drift'} onClose={() => setOpenModal(null)} />
      <TemplateMarketplace open={openModal === 'marketplace'} onClose={() => setOpenModal(null)} />
      <ConnectorsPanel productId={productId} open={openModal === 'connectors'} onClose={() => setOpenModal(null)} />
      <AISkillsPanel productId={productId} open={openModal === 'skills'} onClose={() => setOpenModal(null)} />
    </div>
  )
}
