'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, Unlink, Clock, ExternalLink } from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  connected: boolean
  lastSynced?: string
  color: string
}

const initialIntegrations: Integration[] = [
  {
    id: 'figma',
    name: 'Figma',
    description: 'Sync design files, components, and tokens from your Figma projects.',
    icon: 'F',
    connected: true,
    lastSynced: '2026-03-28T14:30:00Z',
    color: '#A259FF',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Track commits, PRs, and issues. Automate deploys and code reviews.',
    icon: 'GH',
    connected: true,
    lastSynced: '2026-03-29T08:00:00Z',
    color: '#F0F6FC',
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Import issues and epics. Two-way sync for status and assignments.',
    icon: 'J',
    connected: false,
    color: '#0052CC',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications, approval requests, and status updates to channels.',
    icon: 'S',
    connected: false,
    color: '#E01E5A',
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Pull usage metrics, conversion data, and user behavior insights.',
    icon: 'GA',
    connected: false,
    color: '#F9AB00',
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sync issues, projects, and cycles. Import roadmap into Product Planner.',
    icon: 'L',
    connected: true,
    lastSynced: '2026-03-27T18:00:00Z',
    color: '#5E6AD2',
  },
]

export function IntegrationsSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations)

  const toggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              connected: !i.connected,
              lastSynced: !i.connected
                ? new Date().toISOString()
                : undefined,
            }
          : i
      )
    )
  }

  const formatLastSynced = (ts?: string) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diffH = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60))
    if (diffH < 1) return 'Just now'
    if (diffH < 24) return `${diffH}h ago`
    return `${Math.floor(diffH / 24)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Integrations</h3>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          Connect external tools to sync data and automate workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map((integration, idx) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex flex-col p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] transition-colors"
          >
            <div className="flex items-start gap-3 mb-3">
              {/* Logo placeholder */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  backgroundColor: `${integration.color}15`,
                  color: integration.color,
                }}
              >
                {integration.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">
                    {integration.name}
                  </h4>
                  {integration.connected && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-success)]/15 text-[var(--color-success)] text-[0.5625rem] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                      Connected
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-4 flex-1">
              {integration.description}
            </p>

            {/* Synced info */}
            {integration.connected && integration.lastSynced && (
              <div className="flex items-center gap-1.5 mb-3 text-[0.625rem] text-[var(--text-tertiary)]">
                <Clock size={10} />
                Last synced {formatLastSynced(integration.lastSynced)}
              </div>
            )}

            {/* Action */}
            <button
              onClick={() => toggleConnection(integration.id)}
              className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                integration.connected
                  ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20'
                  : 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]'
              }`}
            >
              {integration.connected ? (
                <>
                  <Unlink size={13} />
                  Disconnect
                </>
              ) : (
                <>
                  <Link2 size={13} />
                  Connect
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
