'use client'

import { motion } from 'framer-motion'
import {
  Lightbulb,
  LayoutTemplate,
  PenTool,
  Palette,
  Component,
  Figma,
  GitBranch,
  FileText,
  Image,
  Code2,
  FileOutput,
  Rocket,
  Bug,
  ListTodo,
  CheckSquare,
  Bell,
  BarChart3,
  Radio,
  Network,
} from 'lucide-react'
import type { OrgRole } from '../../lib/role-config'
import { roleConfigs } from '../../lib/role-config'

interface StudioInfo {
  key: string
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const studioRegistry: StudioInfo[] = [
  { key: 'planner', label: 'Planner', description: 'Define goals and features', icon: Lightbulb, color: '#8B5CF6' },
  { key: 'templates', label: 'Templates', description: 'Browse and use templates', icon: LayoutTemplate, color: '#3B82F6' },
  { key: 'canvas', label: 'Canvas', description: 'Map user journeys', icon: PenTool, color: '#EC4899' },
  { key: 'brand', label: 'Brand', description: 'Manage brand identity', icon: Palette, color: '#F43F5E' },
  { key: 'components', label: 'Components', description: 'Build UI components', icon: Component, color: '#06B6D4' },
  { key: 'design', label: 'Design', description: 'Create design systems', icon: Figma, color: '#8B5CF6' },
  { key: 'workflow', label: 'Workflow', description: 'Automate processes', icon: GitBranch, color: '#10B981' },
  { key: 'pages', label: 'Pages', description: 'Build page layouts', icon: FileText, color: '#3B82F6' },
  { key: 'graphics', label: 'Graphics', description: 'Create visual assets', icon: Image, color: '#F59E0B' },
  { key: 'code', label: 'Code', description: 'Generate and review code', icon: Code2, color: '#10B981' },
  { key: 'handoff', label: 'Handoff', description: 'Dev handoff specs', icon: FileOutput, color: '#8B5CF6' },
  { key: 'releases', label: 'Releases', description: 'Manage release cycles', icon: Rocket, color: '#3B82F6' },
  { key: 'testing', label: 'Testing', description: 'Test and QA', icon: Bug, color: '#F59E0B' },
  { key: 'tasks', label: 'Tasks', description: 'Track work items', icon: ListTodo, color: '#F59E0B' },
  { key: 'approvals', label: 'Approvals', description: 'Review and approve', icon: CheckSquare, color: '#10B981' },
  { key: 'notifications', label: 'Notifications', description: 'Stay informed', icon: Bell, color: '#06B6D4' },
  { key: 'analytics', label: 'Analytics', description: 'View insights', icon: BarChart3, color: '#8B5CF6' },
  { key: 'control-tower', label: 'Control Tower', description: 'Product overview', icon: Radio, color: '#3B82F6' },
  { key: 'graph-explorer', label: 'Graph Explorer', description: 'Explore product graph', icon: Network, color: '#06B6D4' },
]

export default function StudioShortcuts({
  role,
  orgSlug,
  productSlug,
}: {
  role: OrgRole
  orgSlug: string
  productSlug: string
}) {
  const accessibleStudios = roleConfigs[role].studios
  const studios = studioRegistry.filter((s) => accessibleStudios.includes(s.key))

  if (studios.length === 0) return null

  return (
    <div>
      <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-4">Your Studios</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {studios.map((studio, i) => {
          const Icon = studio.icon
          return (
            <motion.a
              key={studio.key}
              href={`/${orgSlug}/${productSlug}/${studio.key}`}
              className="group relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all overflow-hidden"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
            >
              {/* Subtle glow on hover */}
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                style={{ background: `radial-gradient(circle, ${studio.color}15, transparent 70%)` }}
              />

              <div className="relative flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${studio.color}12` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: studio.color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#F1F5F9] group-hover:text-white transition truncate">
                    {studio.label}
                  </div>
                  <div className="text-[11px] text-[#64748B] truncate">{studio.description}</div>
                </div>
              </div>
            </motion.a>
          )
        })}
      </div>
    </div>
  )
}
