'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Activity,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
  Filter,
  RefreshCw,
  Camera,
  GitBranch,
  Layers,
  Zap,
  Play,
  Pause,
} from 'lucide-react'
import { useLivingGraphStore, ROLE_PRESETS, type GraphSnapshot } from '../../../../lib/living-graph-store'
import { useAuth } from '../../../../lib/auth-context'
import type { OrgRole } from '../../../../lib/role-config'

// ---------------------------------------------------------------------------
// Role view presets
// ---------------------------------------------------------------------------

const ROLE_META: Record<OrgRole, { label: string; color: string; icon: string }> = {
  admin:            { label: 'Admin — Full view',       color: '#EF4444', icon: '🛡' },
  manager:          { label: 'Manager — Product scope', color: '#3B82F6', icon: '📋' },
  business_analyst: { label: 'Analyst — Planning',      color: '#8B5CF6', icon: '📊' },
  qa:               { label: 'QA — Testing & Releases', color: '#F59E0B', icon: '🧪' },
  product_designer: { label: 'Designer — Design system', color: '#EC4899', icon: '🎨' },
  frontend_dev:     { label: 'Frontend Dev — UI layer', color: '#06B6D4', icon: '💻' },
  backend_dev:      { label: 'Backend Dev — Services',  color: '#10B981', icon: '⚙️' },
  viewer:           { label: 'Viewer — Read only',      color: '#64748B', icon: '👁' },
}

// ---------------------------------------------------------------------------
// Node kinds → studios mapping
// ---------------------------------------------------------------------------

const STUDIO_KIND_MAP: Record<string, string> = {
  brand:     'brand',
  component: 'components',
  design:    'design',
  page:      'pages',
  graphic:   'graphics',
  code:      'code',
  workflow:  'workflow',
  handoff:   'handoff',
  task:      'tasks',
  feature:   'features',
  planner:   'planner',
  analytics: 'analytics',
  release:   'releases',
  test:      'testing',
}

const NODE_STUDIO_COLORS: Record<string, string> = {
  brand:     '#EC4899',
  component: '#8B5CF6',
  design:    '#3B82F6',
  page:      '#06B6D4',
  graphic:   '#F59E0B',
  code:      '#10B981',
  workflow:  '#F97316',
  handoff:   '#64748B',
  task:      '#EF4444',
  feature:   '#6366F1',
  planner:   '#3B82F6',
  analytics: '#8B5CF6',
  release:   '#10B981',
  test:      '#F59E0B',
  module:    '#3B82F6',
  entity:    '#10B981',
  journey:   '#F97316',
  token:     '#64748B',
}

// ---------------------------------------------------------------------------
// Mock living graph data (rich, cross-studio)
// ---------------------------------------------------------------------------

interface LivingNode {
  id: string
  studio: string
  label: string
  status: 'healthy' | 'warning' | 'stale' | 'active'
  importance: number // 1-5, controls node size
  recentActivity: boolean
  version: number
  x: number
  y: number
}

