'use client'

import { useState } from 'react'
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
  { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, color: 'var(--color-error)' },
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
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* ── Toolbar ── */}
      <div className="h-[var(--toolbar-h)] min-h-[32px] flex items-center px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <Settings className="w-3.5 h-3.5 text-[var(--text-secondary)] mr-2" />
        <span className="text-[13px] font-medium text-[var(--text-primary)]">Settings</span>
        <span className="text-[10px] text-[var(--text-tertiary)] ml-2">Product configuration</span>
      </div>

      {/* ── Main layout: left nav + right content ── */}
      <div className="flex flex-1 min-h-0">
        {/* Left tab list */}
        <nav className="w-[180px] shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border-default)] py-2 px-1.5 flex flex-col gap-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            const Icon = tab.icon
            const iconColor = tab.color || (isActive ? 'var(--accent-text)' : 'var(--text-tertiary)')
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-medium text-left transition-colors
                  ${isActive
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 w-[2px] h-3.5 rounded-r-[var(--radius-sm)] bg-[var(--accent)]" />
                )}
                <Icon
                  size={13}
                  style={{ color: iconColor }}
                  className="shrink-0"
                />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-3">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
