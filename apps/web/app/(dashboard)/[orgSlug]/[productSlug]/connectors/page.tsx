'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Plug,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  X,
  Loader2,
  Search,
  Settings2,
  Activity,
  Link2,
  Sparkles,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Info,
  GitPullRequest,
  Figma,
  BarChart3,
  MessageSquare,
  Zap,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import {
  useConnectorStore,
  connectorRegistry,
  type ConnectorType,
  type ConnectorInstance,
  type SyncLogEntry,
} from '../../../../lib/connector-store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function connectorTypeIcon(type: ConnectorType): string {
  const def = connectorRegistry.find((d) => d.type === type)
  return def?.icon ?? '🔌'
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ConnectorInstance['status'] }) {
  const cfg = {
    connected: { label: 'Connected', color: 'var(--color-success)', bg: 'var(--color-success-muted)', icon: CheckCircle2 },
    disconnected: { label: 'Disconnected', color: 'var(--text-tertiary)', bg: 'var(--border-subtle)', icon: Clock },
    error: { label: 'Error', color: 'var(--color-error)', bg: 'var(--color-error-muted)', icon: AlertCircle },
    pending: { label: 'Pending', color: 'var(--color-warning)', bg: 'var(--color-warning-muted)', icon: Clock },
  }[status]
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Sync direction badge
// ---------------------------------------------------------------------------

function SyncDirBadge({ dir }: { dir: ConnectorInstance['syncDirection'] }) {
  if (dir === 'pull') return <span className="flex items-center gap-1 text-[10px] text-[var(--color-info)]"><ArrowDown className="w-3 h-3" />Pull only</span>
  if (dir === 'push') return <span className="flex items-center gap-1 text-[10px] text-[var(--color-success)]"><ArrowUp className="w-3 h-3" />Push only</span>
  return <span className="flex items-center gap-1 text-[10px] text-[var(--accent-text)]"><ArrowDownUp className="w-3 h-3" />Bidirectional</span>
}

// ---------------------------------------------------------------------------
// Sync log entry row
// ---------------------------------------------------------------------------

function LogRow({ entry }: { entry: SyncLogEntry }) {
  const icon = entry.status === 'success'
    ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
    : entry.status === 'error'
    ? <AlertCircle className="w-3.5 h-3.5 text-[var(--color-error)]" />
    : <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)]" />

  return (
    <div className="flex items-start gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-primary)] truncate">{entry.message}</p>
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
          {entry.direction === 'pull' ? '↓ Pull' : '↑ Push'} · {entry.objectsAffected} objects · {timeAgo(entry.timestamp)}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Connector Modal
// ---------------------------------------------------------------------------

interface AddConnectorModalProps {
  productId: string
  onClose: () => void
}

function AddConnectorModal({ productId, onClose }: AddConnectorModalProps) {
  const [selected, setSelected] = useState<ConnectorType | null>(null)
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const addConnector = useConnectorStore((s) => s.addConnector)

  const def = connectorRegistry.find((d) => d.type === selected)

  function handleAdd() {
    if (!selected || !name.trim()) return
    addConnector({
      type: selected,
      name: name.trim(),
      productId,
      status: 'connected',
      syncDirection: def?.defaultSyncDirection ?? 'pull',
      syncInterval: 60,
      config: apiKey ? { apiKey } : {},
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-[560px] max-h-[80vh] rounded-2xl border border-[var(--border-default)] overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-[var(--accent-text)]" />
            <span className="text-sm font-semibold text-[var(--text-primary)]">Add Connector</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-hover)] transition-colors">
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Connector picker */}
          <div>
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Choose Integration</p>
            <div className="grid grid-cols-2 gap-2">
              {connectorRegistry.map((reg) => (
                <button
                  key={reg.type}
                  onClick={() => { setSelected(reg.type); setName(reg.label) }}
                  className="flex items-start gap-3 p-3 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: selected === reg.type ? 'var(--accent-text)' : 'var(--border-subtle)',
                    background: selected === reg.type ? 'var(--accent-muted)' : 'var(--bg-subtle)',
                  }}
                >
                  <span className="text-xl mt-0.5">{reg.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">{reg.label}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{reg.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Config fields */}
          {selected && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-tertiary)] block mb-1.5">Connection Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)]"
                  placeholder="e.g. Main Jira Project"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-tertiary)] block mb-1.5">
                  API Key / Token <span className="text-[var(--text-tertiary)] font-normal">(optional for demo)</span>
                </label>
                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type="password"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)]"
                  placeholder="••••••••••••••••"
                />
              </div>
              {def && (
                <div
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{ background: 'var(--bg-subtle)', borderLeft: '3px solid var(--color-info)' }}
                >
                  <Info className="w-3.5 h-3.5 text-[var(--color-info)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Syncs: {def.supportedMappings.join(', ')}
                    </p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                      Default direction: <strong>{def.defaultSyncDirection}</strong> · Recommended interval: 60 min
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selected || !name.trim()}
            className="px-4 py-2 text-sm rounded-lg font-medium transition-all disabled:opacity-40"
            style={{ background: 'var(--accent-text)', color: '#fff' }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Connector detail panel
// ---------------------------------------------------------------------------

interface DetailPanelProps {
  connector: ConnectorInstance
  syncLogs: SyncLogEntry[]
  onClose: () => void
  onDelete: (id: string) => void
  onSync: (id: string) => void
}

function DetailPanel({ connector, syncLogs, onClose, onDelete, onSync }: DetailPanelProps) {
  const def = connectorRegistry.find((d) => d.type === connector.type)
  const logs = syncLogs.filter((l) => l.connectorId === connector.id)

  return (
    <div
      className="w-[380px] flex-shrink-0 border-l border-[var(--border-subtle)] flex flex-col"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{connectorTypeIcon(connector.type)}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{connector.name}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">{def?.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-hover)]">
          <X className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Stats */}
        <div className="px-5 py-4 space-y-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Status</span>
            <StatusBadge status={connector.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Sync Direction</span>
            <SyncDirBadge dir={connector.syncDirection} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Last Sync</span>
            <span className="text-xs text-[var(--text-primary)]">{timeAgo(connector.lastSyncAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Auto-sync</span>
            <span className="text-xs text-[var(--text-primary)]">
              {connector.syncInterval === 0 ? 'Manual only' : `Every ${connector.syncInterval}m`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">Mappings</span>
            <span className="text-xs font-medium text-[var(--accent-text)]">{connector.mappings.length} objects mapped</span>
          </div>
        </div>

        {/* Supported mappings */}
        <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Supported Objects</p>
          <div className="flex flex-wrap gap-1.5">
            {def?.supportedMappings.map((m) => (
              <span
                key={m}
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Sync logs */}
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Sync Activity</p>
          {logs.length === 0 ? (
            <p className="text-xs text-[var(--text-tertiary)] text-center py-6">No sync activity yet. Run a sync to get started.</p>
          ) : (
            <div>
              {logs.slice(0, 20).map((log) => <LogRow key={log.id} entry={log} />)}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex items-center gap-2">
        <button
          onClick={() => onSync(connector.id)}
          disabled={connector.syncStatus === 'syncing'}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
          style={{ background: 'var(--accent-text)', color: '#fff' }}
        >
          {connector.syncStatus === 'syncing'
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Syncing…</>
            : <><RefreshCw className="w-3.5 h-3.5" />Sync Now</>
          }
        </button>
        <button
          onClick={() => { onDelete(connector.id); onClose() }}
          className="p-2 rounded-lg hover:bg-[var(--color-error-muted)] text-[var(--color-error)] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AI Suggestions panel
// ---------------------------------------------------------------------------

const AI_SUGGESTIONS = [
  {
    type: 'github' as ConnectorType,
    reason: 'You have 12 code-stage tasks — GitHub sync would auto-update task status when PRs merge.',
  },
  {
    type: 'figma' as ConnectorType,
    reason: 'Your Design Studio has 8 screens. Figma sync would keep component tokens in sync automatically.',
  },
  {
    type: 'slack' as ConnectorType,
    reason: '3 pending approvals are blocking releases. Slack alerts would notify reviewers instantly.',
  },
]

function AISuggestions({ connectors, onAdd }: { connectors: ConnectorInstance[]; onAdd: () => void }) {
  const existingTypes = new Set(connectors.map((c) => c.type))
  const suggestions = AI_SUGGESTIONS.filter((s) => !existingTypes.has(s.type))

  if (suggestions.length === 0) return null

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: 'var(--accent-text)', background: 'var(--accent-muted)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
        <span className="text-xs font-semibold text-[var(--accent-text)]">AI Connector Suggestions</span>
      </div>
      <div className="space-y-2">
        {suggestions.map((s) => {
          const def = connectorRegistry.find((d) => d.type === s.type)!
          return (
            <div key={s.type} className="flex items-start gap-3">
              <span className="text-lg">{def.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)]">{def.label}</p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{s.reason}</p>
              </div>
              <button
                onClick={onAdd}
                className="text-[10px] px-2 py-1 rounded-lg font-medium flex-shrink-0 transition-all hover:opacity-80"
                style={{ background: 'var(--accent-text)', color: '#fff' }}
              >
                Connect
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary stats bar
// ---------------------------------------------------------------------------

function StatsBar({ connectors, syncLogs }: { connectors: ConnectorInstance[]; syncLogs: SyncLogEntry[] }) {
  const connected = connectors.filter((c) => c.status === 'connected').length
  const errors = connectors.filter((c) => c.status === 'error').length
  const totalSyncs = syncLogs.length
  const totalObjects = syncLogs.reduce((a, l) => a + l.objectsAffected, 0)

  const stats = [
    { label: 'Connected', value: connected, color: 'var(--color-success)' },
    { label: 'With Errors', value: errors, color: 'var(--color-error)' },
    { label: 'Total Syncs', value: totalSyncs, color: 'var(--accent-text)' },
    { label: 'Objects Synced', value: totalObjects, color: 'var(--text-primary)' },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl px-4 py-3 border border-[var(--border-subtle)]"
          style={{ background: 'var(--bg-card)' }}
        >
          <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Connector card
// ---------------------------------------------------------------------------

function ConnectorCard({
  connector,
  isSelected,
  onClick,
  onSync,
}: {
  connector: ConnectorInstance
  isSelected: boolean
  onClick: () => void
  onSync: (id: string) => void
}) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl border p-4 cursor-pointer transition-all hover:border-[var(--accent-text)] flex flex-col gap-3"
      style={{
        background: 'var(--bg-card)',
        borderColor: isSelected ? 'var(--accent-text)' : 'var(--border-subtle)',
        boxShadow: isSelected ? '0 0 0 1px var(--accent-text)' : 'none',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{connectorTypeIcon(connector.type)}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{connector.name}</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">
              {connectorRegistry.find((d) => d.type === connector.type)?.label}
            </p>
          </div>
        </div>
        <StatusBadge status={connector.status} />
      </div>

      <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
        <SyncDirBadge dir={connector.syncDirection} />
        <span className="ml-auto">{timeAgo(connector.lastSyncAt)}</span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] text-[var(--text-tertiary)]">{connector.mappings.length} mappings</span>
        <button
          onClick={(e) => { e.stopPropagation(); onSync(connector.id) }}
          disabled={connector.syncStatus === 'syncing'}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-medium transition-all disabled:opacity-50 hover:opacity-80"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
        >
          {connector.syncStatus === 'syncing'
            ? <><Loader2 className="w-3 h-3 animate-spin" />Syncing…</>
            : <><RefreshCw className="w-3 h-3" />Sync</>
          }
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'connected' | 'error' | 'disconnected'

export default function ConnectorsPage() {
  const params = useParams()
  const product = useProduct()
  const productId = product?.id ?? (params.productSlug as string)

  const allConnectors = useConnectorStore((s) => s.connectors)
  const allSyncLogs = useConnectorStore((s) => s.syncLogs)
  const connectors = useMemo(
    () => allConnectors.filter((c) => c.productId === productId),
    [allConnectors, productId]
  )
  const syncLogs = useMemo(
    () => allSyncLogs.filter((l) => connectors.some((c) => c.id === l.connectorId)),
    [allSyncLogs, connectors]
  )
  const triggerSync = useConnectorStore((s) => s.triggerSync)
  const deleteConnector = useConnectorStore((s) => s.deleteConnector)

  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const selectedConnector = connectors.find((c) => c.id === selectedId) ?? null

  const filtered = useMemo(() => {
    let list = connectors
    if (tab !== 'all') list = list.filter((c) => c.status === tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.type.includes(q))
    }
    return list
  }, [connectors, tab, search])

  const handleSync = useCallback((id: string) => triggerSync(id), [triggerSync])
  const handleDelete = useCallback((id: string) => deleteConnector(id), [deleteConnector])

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: connectors.length },
    { key: 'connected', label: 'Connected', count: connectors.filter((c) => c.status === 'connected').length },
    { key: 'error', label: 'Errors', count: connectors.filter((c) => c.status === 'error').length },
    { key: 'disconnected', label: 'Disconnected', count: connectors.filter((c) => c.status === 'disconnected').length },
  ]

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] flex-shrink-0"
          style={{ background: 'var(--bg-card)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent-muted)' }}
            >
              <Plug className="w-4 h-4 text-[var(--accent-text)]" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-[var(--text-primary)]">Connectors</h1>
              <p className="text-xs text-[var(--text-tertiary)]">Manage external integrations and sync state</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all hover:opacity-90"
            style={{ background: 'var(--accent-text)', color: '#fff' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Connector
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Stats */}
          <StatsBar connectors={connectors} syncLogs={syncLogs} />

          {/* AI Suggestions */}
          <AISuggestions connectors={connectors} onAdd={() => setShowAdd(true)} />

          {/* Filter + search bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl border border-[var(--border-subtle)]" style={{ background: 'var(--bg-subtle)' }}>
              {filterTabs.map((ft) => (
                <button
                  key={ft.key}
                  onClick={() => setTab(ft.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all"
                  style={{
                    background: tab === ft.key ? 'var(--bg-card)' : 'transparent',
                    color: tab === ft.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    boxShadow: tab === ft.key ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {ft.label}
                  {ft.count !== undefined && ft.count > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    >
                      {ft.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search connectors…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-text)]"
              />
            </div>
          </div>

          {/* Connectors grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--bg-subtle)' }}
              >
                <Plug className="w-7 h-7 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">No connectors yet</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs">
                Connect GitHub, Figma, Jira, Slack, and more to keep your product graph in sync with external tools.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-5 flex items-center gap-2 px-5 py-2.5 text-xs font-medium rounded-xl transition-all hover:opacity-90"
                style={{ background: 'var(--accent-text)', color: '#fff' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Your First Connector
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((c) => (
                <ConnectorCard
                  key={c.id}
                  connector={c}
                  isSelected={selectedId === c.id}
                  onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                  onSync={handleSync}
                />
              ))}
            </div>
          )}

          {/* Global sync log */}
          {syncLogs.length > 0 && (
            <div
              className="rounded-2xl border border-[var(--border-subtle)] p-4"
              style={{ background: 'var(--bg-card)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">Recent Sync Activity</span>
                <span
                  className="ml-auto text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}
                >
                  {syncLogs.length} entries
                </span>
              </div>
              {syncLogs.slice(0, 8).map((log) => <LogRow key={log.id} entry={log} />)}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedConnector && (
        <DetailPanel
          connector={selectedConnector}
          syncLogs={syncLogs}
          onClose={() => setSelectedId(null)}
          onDelete={handleDelete}
          onSync={handleSync}
        />
      )}

      {/* Add connector modal */}
      {showAdd && (
        <AddConnectorModal
          productId={productId}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