const MOCK_LIVING_NODES: LivingNode[] = [
  // Brand layer
  { id: 'brand-tokens',    studio: 'brand',     label: 'Brand Tokens',      status: 'healthy', importance: 5, recentActivity: true,  version: 3, x: 100,  y: 120 },
  { id: 'brand-voice',     studio: 'brand',     label: 'Brand Voice',       status: 'healthy', importance: 4, recentActivity: true,  version: 2, x: 280,  y: 80  },
  { id: 'color-palette',   studio: 'brand',     label: 'Color Palette',     status: 'healthy', importance: 3, recentActivity: false, version: 1, x: 100,  y: 230 },

  // Components layer
  { id: 'btn-primary',     studio: 'component', label: 'Button Primary',    status: 'healthy', importance: 4, recentActivity: false, version: 2, x: 480,  y: 100 },
  { id: 'form-kit',        studio: 'component', label: 'Form Kit',          status: 'warning', importance: 3, recentActivity: false, version: 1, x: 480,  y: 210 },
  { id: 'card-layout',     studio: 'component', label: 'Card Layout',       status: 'healthy', importance: 3, recentActivity: true,  version: 2, x: 480,  y: 310 },
  { id: 'nav-shell',       studio: 'component', label: 'Nav Shell',         status: 'active',  importance: 4, recentActivity: true,  version: 3, x: 480,  y: 400 },

  // Design / Screens
  { id: 'flow-onboarding', studio: 'design',    label: 'Onboarding Flow',   status: 'active',  importance: 5, recentActivity: true,  version: 4, x: 720,  y: 100 },
  { id: 'flow-dashboard',  studio: 'design',    label: 'Dashboard Flow',    status: 'healthy', importance: 4, recentActivity: false, version: 2, x: 720,  y: 220 },
  { id: 'flow-settings',   studio: 'design',    label: 'Settings Flow',     status: 'stale',   importance: 2, recentActivity: false, version: 1, x: 720,  y: 340 },

  // Pages
  { id: 'page-home',       studio: 'page',      label: 'Home Page',         status: 'healthy', importance: 4, recentActivity: false, version: 2, x: 940,  y: 140 },
  { id: 'page-dash',       studio: 'page',      label: 'Dashboard Page',    status: 'active',  importance: 5, recentActivity: true,  version: 5, x: 940,  y: 260 },

  // Code
  { id: 'api-auth',        studio: 'code',      label: 'Auth API',          status: 'healthy', importance: 4, recentActivity: false, version: 3, x: 1160, y: 120 },
  { id: 'api-data',        studio: 'code',      label: 'Data API',          status: 'warning', importance: 3, recentActivity: true,  version: 2, x: 1160, y: 240 },

  // Workflow
  { id: 'wf-signup',       studio: 'workflow',  label: 'Signup Flow',       status: 'healthy', importance: 3, recentActivity: false, version: 1, x: 1160, y: 360 },

  // Tasks / Planning
  { id: 'task-mvp',        studio: 'task',      label: 'MVP Sprint',        status: 'active',  importance: 5, recentActivity: true,  version: 7, x: 300,  y: 480 },
  { id: 'feat-auth',       studio: 'feature',   label: 'Auth Feature',      status: 'healthy', importance: 4, recentActivity: false, version: 2, x: 560,  y: 500 },
  { id: 'feat-payments',   studio: 'feature',   label: 'Payments',          status: 'stale',   importance: 3, recentActivity: false, version: 1, x: 760,  y: 520 },

  // Releases / Testing
  { id: 'release-v1',      studio: 'release',   label: 'v1.0 Release',      status: 'healthy', importance: 4, recentActivity: false, version: 2, x: 1000, y: 480 },
  { id: 'test-suite',      studio: 'test',      label: 'E2E Test Suite',    status: 'warning', importance: 3, recentActivity: true,  version: 3, x: 1160, y: 470 },
]

const MOCK_EDGES = [
  { id: 'e1',  source: 'brand-tokens',    target: 'btn-primary',     animated: false },
  { id: 'e2',  source: 'brand-tokens',    target: 'form-kit',        animated: false },
  { id: 'e3',  source: 'brand-tokens',    target: 'card-layout',     animated: false },
  { id: 'e4',  source: 'brand-tokens',    target: 'nav-shell',       animated: false },
  { id: 'e5',  source: 'brand-voice',     target: 'flow-onboarding', animated: true  },
  { id: 'e6',  source: 'color-palette',   target: 'brand-tokens',    animated: false },
  { id: 'e7',  source: 'btn-primary',     target: 'flow-onboarding', animated: false },
  { id: 'e8',  source: 'btn-primary',     target: 'flow-dashboard',  animated: false },
  { id: 'e9',  source: 'form-kit',        target: 'flow-onboarding', animated: false },
  { id: 'e10', source: 'card-layout',     target: 'flow-dashboard',  animated: false },
  { id: 'e11', source: 'nav-shell',       target: 'page-home',       animated: false },
  { id: 'e12', source: 'flow-onboarding', target: 'page-home',       animated: true  },
  { id: 'e13', source: 'flow-dashboard',  target: 'page-dash',       animated: false },
  { id: 'e14', source: 'page-dash',       target: 'api-data',        animated: true  },
  { id: 'e15', source: 'page-home',       target: 'api-auth',        animated: false },
  { id: 'e16', source: 'api-auth',        target: 'wf-signup',       animated: false },
  { id: 'e17', source: 'task-mvp',        target: 'feat-auth',       animated: true  },
  { id: 'e18', source: 'feat-auth',       target: 'api-auth',        animated: false },
  { id: 'e19', source: 'feat-payments',   target: 'api-data',        animated: false },
  { id: 'e20', source: 'release-v1',      target: 'test-suite',      animated: false },
  { id: 'e21', source: 'feat-auth',       target: 'release-v1',      animated: false },
  { id: 'e22', source: 'api-data',        target: 'test-suite',      animated: true  },
]

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG = {
  healthy: { color: '#10B981', pulse: false, label: 'Healthy' },
  active:  { color: '#3B82F6', pulse: true,  label: 'Active'  },
  warning: { color: '#F59E0B', pulse: true,  label: 'Warning' },
  stale:   { color: '#64748B', pulse: false, label: 'Stale'   },
}

