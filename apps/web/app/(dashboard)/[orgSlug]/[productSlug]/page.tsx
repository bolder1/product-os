'use client'

import { use, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  Palette,
  Code2,
  Rocket,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  GitBranch,
  ArrowRight,
  Component,
  BarChart3,
  Workflow,
  Share2,
  LayoutTemplate,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { useProductStore } from '../../../lib/product-store'
import { trpc } from '../../../lib/trpc'

/* ── Animations ── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const stagger = { visible: { transition: { staggerChildren: 0.06 } } }

/* R20.6 — Kinds differentiated by label + icon, not color. Uniform --accent. */
const KIND_LABEL: Record<string, string> = {
  module: 'Module', feature: 'Feature', page: 'Page', entity: 'Entity',
  component: 'Component', workflow: 'Workflow', token: 'Token', journey: 'Journey',
  task: 'Task', release: 'Release', insight: 'Insight', screen: 'Screen',
}

/* ── Studios ── */
const studios = [
  { key: 'graph-explorer', label: 'Graph Explorer', icon: Share2, desc: 'Visualize and edit your product graph' },
  { key: 'templates', label: 'Templates', icon: LayoutTemplate, desc: 'Apply starter templates to your graph' },
  { key: 'planner', label: 'Planner', icon: Lightbulb, desc: 'Define vision, goals, and features' },
  { key: 'brand', label: 'Brand', icon: Palette, desc: 'Design tokens, colors, typography' },
  { key: 'components', label: 'Components', icon: Component, desc: 'Reusable UI components' },
  { key: 'workflows', label: 'Workflows', icon: Workflow, desc: 'Business logic and automations' },
  { key: 'code', label: 'Code', icon: Code2, desc: 'Generated code and exports' },
  { key: 'releases', label: 'Releases', icon: Rocket, desc: 'Version management and deploys' },
  { key: 'tasks', label: 'Tasks', icon: CheckCircle2, desc: 'Track work and assignments' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, desc: 'Metrics and insights' },
]

/* ── Mini graph thumbnail ── */
function MiniGraphThumbnail({
  kindCounts,
}: {
  kindCounts: { kind: string; count: number }[]
}) {
  const total = kindCounts.reduce((s, k) => s + k.count, 0)
  if (total === 0) return null

  const cx = 72
  const cy = 72
  const r = 52

  return (
    <svg width={144} height={144} className="shrink-0 text-[var(--accent)]">
      {kindCounts.map(({ kind, count }, i) => {
        const angle = (2 * Math.PI * i) / kindCounts.length - Math.PI / 2
        const x = cx + r * Math.cos(angle)
        const y = cy + r * Math.sin(angle)
        const nodeR = Math.max(4, Math.min(10, 3 + count))
        return (
          <g key={kind}>
            {/* Spoke — low-alpha accent */}
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.2} strokeWidth={1} />
            {/* Node dot */}
            <circle cx={x} cy={y} r={nodeR} fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.5} />
            {/* Count badge */}
            {count > 1 && (
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fill="currentColor"
                fontSize="6"
                fontWeight="700"
                fontFamily="system-ui"
              >
                {count}
              </text>
            )}
          </g>
        )
      })}
      {/* Center hub */}
      <circle cx={cx} cy={cy} r={8} fill="currentColor" fillOpacity={0.15} stroke="currentColor" strokeWidth={1.5} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="currentColor" fontSize="7" fontWeight="700" fontFamily="system-ui">
        {total}
      </text>
    </svg>
  )
}

