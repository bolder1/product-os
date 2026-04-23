'use client'

import { motion } from 'framer-motion'
import { Plug, CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { useState } from 'react'

type ConnectorState = 'synced' | 'stale' | 'error' | 'disconnected'

interface ConnectorEntry {
  id: string
  name: string
  icon: string
  state: ConnectorState
  lastSync?: string
  detail?: string
}

const STATE_CONFIG: Record<ConnectorState, { icon: React.ReactNode; color: string; label: string }> = {
  synced:       { icon: <CheckCircle2 size={10} />, color: '#10B981', label: 'Synced'       },
  stale:        { icon: <Clock size={10} />,        color: '#F59E0B', label: 'Stale'        },
  error:        { icon: <XCircle size={10} />,      color: '#F43F5E', label: 'Error'        },
  disconnected: { icon: <AlertTriangle size={10} />,color: '#64748B', label: 'Disconnected' },
}

// Demo data — real implementation reads from connector-store / trpc
const DEMO_CONNECTORS: ConnectorEntry[] = [
  { id: 'github',   name: 'GitHub',    icon: '🐙', state: 'synced',       lastSync: '2m ago',   detail: 'main branch up to date' },
  { id: 'figma',    name: 'Figma',     icon: '🎨', state: 'stale',        lastSync: '4h ago',   detail: 'Design file changed since last sync' },
  { id: 'jira',     name: 'Jira',      icon: '🟦', state: 'synced',       lastSync: '12m ago',  detail: '3 issues imported' },
  { id: 'stripe',   name: 'Stripe',    icon: '💳', state: 'error',        lastSync: '2d ago',   detail: 'Auth token expired' },
  { id: 'notion',   name: 'Notion',    icon: '📄', state: 'disconnected', lastSync: undefined,  detail: 'Not connected' },
]

function timeAgo(str?: string) { return str ?? '—' }

export function ConnectorStatusInline() {
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await new Promise((r) => setTimeout(r, 900))
    setRefreshing(false)
  }

  const synced       = DEMO_CONNECTORS.filter((c) => c.state === 'synced').length
  const needsAction  = DEMO_CONNECTORS.filter((c) => c.state === 'error' || c.state === 'stale').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plug className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">Connector Status</span>
        </div>
        <div className="flex items-center gap-2">
          {needsAction > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-medium">
              {needsAction} need attention
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-[#475569] hover:text-[#94A3B8] transition-colors disabled:opacity-40"
            title="Refresh all connectors"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#10B981]/12 text-[#10B981] font-medium">{synced} synced</span>
        {DEMO_CONNECTORS.filter((c) => c.state === 'stale').length > 0 && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#F59E0B]/12 text-[#F59E0B] font-medium">
            {DEMO_CONNECTORS.filter((c) => c.state === 'stale').length} stale
          </span>
        )}
        {DEMO_CONNECTORS.filter((c) => c.state === 'error').length > 0 && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#F43F5E]/12 text-[#F43F5E] font-medium">
            {DEMO_CONNECTORS.filter((c) => c.state === 'error').length} error
          </span>
        )}
      </div>

      {/* Connector rows */}
      <div className="flex flex-col gap-1.5">
        {DEMO_CONNECTORS.map((c, i) => {
          const cfg = STATE_CONFIG[c.state]
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-sm leading-none w-5 text-center">{c.icon}</span>
              <span className="text-[11px] text-[#94A3B8] font-medium flex-1 truncate">{c.name}</span>
              <span className="text-[9px] text-[#475569] hidden sm:block">{timeAgo(c.lastSync)}</span>
              <div className="flex items-center gap-1" style={{ color: cfg.color }}>
                {cfg.icon}
                <span className="text-[9px] font-medium">{cfg.label}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