// ---------------------------------------------------------------------------
// Custom node component
// ---------------------------------------------------------------------------

function LivingGraphNode({ data }: { data: Record<string, unknown> }) {
  const node = data.node as LivingNode
  const dimmed = data.dimmed as boolean
  const color = NODE_STUDIO_COLORS[node.studio] ?? '#64748B'
  const status = STATUS_CONFIG[node.status]
  const size = 36 + node.importance * 8 // 44..76px

  return (
    <div
      className="relative flex items-center justify-center rounded-full border-2 transition-all duration-300"
      style={{
        width: size,
        height: size,
        borderColor: dimmed ? 'rgba(255,255,255,0.06)' : color,
        backgroundColor: dimmed ? 'rgba(255,255,255,0.02)' : `${color}18`,
        opacity: dimmed ? 0.3 : 1,
        boxShadow: dimmed ? 'none' : (node.recentActivity ? `0 0 16px ${color}40` : 'none'),
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {/* Status dot */}
      <div
        className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080C14]"
        style={{ backgroundColor: status.color }}
      />

      {/* Activity pulse ring */}
      {status.pulse && !dimmed && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: `${color}20`, animationDuration: '2.5s' }}
        />
      )}

      {/* Label */}
      <div
        className="absolute top-full mt-1.5 text-[9px] font-medium whitespace-nowrap pointer-events-none"
        style={{ color: dimmed ? '#475569' : '#94A3B8' }}
      >
        {node.label}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = { living: LivingGraphNode }

// ---------------------------------------------------------------------------
// Snapshot scrubber
// ---------------------------------------------------------------------------

function SnapshotScrubber({
  snapshots,
  currentId,
  onSelect,
  playing,
  onTogglePlay,
}: {
  snapshots: GraphSnapshot[]
  currentId: string | null
  onSelect: (id: string | null) => void
  playing: boolean
  onTogglePlay: () => void
}) {
  const all = [null, ...snapshots.map((s) => s.id)]
  const currentIdx = currentId ? all.indexOf(currentId) : 0

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-white/[0.06] bg-[#0B0F1A]">
      <button
        onClick={onTogglePlay}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
          playing ? 'bg-[#3B82F6] text-white' : 'bg-white/[0.06] text-[#64748B] hover:bg-white/[0.10]'
        }`}
      >
        {playing ? <Pause size={13} /> : <Play size={13} />}
      </button>

      <div className="flex-1 relative">
        <input
          type="range"
          min={0}
          max={Math.max(all.length - 1, 1)}
          value={currentIdx}
          onChange={(e) => onSelect(all[Number(e.target.value)] ?? null)}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3B82F6 ${(currentIdx / Math.max(all.length - 1, 1)) * 100}%, rgba(255,255,255,0.08) ${(currentIdx / Math.max(all.length - 1, 1)) * 100}%)`,
          }}
        />
      </div>

      <div className="text-xs text-[#64748B] whitespace-nowrap min-w-[80px] text-right">
        {currentId === null
          ? 'Live'
          : snapshots.find((s) => s.id === currentId)?.takenAt
            ? new Date(snapshots.find((s) => s.id === currentId)!.takenAt).toLocaleDateString()
            : '—'}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Node detail drawer
// ---------------------------------------------------------------------------

