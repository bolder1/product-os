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
} from 'lucide-react'
import {
  useConnectorStore,
  connectorRegistry,
  type ConnectorType,
  type ConnectorInstance,
  type SyncDirection,
} from '../../lib/connector-store'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SyncDirectionBadge({ dir }: { dir: SyncDirection }) {
  if (dir === 'pull') return <span className="flex items-center gap-1 text-[10px] text-[var(--color-info)]"><ArrowDown className="w-3 h-3" />Pull</span>
  if (dir === 'push') return <span className="flex items-center gap-1 text-[10px] text-[var(--color-success)]"><ArrowUp className="w-3 h-3" />Push</span>
  return <span className="flex items-center gap-1 text-[10px] text-[var(--accent-text)]"><ArrowDownUp className="w-3 h-3" />Bi-dir</span>
}

function StatusDot({ status }: { status: ConnectorInstance['status'] }) {
  const colors = {
    connected: 'bg-[var(--color-success)]',
    disconnected: 'bg-[#555]',
    error: 'bg-[var(--color-error)]',
    pending: 'bg-[var(--color-warning)]',
  }
  return <span className={`w-1.5 h-1.5 rounded-full ${colors[status]}`} />
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ConnectorsPanelProps {
  productId: string
  open: boolean
  onClose: () => void
}

export function ConnectorsPanel({ productId, open, onClose }: ConnectorsPanelProps) {
  const connectors = useConnectorStore((s) => s.connectors)
  const syncLogs = useConnectorStore((s) => s.syncLogs)
  const addConnector = useConnectorStore((s) => s.addConnector)
  const deleteConnector = useConnectorStore((s) => s.deleteConnector)
  const triggerSync = useConnectorStore((s) => s.triggerSync)

  const [showAddPanel, setShowAddPanel] = useState(false)
  const [selectedType, setSelectedType] = useState<ConnectorType | null>(null)
  const [connectorName, setConnectorName] = useState('')

  const productConnectors = useMemo(
    () => connectors.filter((c) => c.productId === productId),
    [connectors, productId]
  )

  const productLogs = useMemo(
    () => syncLogs.filter((l) => productConnectors.some((c) => c.id === l.connectorId)).slice(0, 10),
    [syncLogs, productConnectors]
  )

  const connectedTypes = useMemo(
    () => new Set(productConnectors.map((c) => c.type)),
    [productConnectors]
  )

  const handleAdd = useCallback(() => {
    if (!selectedType || !connectorName.trim()) return
    const def = connectorRegistry.find((r) => r.type === selectedType)
    if (!def) return
    addConnector({
      type: selectedType,
      name: connectorName.trim(),
      productId,
      status: 'connected',
      syncDirection: def.defaultSyncDirection,
      config: {},
    })
    setShowAddPanel(false)
    setSelectedType(null)
    setConnectorName('')
  }, [selectedType, connectorName, productId, addConnector])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[680px] max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <Plug className="w-3.5 h-3.5 text-[var(--accent-text)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Connectors</span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {productConnectors.length} connected &middot; {connectorRegistry.length} available
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAddPanel(!showAddPanel)}
              className="tool-btn text-[11px] text-[var(--accent-text)]"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
            <button onClick={onClose} className="tool-btn p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Add panel */}
        {showAddPanel && (
          <div className="border-b border-[var(--border-default)] px-3 py-3">
            <p className="tool-section-label mb-2">Choose connector</p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {connectorRegistry.map((def) => (
                <button
                  key={def.type}
                  onClick={() => {
                    setSelectedType(def.type)
                    setConnectorName(def.label)
                  }}
                  disabled={connectedTypes.has(def.type)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-[var(--radius-md)] border transition-colors text-center ${
                    selectedType === def.type
                      ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5'
                      : connectedTypes.has(def.type)
                      ? 'border-[var(--border-subtle)] bg-[var(--bg-inset)] opacity-40 cursor-not-allowed'
                      : 'border-[var(--border-default)] bg-[var(--bg-inset)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <span className="text-base">{def.icon}</span>
                  <span className="text-[11px] text-[var(--text-secondary)] font-medium">{def.label}</span>
                </button>
              ))}
            </div>

            {selectedType && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={connectorName}
                  onChange={(e) => setConnectorName(e.target.value)}
                  placeholder="Connector name..."
                  className="tool-input flex-1 py-1.5"
                />
                <button onClick={handleAdd} className="tool-btn tool-btn-primary text-[11px]">
                  Connect
                </button>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto p-3 space-y-1.5">
          {/* Connected list */}
          {productConnectors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Plug className="w-5 h-5 text-[var(--text-tertiary)]" />
              <p className="text-[12px] text-[var(--text-secondary)]">No connectors configured</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">Add integrations to sync external tools into your product graph.</p>
            </div>
          ) : (
            productConnectors.map((conn) => {
              const def = connectorRegistry.find((r) => r.type === conn.type)
              return (
                <div
                  key={conn.id}
                  className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{def?.icon ?? '🔌'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[var(--text-primary)]">{conn.name}</span>
                          <StatusDot status={conn.status} />
                          <span className="text-[10px] text-[var(--text-tertiary)]">{conn.status}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <SyncDirectionBadge dir={conn.syncDirection} />
                          {conn.lastSyncAt && (
                            <span className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                              <Clock className="w-3 h-3" />
                              Last: {new Date(conn.lastSyncAt).toLocaleTimeString()}
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            {conn.mappings.length} mapping{conn.mappings.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => triggerSync(conn.id)}
                        disabled={conn.syncStatus === 'syncing'}
                        className="tool-btn text-[11px] disabled:opacity-40"
                      >
                        {conn.syncStatus === 'syncing' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        Sync
                      </button>
                      <button
                        onClick={() => deleteConnector(conn.id)}
                        className="tool-btn p-1 hover:text-[var(--color-error)]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* Sync logs */}
          {productLogs.length > 0 && (
            <div className="mt-3">
              <p className="tool-section-label">Recent Sync Activity</p>
              <div className="space-y-0.5">
                {productLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-inset)]">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-3 h-3 text-[var(--color-success)] shrink-0" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-[var(--color-error)] shrink-0" />
                    )}
                    <span className="text-[11px] text-[var(--text-secondary)] flex-1">{log.message}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
