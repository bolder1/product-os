'use client'

import { useState } from 'react'
import {
  Home, Map, Palette, Code2, Rocket, CheckSquare, Sparkles, Settings2,
  Eye, EyeOff, GripVertical,
} from 'lucide-react'

interface WorkspaceConfig {
  key: string
  label: string
  description: string
  icon: React.ElementType
  color: string
  enabled: boolean
  defaultView: string
  views: string[]
}

const DEFAULT_WORKSPACES: WorkspaceConfig[] = [
  {
    key: 'home',
    label: 'Home',
    description: 'Unified inbox, org pulse, and role-specific dashboard',
    icon: Home,
    color: '#6366F1',
    enabled: true,
    defaultView: 'dashboard',
    views: ['dashboard'],
  },
  {
    key: 'plan',
    label: 'Plan',
    description: 'Specs, roadmaps, features, decisions, and templates',
    icon: Map,
    color: '#3B82F6',
    enabled: true,
    defaultView: 'planner',
    views: ['planner', 'roadmap', 'features', 'templates', 'canvas', 'decisions'],
  },
  {
    key: 'design',
    label: 'Design',
    description: 'Canvas, brand tokens, components, pages, and graphics',
    icon: Palette,
    color: '#EC4899',
    enabled: true,
    defaultView: 'design',
    views: ['design', 'brand', 'components', 'pages', 'graphics'],
  },
  {
    key: 'engineer',
    label: 'Engineer',
    description: 'Code generation, handoff, and workflow configuration',
    icon: Code2,
    color: '#10B981',
    enabled: true,
    defaultView: 'code',
    views: ['code', 'handoff', 'workflows'],
  },
  {
    key: 'ship',
    label: 'Ship',
    description: 'Releases and testing runs',
    icon: Rocket,
    color: '#F59E0B',
    enabled: true,
    defaultView: 'releases',
    views: ['releases', 'testing'],
  },
  {
    key: 'operate',
    label: 'Operate',
    description: 'Tasks, approvals, and analytics',
    icon: CheckSquare,
    color: '#8B5CF6',
    enabled: true,
    defaultView: 'tasks',
    views: ['tasks', 'approvals', 'analytics'],
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    description: 'AI skills, ops-pilot, and brand compliance',
    icon: Sparkles,
    color: '#A78BFA',
    enabled: true,
    defaultView: 'ai-skills',
    views: ['ai-skills', 'brand-compliance'],
  },
  {
    key: 'system',
    label: 'System',
    description: 'Graph explorer, connectors, and admin settings',
    icon: Settings2,
    color: '#64748B',
    enabled: true,
    defaultView: 'graph-explorer',
    views: ['graph-explorer', 'connectors', 'settings'],
  },
]

export function WorkspacesSettings() {
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>(DEFAULT_WORKSPACES)
  const [saved, setSaved] = useState(false)

  const toggle = (key: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.key === key ? { ...ws, enabled: !ws.enabled } : ws))
    )
    setSaved(false)
  }

  const setDefault = (key: string, view: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.key === key ? { ...ws, defaultView: view } : ws))
    )
    setSaved(false)
  }

  const handleSave = () => {
    // Persist via localStorage and notify same-tab listeners
    try {
      const serialised = JSON.stringify(workspaces)
      localStorage.setItem('product-os-workspace-config', serialised)
      // The native `storage` event only fires in *other* tabs; dispatch manually for same-tab
      window.dispatchEvent(new StorageEvent('storage', { key: 'product-os-workspace-config', newValue: serialised }))
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const enabledCount = workspaces.filter((ws) => ws.enabled).length

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Workspace Visibility</h2>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
          Choose which of the 8 workspaces appear in the sidebar. At least 1 must remain enabled.
        </p>
      </div>

      <div className="space-y-1.5">
        {workspaces.map((ws) => {
          const Icon = ws.icon
          const isLast = enabledCount === 1 && ws.enabled
          return (
            <div
              key={ws.key}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                ws.enabled
                  ? 'bg-[var(--bg-surface)] border-[var(--border-default)]'
                  : 'bg-[var(--bg-workspace)] border-[var(--border-subtle)] opacity-50'
              }`}
            >
              <GripVertical size={12} className="text-[var(--text-tertiary)] shrink-0 cursor-grab" />

              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${ws.color}18` }}
              >
                <Icon size={13} style={{ color: ws.color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-[var(--text-primary)]">{ws.label}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] truncate">{ws.description}</div>
              </div>

              {/* Default view selector */}
              {ws.enabled && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-[var(--text-tertiary)]">Default:</span>
                  <select
                    value={ws.defaultView}
                    onChange={(e) => setDefault(ws.key, e.target.value)}
                    className="text-[10px] bg-[var(--bg-workspace)] border border-[var(--border-default)] rounded px-1.5 py-0.5 text-[var(--text-primary)] outline-none"
                  >
                    {ws.views.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Toggle */}
              <button
                onClick={() => toggle(ws.key)}
                disabled={isLast}
                title={isLast ? 'At least one workspace must be enabled' : undefined}
                className="shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-pressed={ws.enabled}
                aria-label={`${ws.enabled ? 'Hide' : 'Show'} ${ws.label} workspace`}
              >
                {ws.enabled ? (
                  <Eye size={14} className="text-[var(--accent-text)]" />
                ) : (
                  <EyeOff size={14} className="text-[var(--text-tertiary)]" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-tertiary)]">
          {enabledCount} of {workspaces.length} workspaces visible
        </span>
        <button
          onClick={handleSave}
          className="tool-btn tool-btn-primary text-[11px]"
        >
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
