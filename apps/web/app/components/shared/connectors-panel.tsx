'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plug,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Settings,
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  X,
  Loader2,
  Zap,
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
  if (dir === 'pull') return <span className="flex items-center gap-1 text-[0.5625rem] text-blue-400"><ArrowDown className="w-3 h-3" />Pull</span>
  if (dir === 'push') return <span className="flex items-center gap-1 text-[0.5625rem] text-emerald-400"><ArrowUp className="w-3 h-3" />Push</span>
  return <span className="flex items-center gap-1 text-[0.5625rem] text-purple-400"><ArrowDownUp className="w-3 h-3" />Bi-dir</span>
}

function StatusDot({ status }: { status: ConnectorInstance['status'] }) {
  const colors = {
    connected: 'bg-emerald-400',
    disconnected: 'bg-[#475569]',
    error: 'bg-rose-400',
    pending: 'bg-amber-400',
  }
  return <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-[700px] max-h-[80vh] rounded-2xl border border-white/[0.1] bg-[#0A0F1E] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Plug className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Connectors</h2>
                <p className="text-[0.6875rem] text-[#64748B]">
                  {productConnectors.length} connected &middot; {connectorRegistry.length} available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddPanel(!showAddPanel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6366F1]/10 text-[#818CF8] text-xs font-medium hover:bg-[#6366F1]/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#64748B]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add panel */}
          <AnimatePresence>
            {showAddPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-white/[0.04]"
              >
                <div className="px-6 py-4 bg-white/[0.01]">
                  <p className="text-[0.625rem] uppercase tracking-wider text-[#475569] mb-3">
                    Choose connector
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {connectorRegistry.map((def) => (
                      <button
                        key={def.type}
                        onClick={() => {
                          setSelectedType(def.type)
                          setConnectorName(def.label)
                        }}
                        disabled={connectedTypes.has(def.type)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                          selectedType === def.type
                            ? 'border-[#6366F1]/40 bg-[#6366F1]/5'
                            : connectedTypes.has(def.type)
                            ? 'border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed'
                            : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                        }`}
                      >
                        <span className="text-lg">{def.icon}</span>
                        <span className="text-[0.6875rem] text-[#94A3B8] font-medium">{def.label}</span>
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
                        className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#6366F1]/40"
                      />
                      <button
                        onClick={handleAdd}
                        className="px-4 py-2 rounded-lg bg-[#6366F1] text-white text-xs font-medium hover:bg-[#5558E6] transition-colors"
                      >
                        Connect
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {/* Connected list */}
            {productConnectors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Plug className="w-8 h-8 text-[#475569]" />
                <p className="text-sm text-[#64748B]">No connectors configured</p>
                <p className="text-[0.6875rem] text-[#475569]">Add integrations to sync external tools into your product graph.</p>
              </div>
            ) : (
              productConnectors.map((conn, i) => {
                const def = connectorRegistry.find((r) => r.type === conn.type)
                return (
                  <motion.div
                    key={conn.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{def?.icon ?? '🔌'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#F1F5F9]">{conn.name}</span>
                            <StatusDot status={conn.status} />
                            <span className="text-[0.5625rem] text-[#475569]">{conn.status}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <SyncDirectionBadge dir={conn.syncDirection} />
                            {conn.lastSyncAt && (
                              <span className="flex items-center gap-1 text-[0.5625rem] text-[#475569]">
                                <Clock className="w-3 h-3" />
                                Last sync: {new Date(conn.lastSyncAt).toLocaleTimeString()}
                              </span>
                            )}
                            <span className="text-[0.5625rem] text-[#475569]">
                              {conn.mappings.length} mapping{conn.mappings.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => triggerSync(conn.id)}
                          disabled={conn.syncStatus === 'syncing'}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#94A3B8] text-[0.6875rem] hover:bg-white/[0.08] transition-colors disabled:opacity-40"
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
                          className="p-1.5 rounded-lg text-[#475569] hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}

            {/* Sync logs */}
            {productLogs.length > 0 && (
              <div className="mt-4">
                <p className="text-[0.625rem] uppercase tracking-wider text-[#475569] mb-2 px-1">
                  Recent Sync Activity
                </p>
                <div className="space-y-1">
                  {productLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.01]">
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                      )}
                      <span className="text-[0.6875rem] text-[#94A3B8] flex-1">{log.message}</span>
                      <span className="text-[0.5625rem] text-[#475569]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
