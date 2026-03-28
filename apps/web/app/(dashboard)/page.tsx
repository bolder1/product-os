'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Lightbulb,
  Hammer,
  Rocket,
  Activity,
  Search,
  Bell,
  Settings,
  ArrowRight,
  LayoutGrid,
  GitBranch,
  Sparkles,
  Clock,
  FileText,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'

/* ── Mock data ── */
const recentProducts: Array<{
  id: string
  name: string
  slug: string
  orgSlug: string
  status: 'active' | 'draft'
  nodeCount: number
  taskCount: number
  lastEdited: string
  icon: string
  color: string
}> = []

const quickLinks = [
  {
    key: 'plan',
    label: 'Plan',
    description: 'Define product vision, goals, and user journeys',
    icon: Lightbulb,
    color: '#8B5CF6',
    studios: ['Product Planner', 'Template Gallery', 'Canvas'],
    href: 'planner',
  },
  {
    key: 'build',
    label: 'Build',
    description: 'Design systems, components, workflows, and pages',
    icon: Hammer,
    color: '#3B82F6',
    studios: ['Brand', 'Components', 'Design', 'Workflow', 'Pages', 'Graphics'],
    href: 'brand',
  },
  {
    key: 'ship',
    label: 'Ship',
    description: 'Generate code, handoff specs, and manage releases',
    icon: Rocket,
    color: '#10B981',
    studios: ['Code', 'Handoff', 'Releases', 'Testing'],
    href: 'code',
  },
  {
    key: 'operate',
    label: 'Operate',
    description: 'Track tasks, approvals, analytics, and notifications',
    icon: Activity,
    color: '#F59E0B',
    studios: ['Tasks', 'Approvals', 'Notifications', 'Analytics'],
    href: 'tasks',
  },
]

const overviewStats = [
  { label: 'Active Products', value: '0', icon: Layers, color: '#3B82F6' },
  { label: 'Open Tasks', value: '0', icon: CheckCircle2, color: '#10B981' },
  { label: 'Pending Approvals', value: '0', icon: AlertTriangle, color: '#F59E0B' },
  { label: 'AI Actions Today', value: '0', icon: Sparkles, color: '#8B5CF6' },
]

const recentActivity: Array<{
  id: string
  text: string
  time: string
  icon: typeof FileText
  color: string
}> = []

