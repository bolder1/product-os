'use client'

import { motion } from 'framer-motion'
import {
  ClipboardList,
  FileText,
  PenTool,
  Palette,
  Component,
  Paintbrush,
  GitBranch,
  FileCode,
  Code,
  ArrowRightLeft,
  Image,
  BarChart3,
  CheckSquare,
  ThumbsUp,
  Bell,
  Rocket,
  TestTube,
  Radio,
  Network,
} from 'lucide-react'

interface Studio {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  color: string
}

const studios: Studio[] = [
  // Plan
  { id: 'planner', name: 'Planner', description: 'Plan your product vision and scope', icon: <ClipboardList className="w-5 h-5" />, category: 'Plan', color: '#3B82F6' },
  { id: 'templates', name: 'Templates', description: 'Reusable product templates', icon: <FileText className="w-5 h-5" />, category: 'Plan', color: '#8B5CF6' },

  // Build
  { id: 'canvas', name: 'Canvas', description: 'Visual product canvas editor', icon: <PenTool className="w-5 h-5" />, category: 'Build', color: '#6366F1' },
  { id: 'brand', name: 'Brand', description: 'Brand identity and guidelines', icon: <Palette className="w-5 h-5" />, category: 'Build', color: '#EC4899' },
  { id: 'components', name: 'Components', description: 'Design system components', icon: <Component className="w-5 h-5" />, category: 'Build', color: '#F59E0B' },
  { id: 'design', name: 'Design', description: 'UI/UX design studio', icon: <Paintbrush className="w-5 h-5" />, category: 'Build', color: '#06B6D4' },
  { id: 'workflows', name: 'Workflows', description: 'Business logic and automations', icon: <GitBranch className="w-5 h-5" />, category: 'Build', color: '#10B981' },
  { id: 'pages', name: 'Pages', description: 'Page layouts and routing', icon: <FileCode className="w-5 h-5" />, category: 'Build', color: '#3B82F6' },
  { id: 'code', name: 'Code', description: 'Code generation and editing', icon: <Code className="w-5 h-5" />, category: 'Build', color: '#64748B' },

  // Ship
  { id: 'handoff', name: 'Handoff', description: 'Dev handoff and specs', icon: <ArrowRightLeft className="w-5 h-5" />, category: 'Ship', color: '#94A3B8' },
  { id: 'graphics', name: 'Graphics', description: 'Image and graphic assets', icon: <Image className="w-5 h-5" />, category: 'Ship', color: '#EC4899' },
  { id: 'releases', name: 'Releases', description: 'Release management', icon: <Rocket className="w-5 h-5" />, category: 'Ship', color: '#06B6D4' },
  { id: 'testing', name: 'Testing', description: 'QA and testing tools', icon: <TestTube className="w-5 h-5" />, category: 'Ship', color: '#F59E0B' },

  // Operate
  { id: 'analytics', name: 'Analytics', description: 'Product analytics and insights', icon: <BarChart3 className="w-5 h-5" />, category: 'Operate', color: '#8B5CF6' },
  { id: 'tasks', name: 'Tasks', description: 'Task and issue tracking', icon: <CheckSquare className="w-5 h-5" />, category: 'Operate', color: '#F59E0B' },
  { id: 'approvals', name: 'Approvals', description: 'Review and approval workflows', icon: <ThumbsUp className="w-5 h-5" />, category: 'Operate', color: '#10B981' },
  { id: 'notifications', name: 'Notifications', description: 'Notification management', icon: <Bell className="w-5 h-5" />, category: 'Operate', color: '#F43F5E' },

  // Overview
  { id: 'control-tower', name: 'Control Tower', description: 'Operational command center', icon: <Radio className="w-5 h-5" />, category: 'Overview', color: '#3B82F6' },
  { id: 'graph-explorer', name: 'Graph Explorer', description: 'Explore product graph data', icon: <Network className="w-5 h-5" />, category: 'Overview', color: '#6366F1' },
]

const categoryOrder = ['Plan', 'Build', 'Ship', 'Operate', 'Overview']

interface StepStudiosProps {
  activeStudios: string[]
  onChange: (activeStudios: string[]) => void
}

export default function StepStudios({ activeStudios, onChange }: StepStudiosProps) {
  const toggle = (id: string) => {
    if (activeStudios.includes(id)) {
      onChange(activeStudios.filter((s) => s !== id))
    } else {
      onChange([...activeStudios, id])
    }
  }

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    studios: studios.filter((s) => s.category === cat),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Which studios to activate?</h2>
        <p className="text-[#94A3B8] text-sm">
          Select the studios your product will use. You can always enable more later.
        </p>
      </div>

      {/* Active count */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[#64748B]">Active studios:</span>
        <span className="text-[#8B5CF6] font-semibold">{activeStudios.length}</span>
        <span className="text-[#64748B]">/ {studios.length}</span>
      </div>

      {/* Studio groups */}
      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.category}>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">{group.category}</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {group.studios.map((studio) => {
                const isActive = activeStudios.includes(studio.id)
                return (
                  <motion.button
                    key={studio.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggle(studio.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-white/[0.05] border-white/[0.12]'
                        : 'bg-white/[0.02] border-white/[0.06] opacity-60 hover:opacity-80'
                    }`}
                    style={isActive ? { borderColor: studio.color + '30' } : {}}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ backgroundColor: studio.color + (isActive ? '20' : '10'), color: isActive ? studio.color : '#64748B' }}
                    >
                      {studio.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${isActive ? 'text-[#F1F5F9]' : 'text-[#94A3B8]'}`}>{studio.name}</p>
                      <p className="text-[10px] text-[#64748B] leading-relaxed mt-0.5 line-clamp-2">{studio.description}</p>
                    </div>
                    {/* Toggle indicator */}
                    <div
                      className={`w-8 h-4 rounded-full flex items-center p-0.5 flex-shrink-0 transition-colors ${
                        isActive ? '' : 'bg-white/[0.06]'
                      }`}
                      style={isActive ? { backgroundColor: studio.color + '40' } : {}}
                    >
                      <motion.div
                        className="w-3 h-3 rounded-full"
                        animate={{ x: isActive ? 16 : 0 }}
                        style={{ backgroundColor: isActive ? studio.color : '#64748B' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