function NodeDetail({
  node,
  onClose,
  orgSlug,
  productSlug,
}: {
  node: LivingNode
  onClose: () => void
  orgSlug: string
  productSlug: string
}) {
  const color = NODE_STUDIO_COLORS[node.studio] ?? '#64748B'
  const status = STATUS_CONFIG[node.status]
  const studioHref = STUDIO_KIND_MAP[node.studio] ?? node.studio
  const versions = Array.from({ length: node.version }, (_, i) => ({
    v: node.version - i,
    date: new Date(Date.now() - i * 86400000 * 3).toLocaleDateString(),
    note: i === 0 ? 'Current' : `v${node.version - i}`,
  }))

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="absolute right-0 top-0 bottom-0 w-[320px] z-30 border-l border-white/[0.08] bg-[#0B0F1A] flex flex-col"
      style={{ boxShadow: '-20px 0 48px rgba(0,0,0,0.5)' }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.08]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${color}20` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F1F5F9]">{node.label}</p>
              <p className="text-xs text-[#64748B] capitalize">{node.studio} studio</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Status + stats */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Status', value: status.label, color: status.color },
            { label: 'Version', value: `v${node.version}` },
            { label: 'Importance', value: '★'.repeat(node.importance) },
            { label: 'Activity', value: node.recentActivity ? 'Recent' : 'Quiet' },
          ].map(({ label, value, color: c }) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <p className="text-[10px] text-[#64748B] mb-0.5">{label}</p>
              <p className="text-sm font-medium" style={{ color: c ?? '#F1F5F9' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Version timeline */}
        <div>
          <p className="text-[10px] text-[#64748B] mb-2 uppercase tracking-wide font-semibold">Version History</p>
          <div className="flex flex-col gap-1.5">
            {versions.slice(0, 5).map((v) => (
              <div key={v.v} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: v.v === node.version ? color : '#334155' }}
                />
                <span className="text-xs font-mono text-[#64748B]">v{v.v}</span>
                <span className="text-xs text-[#475569] flex-1">{v.date}</span>
                {v.v === node.version && (
                  <span className="text-[9px] font-semibold text-[#3B82F6] uppercase tracking-wide">Current</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Open in studio */}
        <a
          href={`/${orgSlug}/${productSlug}/${studioHref}`}
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
        >
          <span className="text-sm font-medium text-[#F1F5F9] capitalize">{studioHref} Studio</span>
          <ExternalLink size={14} className="text-[#64748B] group-hover:text-[#F1F5F9] transition-colors" />
        </a>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LivingGraphPage({
  params,
}: {
  params: { orgSlug: string; productSlug: string }
}) {
  const { user } = useAuth()
  const userRole = (user?.role ?? 'manager') as OrgRole

  const { snapshotsByProduct, currentSnapshotId, setCurrentSnapshot, activeRole, setActiveRole } =
    useLivingGraphStore()

  const effectiveRole = activeRole ?? userRole
  const roleFilter = ROLE_PRESETS[effectiveRole]
  const allowedStudios = roleFilter.studios // empty = all

  // Build React Flow nodes + edges from mock data, filtered by role
  const buildNodes = useCallback(
    (dimFilter: boolean): Node[] =>
      MOCK_LIVING_NODES.map((n) => {
        const isDimmed = dimFilter && allowedStudios.length > 0 && !allowedStudios.includes(n.studio)
        return {
          id: n.id,
          type: 'living',
          position: { x: n.x, y: n.y },
          data: { node: n, dimmed: isDimmed },
          draggable: true,
        }
      }),
    [allowedStudios],
  )

  const buildEdges = useCallback((): Edge[] =>
    MOCK_EDGES.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated,
      style: { stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(255,255,255,0.15)', width: 12, height: 12 },
    })),
  [])

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes(true))
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges())

  // Rebuild nodes when role filter changes
  useEffect(() => {
    setNodes(buildNodes(true))
  }, [effectiveRole, buildNodes, setNodes])

  const [selectedNode, setSelectedNode] = useState<LivingNode | null>(null)
  const [roleRailOpen, setRoleRailOpen] = useState(true)
  const [playing, setPlaying] = useState(false)

  const productSnapshots = snapshotsByProduct['current'] ?? []

  // Auto-play scrubber
  const playRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!playing) { if (playRef.current) clearTimeout(playRef.current); return }
    const ids = [null, ...productSnapshots.map((s) => s.id)]
    const curIdx = currentSnapshotId ? ids.indexOf(currentSnapshotId) : 0
    const nextIdx = (curIdx + 1) % ids.length
    playRef.current = setTimeout(() => setCurrentSnapshot(ids[nextIdx] ?? null), 1500)
    return () => { if (playRef.current) clearTimeout(playRef.current) }
  }, [playing, currentSnapshotId, productSnapshots, setCurrentSnapshot])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const living = MOCK_LIVING_NODES.find((n) => n.id === node.id)
    if (living) setSelectedNode(living)
  }, [])

  // Stats
  const healthy = MOCK_LIVING_NODES.filter((n) => n.status === 'healthy').length
  const active  = MOCK_LIVING_NODES.filter((n) => n.status === 'active').length
  const warning = MOCK_LIVING_NODES.filter((n) => n.status === 'warning').length
  const stale   = MOCK_LIVING_NODES.filter((n) => n.status === 'stale').length

  return (
    <div className="flex flex-col h-full bg-[#080C14] relative overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/15 flex items-center justify-center">
              <Activity size={14} className="text-[#3B82F6]" />
            </div>
            <span className="text-sm font-semibold text-[#F1F5F9]">Living Graph</span>
          </div>

          {/* Health pills */}
          <div className="flex items-center gap-1.5 text-[10px]">
            {[
              { label: `${healthy} healthy`, color: '#10B981' },
              { label: `${active} active`,   color: '#3B82F6' },
              { label: `${warning} warning`, color: '#F59E0B' },
              { label: `${stale} stale`,     color: '#64748B' },
            ].map(({ label, color }) => (
              <span
                key={label}
                className="px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${color}18`, color }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Take snapshot */}
          <button
            onClick={() => {
              const snap: GraphSnapshot = {
                id: crypto.randomUUID(),
                takenAt: new Date().toISOString(),
                reason: 'Manual snapshot',
                payload: { nodes: [], edges: [] },
              }
              useLivingGraphStore.getState().addSnapshot('current', snap)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#64748B] border border-white/[0.08] hover:bg-white/[0.04] hover:text-[#94A3B8] transition-colors"
          >
            <Camera size={12} />
            Snapshot
          </button>

          {/* Role rail toggle */}
          <button
            onClick={() => setRoleRailOpen((o) => !o)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              roleRailOpen
                ? 'bg-[#3B82F6] text-white border-transparent'
                : 'text-[#64748B] border-white/[0.08] hover:bg-white/[0.04]'
            }`}
          >
            <Filter size={12} />
            Role view
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Role Rail */}
        <AnimatePresence>
          {roleRailOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="shrink-0 border-r border-white/[0.06] bg-[#0B0F1A] overflow-hidden flex flex-col"
            >
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide">View as Role</p>
              </div>
              <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-1">
                {(Object.entries(ROLE_META) as [OrgRole, typeof ROLE_META[OrgRole]][]).map(([role, meta]) => {
                  const isActive = effectiveRole === role
                  return (
                    <button
                      key={role}
                      onClick={() => setActiveRole(role === userRole ? null : role)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left w-full transition-all ${
                        isActive
                          ? 'bg-white/[0.06] border border-white/[0.10]'
                          : 'hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <span className="text-base leading-none">{meta.icon}</span>
                      <div className="min-w-0">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: isActive ? meta.color : '#94A3B8' }}
                        >
                          {meta.label.split('—')[0].trim()}
                        </p>
                        <p className="text-[10px] text-[#475569] truncate">
                          {meta.label.split('—')[1]?.trim() ?? ''}
                        </p>
                      </div>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="px-4 py-3 border-t border-white/[0.06]">
                {activeRole && (
                  <button
                    onClick={() => setActiveRole(null)}
                    className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors"
                  >
                    <RefreshCw size={11} />
                    Reset to my role
                  </button>
                )}
                {!activeRole && (
                  <p className="text-[10px] text-[#475569]">Showing your role: {userRole}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            className="bg-transparent"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(255,255,255,0.03)" gap={24} size={1} />
            <Controls
              className="!bg-[#0B0F1A] !border-white/[0.08] !rounded-xl overflow-hidden"
              showInteractive={false}
            />
            <MiniMap
              className="!bg-[#0B0F1A] !border-white/[0.08] !rounded-xl"
              nodeColor={(n) => {
                const living = MOCK_LIVING_NODES.find((l) => l.id === n.id)
                return living ? NODE_STUDIO_COLORS[living.studio] ?? '#334155' : '#334155'
              }}
              maskColor="rgba(8,12,20,0.6)"
            />
          </ReactFlow>

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 pointer-events-none">
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: cfg.color }}
                />
                <span className="text-[10px] text-[#64748B]">{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Current snapshot banner */}
          {currentSnapshotId && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30">
              <Clock size={12} className="text-[#F59E0B]" />
              <span className="text-xs text-[#F59E0B] font-medium">
                Viewing snapshot — {productSnapshots.find((s) => s.id === currentSnapshotId)?.takenAt
                  ? new Date(productSnapshots.find((s) => s.id === currentSnapshotId)!.takenAt).toLocaleString()
                  : ''}
              </span>
              <button
                onClick={() => setCurrentSnapshot(null)}
                className="text-[#F59E0B] hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Node detail drawer */}
        <AnimatePresence>
          {selectedNode && (
            <NodeDetail
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              orgSlug={params.orgSlug}
              productSlug={params.productSlug}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Snapshot scrubber */}
      <SnapshotScrubber
        snapshots={productSnapshots}
        currentId={currentSnapshotId}
        onSelect={setCurrentSnapshot}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
      />
    </div>
  )
}