/* ── Animations ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
}

/* ── Empty State SVG ── */
function EmptyStateIllustration() {
  return (
    <motion.svg
      width="320"
      height="240"
      viewBox="0 0 320 240"
      fill="none"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Background grid */}
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(59,130,246,0.06)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="320" height="240" fill="url(#grid)" />

      {/* Central node cluster */}
      <motion.circle
        cx="160" cy="100" r="24"
        fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      />
      <motion.circle
        cx="160" cy="100" r="8"
        fill="#3B82F6"
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
      />

      {/* Orbiting nodes */}
      {[
        { cx: 80, cy: 70, color: '#8B5CF6', delay: 0.6 },
        { cx: 240, cy: 70, color: '#06B6D4', delay: 0.7 },
        { cx: 100, cy: 160, color: '#10B981', delay: 0.8 },
        { cx: 220, cy: 160, color: '#F59E0B', delay: 0.9 },
        { cx: 160, cy: 200, color: '#EC4899', delay: 1.0 },
      ].map((node, i) => (
        <g key={i}>
          <motion.line
            x1="160" y1="100" x2={node.cx} y2={node.cy}
            stroke={`${node.color}30`} strokeWidth="1" strokeDasharray="4 4"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ delay: node.delay, duration: 0.6 }}
          />
          <motion.circle
            cx={node.cx} cy={node.cy} r="6"
            fill={`${node.color}20`} stroke={`${node.color}60`} strokeWidth="1"
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: node.delay + 0.2, type: 'spring', stiffness: 200 }}
          />
          <motion.circle
            cx={node.cx} cy={node.cy} r="3"
            fill={node.color}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: node.delay + 0.3, type: 'spring', stiffness: 300 }}
          />
        </g>
      ))}

      {/* Pulse on center */}
      <motion.circle
        cx="160" cy="100" r="24"
        fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="1"
        initial={{ scale: 1, opacity: 0.5 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}

export default function DashboardHome() {
  const [searchQuery, setSearchQuery] = useState('')
  const hasProducts = recentProducts.length > 0

  return (
    <div className="min-h-screen bg-[#060918]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#060918]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(59,130,246,0.12)' }}>
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="8" r="3" fill="#3B82F6" />
                <circle cx="8" cy="22" r="3" fill="#8B5CF6" />
                <circle cx="24" cy="22" r="3" fill="#06B6D4" />
                <line x1="16" y1="11" x2="8" y2="19" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />
                <line x1="16" y1="11" x2="24" y2="19" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
                <line x1="11" y1="22" x2="21" y2="22" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#F1F5F9]">Product OS</span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search products, studios, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#3B82F6]/40 focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/20 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04] transition">
              <Bell className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04] transition">
              <Settings className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-xs font-medium text-white ml-1">
              S
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <motion.main
        className="max-w-7xl mx-auto px-6 py-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Welcome + Create */}
        <motion.div className="flex items-start justify-between mb-10" variants={fadeUp} custom={0}>
          <div>
            <h1 className="text-2xl font-semibold text-[#F1F5F9]">Welcome back</h1>
            <p className="text-[#94A3B8] mt-1">Your unified product workspace</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </motion.div>

        {/* Overview Stats */}
        <motion.section className="mb-10" variants={fadeUp} custom={1}>
          <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-4">Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {overviewStats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all group"
                  variants={fadeUp}
                  custom={i + 2}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}10` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-[#F1F5F9]">{stat.value}</div>
                      <div className="text-xs text-[#64748B]">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Products / Empty State */}
        <motion.section className="mb-10" variants={fadeUp} custom={3}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Your Products</h2>
            {hasProducts && (
              <button className="text-xs text-[#3B82F6] hover:text-[#3B82F6]/80 flex items-center gap-1 transition">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {hasProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProducts.map((product) => (
                <a
                  key={product.id}
                  href={`/${product.orgSlug}/${product.slug}/control-tower`}
                  className="group p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${product.color}15` }}
                    >
                      {product.icon}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      product.status === 'active'
                        ? 'bg-[#10B981]/10 text-[#10B981]'
                        : 'bg-white/[0.06] text-[#64748B]'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <h3 className="font-medium text-[#F1F5F9] group-hover:text-white transition">{product.name}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{product.nodeCount} nodes</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />{product.taskCount} tasks</span>
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-xs text-[#4A5568]">
                    <Clock className="w-3 h-3" />
                    {product.lastEdited}
                  </div>
                </a>
              ))}

              {/* New product card */}
              <button className="p-5 rounded-xl border border-dashed border-white/[0.08] bg-transparent hover:bg-white/[0.02] hover:border-white/[0.15] transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#64748B]" />
                </div>
                <span className="text-sm text-[#64748B]">Create new product</span>
              </button>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-white/[0.06] bg-white/[0.01]">
              <EmptyStateIllustration />
              <motion.div
                className="flex flex-col items-center gap-3 mt-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <h3 className="text-lg font-medium text-[#F1F5F9]">No products yet</h3>
                <p className="text-sm text-[#64748B] text-center max-w-sm">
                  Create your first product to start building with the unified product graph.
                </p>
                <button className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Plus className="w-4 h-4" />
                  Create Product
                </button>
              </motion.div>
            </div>
          )}
        </motion.section>

        {/* Quick Links — Plan / Build / Ship / Operate */}
        <motion.section className="mb-10" variants={fadeUp} custom={4}>
          <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, i) => {
              const Icon = link.icon
              return (
                <motion.div
                  key={link.key}
                  className="group relative p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer overflow-hidden"
                  variants={fadeUp}
                  custom={i + 5}
                  whileHover={{ y: -2 }}
                >
                  {/* Subtle glow */}
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                    style={{ background: `radial-gradient(circle, ${link.color}15, transparent 70%)` }}
                  />

                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${link.color}12` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: link.color }} />
                    </div>
                    <h3 className="font-medium text-[#F1F5F9] mb-1">{link.label}</h3>
                    <p className="text-xs text-[#64748B] leading-relaxed mb-3">{link.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {link.studios.slice(0, 3).map((studio) => (
                        <span key={studio} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#94A3B8]">
                          {studio}
                        </span>
                      ))}
                      {link.studios.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#64748B]">
                          +{link.studios.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Recent Activity + Tips */}
        <motion.section variants={fadeUp} custom={6}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Recent Activity</h2>
                <Clock className="w-3.5 h-3.5 text-[#4A5568]" />
              </div>
              {recentActivity.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {recentActivity.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}10` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#94A3B8] truncate">{item.text}</p>
                          <p className="text-xs text-[#4A5568] mt-0.5">{item.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="w-8 h-8 text-[#1E293B] mb-2" />
                  <p className="text-sm text-[#4A5568]">No activity yet</p>
                  <p className="text-xs text-[#334155] mt-1">Your recent actions will appear here</p>
                </div>
              )}
            </div>

            {/* Getting Started / Tips */}
            <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider">Getting Started</h2>
                <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { step: '1', text: 'Create a new product or start from a template', done: false, color: '#3B82F6' },
                  { step: '2', text: 'Use the Planner to define goals and features', done: false, color: '#8B5CF6' },
                  { step: '3', text: 'Build your brand, components, and pages', done: false, color: '#06B6D4' },
                  { step: '4', text: 'Ship with generated code and dev handoff specs', done: false, color: '#10B981' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3 group">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 border"
                      style={{
                        borderColor: item.done ? '#10B981' : `${item.color}30`,
                        backgroundColor: item.done ? '#10B98115' : `${item.color}08`,
                        color: item.done ? '#10B981' : item.color,
                      }}
                    >
                      {item.done ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                    </div>
                    <p className={`text-sm ${item.done ? 'text-[#4A5568] line-through' : 'text-[#94A3B8]'}`}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                <p className="text-xs text-[#64748B]">
                  AI assists you at every step — from planning to shipping
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.main>
    </div>
  )
}
