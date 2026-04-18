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

const PRIMARY_STUDIOS: Record<OrgRole, Array<{ label: string; route: string; color: string }>> = {
  admin:            [
    { label: 'Control Tower', route: 'control-tower', color: '#3B82F6' },
    { label: 'Graph Explorer', route: 'graph-explorer', color: '#8B5CF6' },
    { label: 'Templates', route: 'templates', color: '#EC4899' },
  ],
  manager:          [
    { label: 'Planner', route: 'planner', color: '#3B82F6' },
    { label: 'Control Tower', route: 'control-tower', color: '#8B5CF6' },
    { label: 'Releases', route: 'releases', color: '#10B981' },
  ],
  business_analyst: [
    { label: 'Planner', route: 'planner', color: '#8B5CF6' },
    { label: 'Canvas', route: 'canvas', color: '#3B82F6' },
    { label: 'Analytics', route: 'analytics', color: '#F59E0B' },
  ],
  product_designer: [
    { label: 'Brand', route: 'brand', color: '#EC4899' },
    { label: 'Components', route: 'components', color: '#06B6D4' },
    { label: 'Design', route: 'design', color: '#3B82F6' },
  ],
  frontend_dev:     [
    { label: 'Components', route: 'components', color: '#06B6D4' },
    { label: 'Handoff', route: 'handoff', color: '#F59E0B' },
    { label: 'Code', route: 'code', color: '#10B981' },
  ],
  backend_dev:      [
    { label: 'Workflows', route: 'workflows', color: '#10B981' },
    { label: 'Code', route: 'code', color: '#06B6D4' },
    { label: 'Handoff', route: 'handoff', color: '#F59E0B' },
  ],
  qa:               [
    { label: 'Testing', route: 'testing', color: '#F59E0B' },
    { label: 'Releases', route: 'releases', color: '#F43F5E' },
    { label: 'Tasks', route: 'tasks', color: '#8B5CF6' },
  ],
  viewer:           [
    { label: 'Control Tower', route: 'control-tower', color: '#3B82F6' },
    { label: 'Analytics', route: 'analytics', color: '#8B5CF6' },
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
      className="relative rounded-2xl overflow-hidden border border-white/[0.08] p-5"
      style={{
        background: `linear-gradient(135deg, ${config.color}12 0%, ${config.color}06 50%, transparent 100%)`,
        borderColor: `${config.color}25`,
      }}
    >
      {/* Background orb */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ backgroundColor: config.color }}
      />

      <div className="relative flex items-start justify-between gap-4">
        {/* Left: greeting + tagline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${config.color}20`, border: `1px solid ${config.color}30` }}
            >
              <Icon size={16} style={{ color: config.color }} />
            </div>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ backgroundColor: `${config.color}15`, color: config.color }}
            >
              {config.label}
            </span>
          </div>

          <h1 className="text-[18px] font-bold text-[#F1F5F9] mt-2">
            {greeting}{userName ? `, ${userName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[12px] text-[#64748B] mt-0.5">{tagline}</p>
        </div>

        {/* Right: AI hint */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 shrink-0">
          <Sparkles size={11} className="text-[#A78BFA]" />
          <span className="text-[10px] text-[#C4B5FD]">Ask OpsPilot ⌘⇧O</span>
        </div>
      </div>

      {/* Quick-jump studio pills */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-[10px] text-[#475569] uppercase tracking-wider">Your studios</span>
        {studios.map((s) => (
          <button
            key={s.route}
            onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${s.route}`)}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: `${s.color}12`,
              borderColor: `${s.color}25`,
              color: s.color,
            }}
          >
            {s.label}
            <ArrowRight size={9} />
          </button>
        ))}
      </div>
    </motion.div>
  )
}
