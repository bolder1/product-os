'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, Loader2 } from 'lucide-react'
import {
  type NodeKind,
  type EdgeKind,
  type GraphNode,
  NODE_KIND_COLORS,
  NODE_KIND_LABELS,
  EDGE_KIND_LABELS,
} from '../_data/mock-graph'

// ── Constants ────────────────────────────────────────────────────────────────
const NODE_KINDS: NodeKind[] = ['module', 'feature', 'page', 'entity', 'component', 'workflow', 'token', 'journey']
const EDGE_KINDS: EdgeKind[] = ['contains', 'depends_on', 'implements', 'uses_component', 'routes_to']

// ── Add Node Modal ───────────────────────────────────────────────────────────
interface AddNodeModalProps {
  onClose: () => void
  onSubmit: (label: string, kind: NodeKind, data: Record<string, string>) => Promise<void>
}

export function AddNodeModal({ onClose, onSubmit }: AddNodeModalProps) {
  const [label, setLabel] = useState('')
  const [kind, setKind] = useState<NodeKind>('feature')
  const [dataRows, setDataRows] = useState<{ key: string; value: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addRow = () => setDataRows((r) => [...r, { key: '', value: '' }])
  const removeRow = (i: number) => setDataRows((r) => r.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: 'key' | 'value', val: string) =>
    setDataRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)))

  const handleSubmit = async () => {
    if (!label.trim()) { setError('Label is required'); return }
    setLoading(true)
    setError('')
    try {
      const data = Object.fromEntries(
        dataRows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value])
      )
      await onSubmit(label.trim(), kind, data)
      onClose()
    } catch {
      setError('Failed to create node')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Add Node" onClose={onClose}>
        {/* Kind pills */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#64748B]">Type</label>
          <div className="flex flex-wrap gap-1.5">
            {NODE_KINDS.map((k) => {
              const active = k === kind
              const color = NODE_KIND_COLORS[k]
              return (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                  style={{
                    backgroundColor: active ? `${color}20` : 'rgba(255,255,255,0.04)',
                    color: active ? color : '#64748B',
                    outline: active ? `1px solid ${color}50` : undefined,
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  {NODE_KIND_LABELS[k]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-[#64748B]">Label</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder={`e.g. ${kind === 'module' ? 'Auth Module' : kind === 'feature' ? 'User Profile' : kind === 'page' ? '/dashboard' : 'New ' + NODE_KIND_LABELS[kind]}`}
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#8B5CF6]/40 focus:ring-1 focus:ring-[#8B5CF6]/20"
          />
          {error && <span className="text-[11px] text-red-400">{error}</span>}
        </div>

        {/* Properties */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-[#64748B]">Properties <span className="normal-case text-[#64748B]/60">(optional)</span></label>
            <button onClick={addRow} className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-0.5 transition-colors">
              <Plus size={10} /> Add field
            </button>
          </div>
          {dataRows.map((row, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={row.key}
                onChange={(e) => updateRow(i, 'key', e.target.value)}
                placeholder="key"
                className="flex-1 px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-[#94A3B8] placeholder:text-[#64748B]/50 focus:outline-none focus:border-[#8B5CF6]/30"
              />
              <input
                value={row.value}
                onChange={(e) => updateRow(i, 'value', e.target.value)}
                placeholder="value"
                className="flex-1 px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-[#94A3B8] placeholder:text-[#64748B]/50 focus:outline-none focus:border-[#8B5CF6]/30"
              />
              <button onClick={() => removeRow(i)} className="text-[#64748B] hover:text-red-400 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
          {dataRows.length === 0 && (
            <p className="text-[11px] text-[#64748B]/60 italic">No properties yet</p>
          )}
        </div>

        <ModalFooter onCancel={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Create Node" />
      </ModalCard>
    </Overlay>
  )
}

// ── Edit Node Modal ──────────────────────────────────────────────────────────
interface EditNodeModalProps {
  node: GraphNode
  onClose: () => void
  onSubmit: (id: string, label: string, data: Record<string, string>) => Promise<void>
}

export function EditNodeModal({ node, onClose, onSubmit }: EditNodeModalProps) {
  const [label, setLabel] = useState(node.label)
  const [dataRows, setDataRows] = useState<{ key: string; value: string }[]>(
    Object.entries(node.data).map(([k, v]) => ({ key: k, value: v }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const color = NODE_KIND_COLORS[node.kind]

  const addRow = () => setDataRows((r) => [...r, { key: '', value: '' }])
  const removeRow = (i: number) => setDataRows((r) => r.filter((_, idx) => idx !== i))
  const updateRow = (i: number, field: 'key' | 'value', val: string) =>
    setDataRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)))

  const handleSubmit = async () => {
    if (!label.trim()) { setError('Label is required'); return }
    setLoading(true)
    setError('')
    try {
      const data = Object.fromEntries(
        dataRows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value])
      )
      await onSubmit(node.id, label.trim(), data)
      onClose()
    } catch {
      setError('Failed to save changes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Overlay onClose={onClose}>
      <ModalCard
        title={
          <span className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-semibold"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {node.label.charAt(0)}
            </span>
            Edit · {node.label}
          </span>
        }
        onClose={onClose}
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-[#64748B]">Label</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-[#F1F5F9] focus:outline-none focus:border-[#8B5CF6]/40 focus:ring-1 focus:ring-[#8B5CF6]/20"
          />
          {error && <span className="text-[11px] text-red-400">{error}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-[#64748B]">Properties</label>
            <button onClick={addRow} className="text-[10px] text-[#8B5CF6] hover:text-[#A78BFA] flex items-center gap-0.5 transition-colors">
              <Plus size={10} /> Add field
            </button>
          </div>
          {dataRows.map((row, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                value={row.key}
                onChange={(e) => updateRow(i, 'key', e.target.value)}
                placeholder="key"
                className="flex-1 px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-[#94A3B8] placeholder:text-[#64748B]/50 focus:outline-none focus:border-[#8B5CF6]/30"
              />
              <input
                value={row.value}
                onChange={(e) => updateRow(i, 'value', e.target.value)}
                placeholder="value"
                className="flex-1 px-2 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[11px] text-[#94A3B8] placeholder:text-[#64748B]/50 focus:outline-none focus:border-[#8B5CF6]/30"
              />
              <button onClick={() => removeRow(i)} className="text-[#64748B] hover:text-red-400 transition-colors">
                <X size={12} />
              </button>
            </div>
          ))}
          {dataRows.length === 0 && (
            <p className="text-[11px] text-[#64748B]/60 italic">No properties</p>
          )}
        </div>

        <ModalFooter onCancel={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Save Changes" />
      </ModalCard>
    </Overlay>
  )
}

// ── Add Edge Modal ───────────────────────────────────────────────────────────
interface AddEdgeModalProps {
  sourceNode: GraphNode
  allNodes: GraphNode[]
  onClose: () => void
  onSubmit: (sourceId: string, targetId: string, kind: EdgeKind) => Promise<void>
}

export function AddEdgeModal({ sourceNode, allNodes, onClose, onSubmit }: AddEdgeModalProps) {
  const otherNodes = allNodes.filter((n) => n.id !== sourceNode.id)
  const [targetId, setTargetId] = useState(otherNodes[0]?.id ?? '')
  const [kind, setKind] = useState<EdgeKind>('contains')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const color = NODE_KIND_COLORS[sourceNode.kind]

  const handleSubmit = async () => {
    if (!targetId) { setError('Select a target node'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit(sourceNode.id, targetId, kind)
      onClose()
    } catch {
      setError('Failed to create connection')
    } finally {
      setLoading(false)
    }
  }

  const targetNode = otherNodes.find((n) => n.id === targetId)

  return (
    <Overlay onClose={onClose}>
      <ModalCard title="Connect Nodes" onClose={onClose}>
        {/* Source display */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-[#64748B]">From</label>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {sourceNode.label.charAt(0)}
            </div>
            <span className="text-[12px] text-[#F1F5F9] truncate">{sourceNode.label}</span>
            <span className="ml-auto text-[10px] shrink-0" style={{ color }}>{NODE_KIND_LABELS[sourceNode.kind]}</span>
          </div>
        </div>

        {/* Relationship kind */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wider text-[#64748B]">Relationship</label>
          <div className="flex flex-wrap gap-1.5">
            {EDGE_KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  k === kind
                    ? 'bg-[#8B5CF6]/20 text-[#A78BFA] ring-1 ring-[#8B5CF6]/40'
                    : 'bg-white/[0.04] text-[#64748B] hover:text-[#94A3B8]'
                }`}
              >
                {EDGE_KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        {/* Target select */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-[#64748B]">To</label>
          <div className="relative">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[12px] text-[#F1F5F9] focus:outline-none focus:border-[#8B5CF6]/40 appearance-none cursor-pointer"
            >
              {otherNodes.map((n) => (
                <option key={n.id} value={n.id} className="bg-[#0D1117] text-[#F1F5F9]">
                  {n.label}  ({NODE_KIND_LABELS[n.kind]})
                </option>
              ))}
            </select>
            {targetNode && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                style={{ backgroundColor: NODE_KIND_COLORS[targetNode.kind] }}
              />
            )}
          </div>
          {error && <span className="text-[11px] text-red-400">{error}</span>}
        </div>

        <ModalFooter onCancel={onClose} onSubmit={handleSubmit} loading={loading} submitLabel="Connect" />
      </ModalCard>
    </Overlay>
  )
}

// ── Shared primitives ────────────────────────────────────────────────────────
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </motion.div>
  )
}

function ModalCard({
  title,
  onClose,
  children,
}: {
  title: React.ReactNode
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0, y: 6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.96, opacity: 0, y: 6 }}
      transition={{ type: 'spring', duration: 0.28, bounce: 0.1 }}
      className="w-[420px] rounded-xl border border-white/[0.1] bg-[#0D1117]/95 backdrop-blur shadow-2xl shadow-black/60 flex flex-col gap-4 p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[#F1F5F9]">{title}</h2>
        <button onClick={onClose} className="text-[#64748B] hover:text-[#94A3B8] transition-colors">
          <X size={14} />
        </button>
      </div>
      {children}
    </motion.div>
  )
}

function ModalFooter({
  onCancel,
  onSubmit,
  loading,
  submitLabel,
}: {
  onCancel: () => void
  onSubmit: () => void
  loading: boolean
  submitLabel: string
}) {
  return (
    <div className="flex justify-end gap-2 pt-1 border-t border-white/[0.06]">
      <button
        onClick={onCancel}
        className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04] transition-all"
      >
        Cancel
      </button>
      <button
        onClick={onSubmit}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-50 transition-all"
      >
        {loading && <Loader2 size={11} className="animate-spin" />}
        {submitLabel}
      </button>
    </div>
  )
}
