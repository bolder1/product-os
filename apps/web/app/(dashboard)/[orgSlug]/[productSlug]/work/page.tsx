'use client'

/**
 * R7 — Unified Work Surface.
 *
 * Three previously-separate routes (/tasks, /approvals, /features) collapse
 * into one surface with a shared editorial PageHeader and a top tab bar.
 * Deep links via ?tab=tasks | approvals | features (default: tasks).
 *
 *   Tasks      · Board · List · Timeline of execution work
 *   Approvals  · Multi-step review chains (releases, designs, workflows)
 *   Features   · Feature lifecycle — spec → build → ship
 *
 * Each view retains its own action strip; the Work header lives above.
 */

import { useMemo } from 'react'
import { useSearchParams, useRouter, usePathname, useParams } from 'next/navigation'
import { CheckSquare, ShieldCheck, Sparkles } from 'lucide-react'
import { PageHeader } from '@product-os/ui'
import { TasksView } from '../tasks/view'
import { ApprovalsView } from '../approvals/view'
import { FeaturesView } from '../features/view'
import { useProduct } from '../layout'

type WorkTab = 'tasks' | 'approvals' | 'features'

const TABS: { id: WorkTab; label: string; icon: typeof CheckSquare; blurb: string }[] = [
  { id: 'tasks',      label: 'Tasks',      icon: CheckSquare, blurb: 'Board · List · Timeline of execution work' },
  { id: 'approvals',  label: 'Approvals',  icon: ShieldCheck, blurb: 'Multi-step review chains' },
  { id: 'features',   label: 'Features',   icon: Sparkles,    blurb: 'Feature lifecycle — spec to ship' },
]

function isWorkTab(v: string | null): v is WorkTab {
  return v === 'tasks' || v === 'approvals' || v === 'features'
}

export default function WorkStudioPage() {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const rawTab = searchParams.get('tab')
  const tab: WorkTab = isWorkTab(rawTab) ? rawTab : 'tasks'

  const activeBlurb = useMemo(() => TABS.find((t) => t.id === tab)?.blurb ?? '', [tab])

  function setTab(next: WorkTab) {
    const p = new URLSearchParams(searchParams.toString())
    if (next === 'tasks') p.delete('tab')
    else p.set('tab', next)
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg-base)] overflow-hidden">
      {/* Shared editorial header */}
      <PageHeader
        eyebrow={<span>Operate · Work</span>}
        title="Work"
        subtitle={activeBlurb}
        bordered={false}
        className="px-10 pt-8 pb-4"
      />

      {/* Top tab bar */}
      <div className="px-10 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="relative flex items-center gap-2 px-4 h-11 text-[13px] transition-colors"
                style={{
                  color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
                }}
              >
                <Icon size={14} />
                <span className="font-medium">{t.label}</span>
                <span
                  aria-hidden
                  className="absolute inset-x-3 -bottom-px h-[2px] rounded-full transition-all"
                  style={{ background: active ? 'var(--accent-text)' : 'transparent' }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* View */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'tasks' && <TasksView />}
        {tab === 'approvals' && <ApprovalsView />}
        {tab === 'features' && <FeaturesView />}
      </div>
    </div>
  )
}
