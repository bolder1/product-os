'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Briefcase,
  BarChart3,
  Bug,
  Palette,
  Code2,
  Server,
  Eye,
  ChevronDown,
  ChevronRight,
  Plus,
  Users,
} from 'lucide-react'
import type { OrgRole } from '../../../lib/role-config'
import { roleConfigs } from '../../../lib/role-config'

const iconMap: Record<string, React.ElementType> = {
  Shield, Briefcase, BarChart3, Bug, Palette, Code2, Server, Eye,
}

const allStudios = [
  { key: 'planner', label: 'Planner' },
  { key: 'templates', label: 'Templates' },
  { key: 'canvas', label: 'Canvas' },
  { key: 'brand', label: 'Brand' },
  { key: 'components', label: 'Components' },
  { key: 'design', label: 'Design' },
  { key: 'workflow', label: 'Workflow' },
  { key: 'pages', label: 'Pages' },
  { key: 'graphics', label: 'Graphics' },
  { key: 'code', label: 'Code' },
  { key: 'handoff', label: 'Handoff' },
  { key: 'releases', label: 'Releases' },
  { key: 'testing', label: 'Testing' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'control-tower', label: 'Control Tower' },
  { key: 'graph-explorer', label: 'Graph Explorer' },
]

const actions = ['View', 'Edit', 'Create', 'Delete', 'Approve', 'Publish']

const memberCounts: Record<OrgRole, number> = {
  admin: 1,
  manager: 2,
  business_analyst: 3,
  qa: 2,
  product_designer: 4,
  frontend_dev: 5,
  backend_dev: 3,
  viewer: 4,
}

export default function RolesPermissions() {
  const [expandedRole, setExpandedRole] = useState<OrgRole | null>(null)

  const roles = Object.entries(roleConfigs) as [OrgRole, typeof roleConfigs[OrgRole]][]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-3"
    >
      {roles.map(([roleKey, config], i) => {
        const Icon = iconMap[config.icon] || Shield
        const isExpanded = expandedRole === roleKey

        return (
          <motion.div
            key={roleKey}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            {/* Role header */}
            <button
              onClick={() => setExpandedRole(isExpanded ? null : roleKey)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}12` }}
                >
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#F1F5F9]">{config.label}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${config.color}15`, color: config.color }}
                    >
                      {memberCounts[roleKey]} members
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">{config.description}</p>
                </div>
              </div>
              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight className="w-4 h-4 text-[#64748B]" />
              </motion.div>
            </button>

            {/* Expanded panel */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-5 border-t border-white/[0.06] pt-4">
                    {/* Studio access toggles */}
                    <div>
                      <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">Studio Access</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {allStudios.map((studio) => {
                          const hasAccess = config.studios.includes(studio.key)
                          return (
                            <div
                              key={studio.key}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition cursor-pointer ${
                                hasAccess
                                  ? 'border-emerald-500/30 bg-emerald-500/8'
                                  : 'border-white/[0.06] bg-white/[0.01]'
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition ${
                                  hasAccess
                                    ? 'border-emerald-500 bg-emerald-500'
                                    : 'border-white/20 bg-transparent'
                                }`}
                              >
                                {hasAccess && (
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${hasAccess ? 'text-[#F1F5F9]' : 'text-[#64748B]'}`}>
                                {studio.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Actions matrix */}
                    <div>
                      <h4 className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-3">Allowed Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action) => {
                          const isAllowed =
                            roleKey === 'admin' ||
                            (roleKey === 'manager' && action !== 'Delete') ||
                            (roleKey === 'viewer' && action === 'View') ||
                            (!['viewer'].includes(roleKey) && ['View', 'Edit', 'Create'].includes(action))
                          return (
                            <div
                              key={action}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition cursor-pointer ${
                                isAllowed
                                  ? 'border-[#3B82F6]/30 bg-[#3B82F6]/8'
                                  : 'border-white/[0.06] bg-white/[0.01]'
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition ${
                                  isAllowed
                                    ? 'border-[#3B82F6] bg-[#3B82F6]'
                                    : 'border-white/20 bg-transparent'
                                }`}
                              >
                                {isAllowed && (
                                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                    <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span className={`text-xs ${isAllowed ? 'text-[#F1F5F9]' : 'text-[#64748B]'}`}>
                                {action}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Custom permissions toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06] bg-white/[0.01]">
                      <div>
                        <span className="text-sm text-[#F1F5F9]">Custom Permissions per Studio</span>
                        <p className="text-xs text-[#64748B] mt-0.5">Override global actions for individual studios</p>
                      </div>
                      <button className="relative w-10 h-5 rounded-full bg-white/[0.08] transition hover:bg-white/[0.12]">
                        <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-[#64748B] transition" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {/* Create custom role button */}
      <motion.button
        className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl border border-dashed border-white/[0.08] text-[#64748B] hover:text-[#94A3B8] hover:border-white/[0.15] hover:bg-white/[0.02] transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Create Custom Role</span>
      </motion.button>
    </motion.div>
  )
}
