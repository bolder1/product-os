'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  Sliders,
  Users,
  ShieldCheck,
  Clock,
  Plug,
  AlertTriangle,
} from 'lucide-react'
import { GeneralSettings } from './_components/general-settings'
import { TeamSettings } from './_components/team-settings'
import { RolesAccess } from './_components/roles-access'
import { Changelog } from './_components/changelog'
import { IntegrationsSettings } from './_components/integrations-settings'
import { DangerZone } from './_components/danger-zone'

type SettingsTab = 'general' | 'team' | 'roles' | 'changelog' | 'integrations' | 'danger'

interface TabConfig {
  key: SettingsTab
  label: string
  icon: typeof Settings
  color?: string
}

const TABS: TabConfig[] = [
  { key: 'general', label: 'General', icon: Sliders },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'roles', label: 'Roles & Access', icon: ShieldCheck },
  { key: 'changelog', label: 'Changelog', icon: Clock },
  { key: 'integrations', label: 'Integrations', icon: Plug },
  { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, color: '#F43F5E' },
]

const TAB_COMPONENTS: Record<SettingsTab, React.FC> = {
  general: GeneralSettings,
  team: TeamSettings,
  roles: RolesAccess,
  changelog: Changelog,
  integrations: IntegrationsSettings,
  danger: DangerZone,
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  const ActiveComponent = TAB_COMPONENTS[activeTab]

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#94A3B8]/10 flex items-center justify-center">
          <Settings size={18} className="text-[#94A3B8]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#F1F5F9]">Settings</h1>
          <p className="text-xs text-[#64748B]">
            Manage your product configuration
          </p>
        </div>
      </div>

      {/* Main layout: vertical tabs on left, content on right */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Sidebar tabs */}
        <nav className="w-48 shrink-0 space-y-0.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            const color = tab.color || (isActive ? '#3B82F6' : undefined)
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-white/[0.06] text-[#F1F5F9]'
                    : 'text-[#94A3B8] hover:bg-white/[0.03] hover:text-[#CBD5E1]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#3B82F6]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={16}
                  style={{ color: color || 'currentColor' }}
                />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