/* ── Main page ── */
export default function ProductOverview({
  params,
}: {
  params: Promise<{ orgSlug: string; productSlug: string }>
}) {
  const { orgSlug, productSlug } = use(params)
  const allProducts = useProductStore((s) => s.products)
  const product = useMemo(
    () => allProducts.find((p) => p.slug === productSlug && (p.orgSlug === orgSlug || p.orgSlug === '')) ?? null,
    [allProducts, orgSlug, productSlug]
  )

  const productId = product?.id ?? ''
  const enabled = !!product?.id

  // Live data queries
  const nodesQuery = trpc.graph.getNodes.useQuery(
    { productId },
    { enabled, staleTime: 30_000 }
  )
  const edgesQuery = trpc.graph.getEdges.useQuery(
    { productId },
    { enabled, staleTime: 30_000 }
  )

  const nodes = (nodesQuery.data ?? []) as Array<{
    id: string
    kind: string
    label: string
    createdAt: string | Date
  }>
  const edges = (edgesQuery.data ?? []) ?? []

  // Derived stats
  const kindCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const n of nodes) {
      map[n.kind] = (map[n.kind] ?? 0) + 1
    }
    return Object.entries(map)
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count)
  }, [nodes])

  const topKinds = kindCounts.slice(0, 5)
  const totalNodes = nodes.length
  const totalEdges = edges.length
  const totalKinds = kindCounts.length

  // Recent 5 nodes (newest first)
  const recentNodes = useMemo(() => {
    return [...nodes]
      .sort((a, b) => {
        const ta = new Date(a.createdAt).getTime()
        const tb = new Date(b.createdAt).getTime()
        return tb - ta
      })
      .slice(0, 6)
  }, [nodes])

  const isEmpty = totalNodes === 0
  const isLoading = nodesQuery.isLoading || edgesQuery.isLoading

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Layers className="w-12 h-12 text-[var(--bg-surface)] mb-4" />
        <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">Product not found</h2>
        <p className="text-sm text-[var(--text-tertiary)] mb-4">
          The product &quot;{productSlug}&quot; does not exist in this organization.
        </p>
        <a href="/" className="text-sm text-[var(--accent)] hover:text-[var(--accent)]/80 transition">
          Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="p-6 pb-16 max-w-[1200px]">

      {/* ── Product Header ── */}
      <motion.div className="mb-8" variants={fadeUp} custom={0}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-[var(--accent-subtle)]">
            {product.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{product.name}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  product.status === 'active'
                    ? 'bg-[var(--color-success-muted)] text-[var(--color-success)]'
                    : product.status === 'archived'
                      ? 'bg-white/[0.06] text-[var(--text-tertiary)]'
                      : 'bg-[var(--color-warning-muted)] text-[var(--color-warning)]'
                }`}
              >
                {product.status}
              </span>
            </div>
            {product.description && (
              <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">{product.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created {new Date(product.createdAt).toLocaleDateString()}
              </span>
              <span className="text-[var(--bg-surface)]">·</span>
              <span>/{product.orgSlug}/{product.slug}</span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/${orgSlug}/${productSlug}/templates`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent-subtle)] text-[var(--accent-text)] hover:bg-[var(--accent)]/20 transition-colors border border-[var(--accent)]/20"
            >
              <LayoutTemplate size={12} />
              Templates
            </a>
            <a
              href={`/${orgSlug}/${productSlug}/graph-explorer`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] text-[var(--text-secondary)] hover:bg-white/[0.08] transition-colors border border-white/[0.08]"
            >
              <Share2 size={12} />
              Graph
            </a>
          </div>
        </div>
      </motion.div>

      {/* ── Graph Health + Mini Viz ── */}
      <motion.div className="mb-8" variants={fadeUp} custom={1}>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <GitBranch size={13} className="text-[var(--accent)]" />
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Product Graph</span>
              {isLoading && <RefreshCw size={10} className="text-[var(--text-tertiary)] animate-spin" />}
            </div>
            <a
              href={`/${orgSlug}/${productSlug}/graph-explorer`}
              className="text-[10px] text-[var(--accent)] hover:text-[var(--accent)] flex items-center gap-0.5 transition-colors"
            >
              Open full graph <ArrowRight size={10} />
            </a>
          </div>

          {isEmpty ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-subtle)] flex items-center justify-center mb-3">
                <Share2 size={22} className="text-[var(--accent)]/60" />
              </div>
              <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-1">No graph nodes yet</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mb-4 max-w-[300px]">
                Describe your product and AI will generate the graph, or apply a starter template.
              </p>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <a
                  href={`/${orgSlug}/${productSlug}/graph-explorer`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] transition-colors"
                >
                  <Sparkles size={12} />
                  AI: Generate Graph
                </a>
                <a
                  href={`/${orgSlug}/${productSlug}/templates`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.09] transition-colors border border-white/[0.08]"
                >
                  <LayoutTemplate size={12} />
                  Browse Templates
                </a>
                <a
                  href={`/${orgSlug}/${productSlug}/graph-explorer`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.09] transition-colors border border-white/[0.08]"
                >
                  <Plus size={12} />
                  Add a Node
                </a>
              </div>
            </div>
          ) : (
            /* Populated state */
            <div className="flex items-start gap-0 divide-x divide-white/[0.05]">
              {/* Stats column */}
              <div className="flex-1 p-5 flex flex-col gap-4">
                {/* Summary row */}
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{totalNodes}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">nodes</div>
                  </div>
                  <div className="w-px h-8 bg-white/[0.06]" />
                  <div>
                    <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{totalEdges}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">edges</div>
                  </div>
                  <div className="w-px h-8 bg-white/[0.06]" />
                  <div>
                    <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{totalKinds}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">types</div>
                  </div>
                </div>

                {/* Kind breakdown bars — uniform accent, distinction by label */}
                <div className="flex flex-col gap-2">
                  {topKinds.map(({ kind, count }) => {
                    const pct = Math.round((count / totalNodes) * 100)
                    return (
                      <div key={kind} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--accent)]" />
                        <span className="text-[10px] text-[var(--text-secondary)] w-20 shrink-0">
                          {KIND_LABEL[kind] ?? kind}
                        </span>
                        <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-[var(--accent)]/60"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-tertiary)] w-6 text-right shrink-0">{count}</span>
                      </div>
                    )
                  })}
                  {kindCounts.length > 5 && (
                    <p className="text-[9px] text-[var(--text-tertiary)]/60 pl-3.5">
                      +{kindCounts.length - 5} more types
                    </p>
                  )}
                </div>
              </div>

              {/* Mini graph viz */}
              <div className="p-5 flex items-center justify-center">
                <MiniGraphThumbnail kindCounts={kindCounts.slice(0, 10)} />
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Bottom two-column grid ── */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8" variants={fadeUp} custom={2}>

        {/* Recent nodes (2/3 width) */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-[var(--color-success)]" />
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Recent Nodes</span>
            </div>
            {!isEmpty && (
              <a
                href={`/${orgSlug}/${productSlug}/graph-explorer`}
                className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex items-center gap-0.5 transition-colors"
              >
                View all <ArrowRight size={10} />
              </a>
            )}
          </div>

          {recentNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock className="w-7 h-7 text-[var(--bg-surface)] mb-2" />
              <p className="text-[12px] text-[var(--text-tertiary)]">No nodes yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recentNodes.map((node) => {
                const label = KIND_LABEL[node.kind] ?? node.kind
                const ts = new Date(node.createdAt)
                const ago = formatAgo(ts)
                return (
                  <div key={node.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                      {node.label.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] text-[var(--text-primary)] font-medium truncate block">{node.label}</span>
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                      {label}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">{ago}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Next steps (1/3 width) */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.05]">
            <Sparkles size={13} className="text-[var(--accent)]" />
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Next Steps</span>
          </div>
          <div className="flex flex-col gap-1 p-3">
            {getNextSteps(isEmpty, orgSlug, productSlug).map((item) => (
              <a
                key={item.step}
                href={item.href}
                className="flex items-center gap-2.5 group rounded-lg px-2 py-2 hover:bg-white/[0.03] transition-all"
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                  {item.step}
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors flex-1 leading-snug">
                  {item.text}
                </p>
                <ArrowRight size={10} className="text-[var(--border-default)] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
              </a>
            ))}
          </div>
          <div className="mx-3 mb-3 mt-1 p-3 rounded-lg bg-[var(--accent)]/[0.06] border border-[var(--accent)]/20">
            <div className="flex items-start gap-2">
              <Sparkles size={11} className="text-[var(--accent)] mt-0.5 shrink-0" />
              <p className="text-[10px] text-[var(--accent)]/80 leading-relaxed">
                AI assists you at every step — click the AI button in any studio to get suggestions.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Studios grid ── */}
      <motion.div variants={fadeUp} custom={3}>
        <h2 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Studios</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {studios.map((studio, i) => {
            const Icon = studio.icon
            return (
              <motion.a
                key={studio.key}
                href={`/${orgSlug}/${productSlug}/${studio.key}`}
                className="group relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all overflow-hidden"
                variants={fadeUp}
                custom={i + 4}
                whileHover={{ y: -2 }}
              >
                <div className="absolute top-0 right-0 w-14 h-14 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl bg-[radial-gradient(circle,var(--accent)_0%,transparent_70%)] opacity-20" />
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 bg-[var(--accent-subtle)]">
                    <Icon className="w-4 h-4 text-[var(--accent)]" />
                  </div>
                  <h3 className="font-medium text-[var(--text-primary)] text-[12px] mb-0.5 leading-tight">{studio.label}</h3>
                  <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">{studio.desc}</p>
                  <ArrowRight className="w-3 h-3 text-[var(--text-tertiary)] mt-1.5 group-hover:text-[var(--text-secondary)] group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.a>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Helpers ── */
function formatAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function getNextSteps(isEmpty: boolean, orgSlug: string, productSlug: string) {
  const base = `/${orgSlug}/${productSlug}`
  if (isEmpty) {
    return [
      { step: '1', text: 'Apply a starter template', href: `${base}/templates` },
      { step: '2', text: 'Add your first node in Graph Explorer', href: `${base}/graph-explorer` },
      { step: '3', text: 'Define your product vision in Planner', href: `${base}/planner` },
      { step: '4', text: 'Set up brand colors and tokens', href: `${base}/brand` },
    ]
  }
  return [
    { step: '1', text: 'Explore and refine your graph', href: `${base}/graph-explorer` },
    { step: '2', text: 'Map out user journeys in Planner', href: `${base}/planner` },
    { step: '3', text: 'Design components for your UI', href: `${base}/components` },
    { step: '4', text: 'Generate code and cut a release', href: `${base}/code` },
  ]
}
