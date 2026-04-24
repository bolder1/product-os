'use client'

import { motion } from 'framer-motion'
import {
  Shield, Briefcase, BarChart3, Palette, Code2, Server, Bug, Eye,
  Sparkles, ArrowRight,
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import type { OrgRole, RoleConfig } from '../../../../../lib/role-config'

const ROLE_ICONS: Record<OrgRole, React.ElementType> = {
  admin:            Shield,
  manager:          Briefcase,
  business_analyst: BarChart3,
  product_designer: Palette,
  frontend_dev:     Code2,
  backend_dev:      Server,
  qa:               Bug,
  viewer:           Eye,
}

const ROLE_TAGLINES: Record<OrgRole, string> = {
  admin:            'You have full visibility. Steer the ship.',
  manager:          'Your team is building. Keep them unblocked.',
  business_analyst: 'Connect the dots between insight and execution.',
  product_designer: 'Craft the experiences users love.',
  frontend_dev:     'Turn designs into living interfaces.',
  backend_dev:      'Power the logic behind every interaction.',
  qa:               'Quality is the last line of defence — yours.',
  viewer:           'Stay informed on everything happening.',
}

const PRIMARY_STUDIOS: Record<OrgRole, Array<{ label: string; route: string }>> = {
  admin:            [
    { label: 'Control Tower', route: 'control-tower' },
    { label: 'Graph Explorer', route: 'graph-explorer' },
    { label: 'Templates', route: 'templates' },
  ],
  manager:          [
    { label: 'Planner', route: 'planner' },
    { label: 'Control Tower', route: 'control-tower' },
    { label: 'Releases', route: 'releases' },
  ],
  business_analyst: [
    { label: 'Planner', route: 'planner' },
    { label: 'Canvas', route: 'canvas' },
    { label: 'Analytics', route: 'analytics' },
  ],
  product_designer: [
    { label: 'Brand', route: 'brand' },
    { label: 'Components', route: 'components' },
    { label: 'Design', route: 'design' },
  ],
  frontend_dev:     [
    { label: 'Components', route: 'components' },
    { label: 'Handoff', route: 'handoff' },
    { label: 'Code', route: 'code' },
  ],
  backend_dev:      [
    { label: 'Workflows', route: 'workflows' },
    { label: 'Code', route: 'code' },
    { label: 'Handoff', route: 'handoff' },
  ],
  qa:               [
    { label: 'Testing', route: 'testing' },
    { label: 'Releases', route: 'releases' },
    { label: 'Tasks', route: 'tasks' },
  ],
  viewer:           [
    { label: 'Control Tower', route: 'control-tower' },
    { label: 'Analytics', route: 'analytics' },
  ],
}

interface Props {
  role: OrgRole
  config: RoleConfig
  userName?: string
}

export function RoleGreeting({ role, config, userName }: Props) {
  const router = useRouter()
  const params = useParams<{ orgSlug: string; productSlug: string }>()

  const Icon = ROLE_ICONS[role]
  const tagline = ROLE_TAGLINES[role]
  const studios = PRIMARY_STUDIOS[role]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden border border-[var(--border-default)] bg-[var(--accent-subtle)] p-5"
    >
      {/* Background orb */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none bg-[var(--accent)]"
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Left: greeting + tagline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-[var(--accent-subtle)] border border-[var(--accent)]/30">
              <Icon size={16} className="text-[var(--accent-text)]" />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent-text)]">
              {config.label}
            </span>
          </div>

          <h1 className="text-[18px] font-bold text-[var(--text-primary)] mt-2">
            {greeting}{userName ? `, ${userName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{tagline}</p>
        </div>

        {/* Right: AI hint */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--accent-subtle)] border border-[var(--accent)]/20 shrink-0">
          <Sparkles size={11} className="text-[var(--accent-text)]" />
          <span className="text-[10px] text-[var(--accent-text)]">Ask OpsPilot ⌘⇧O</span>
        </div>
      </div>

      {/* Quick-jump studio pills */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Your studios</span>
        {studios.map((s) => (
          <button
            key={s.route}
            onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${s.route}`)}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-all hover:scale-[1.02]"
          >
            {s.label}
            <ArrowRight size={9} />
          </button>
        ))}
      </div>
    </motion.div>
  )
}
