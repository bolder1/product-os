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
  FileText,
  Layers,
  Sparkles,
  GitBranch,
  ArrowRight,
  Component,
  BarChart3,
  Workflow,
} from 'lucide-react'
import { useProductStore } from '../../../lib/product-store'

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

/* ── Studio shortcuts ── */
const studios = [
  { key: 'planner', label: 'Planner', icon: Lightbulb, color: '#8B5CF6', desc: 'Define vision, goals, and features' },
  { key: 'brand', label: 'Brand', icon: Palette, color: '#EC4899', desc: 'Design tokens, colors, typography' },
  { key: 'components', label: 'Components', icon: Component, color: '#06B6D4', desc: 'Reusable UI components' },
  { key: 'workflows', label: 'Workflows', icon: Workflow, color: '#F59E0B', desc: 'Business logic and automations' },
  { key: 'code', label: 'Code', icon: Code2, color: '#10B981', desc: 'Generated code and exports' },
  { key: 'releases', label: 'Releases', icon: Rocket, color: '#3B82F6', desc: 'Version management and deploys' },
  { key: 'tasks', label: 'Tasks', icon: CheckCircle2, color: '#F43F5E', desc: 'Track work and assignments' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, color: '#8B5CF6', desc: 'Metrics and insights' },
]

/* ── Quick stats ── */
const quickStats = [
  { label: 'Graph Nodes', value: '0', icon: GitBranch, color: '#3B82F6' },
  { label: 'Open Tasks', value: '0', icon: CheckCircle2, color: '#10B981' },
  { label: 'Components', value: '0', icon: Component, color: '#06B6D4' },
  { label: 'AI Actions', value: '0', icon: Sparkles, color: '#8B5CF6' },
]

export default function ProductOverview({
  params,
}: {
  params: Promise<{ orgSlug: string; productSlug: string }>
}) {
  const { orgSlug, productSlug } = use(params)
  const allProducts = useProductStore((s) => s.products)
  const product = useMemo(() => allProducts.find((p) => p.orgSlug === orgSlug && p.slug === productSlug) ?? null, [allProducts, orgSlug, productSlug])

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Layers className="w-12 h-12 text-[#1E293B] mb-4" />
        <h2 className="text-lg font-medium text-[#F1F5F9] mb-2">Product not found</h2>
        <p className="text-sm text-[#64748B] mb-4">
          The product &quot;{productSlug}&quot; does not exist in this organization.
        </p>
        <a
          href="/"
          className="text-sm text-[#3B82F6] hover:text-[#3B82F6]/80 transition"
        >
          Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="p-6 pb-12">
      {/* Product Header */}
      <motion.div className="mb-8" variants={fadeUp} custom={0}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${product.color}15` }}
          >
            {product.icon}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#F1F5F9]">{product.name}</h1>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  product.status === 'active'
                    ? 'bg-[#10B981]/10 text-[#10B981]'
                    : product.status === 'archived'
                      ? 'bg-white/[0.06] text-[#64748B]'
                      : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                }`}
              >
                {product.status}
              </span>
            </div>
            {product.description && (
              <p className="text-sm text-[#94A3B8] mt-1">{product.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-[#4A5568]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created {new Date(product.createdAt).toLocaleDateString()}
              </span>
              <span>/{product.orgSlug}/{product.slug}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div className="mb-8" variants={fadeUp} custom={1}>
        <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickStats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
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
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Studios Grid */}
      <motion.div className="mb-8" variants={fadeUp} custom={2}>
        <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-4">
          Studios
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {studios.map((studio, i) => {
            const Icon = studio.icon
            return (
              <motion.a
                key={studio.key}
                href={`/${orgSlug}/${productSlug}/${studio.key}`}
                className="group relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all overflow-hidden"
                variants={fadeUp}
                custom={i + 3}
                whileHover={{ y: -2 }}
              >
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl" style={{ background: `radial-gradient(circle, ${studio.color}15, transparent 70%)` }} />
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${studio.color}12` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: studio.color }} />
                  </div>
                  <h3 className="font-medium text-[#F1F5F9] text-sm mb-0.5">{studio.label}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{studio.desc}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-[#4A5568] mt-2 group-hover:text-[#94A3B8] group-hover:translate-x-1 transition-all" />
                </div>
              </motion.a>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Activity + Getting Started */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-4" variants={fadeUp} custom={4}>
        {/* Recent Activity */}
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
              Recent Activity
            </h2>
            <Activity className="w-3.5 h-3.5 text-[#4A5568]" />
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-8 h-8 text-[#1E293B] mb-2" />
            <p className="text-sm text-[#4A5568]">No activity yet</p>
            <p className="text-xs text-[#334155] mt-1">
              Start building to see activity here
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
              Next Steps
            </h2>
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
          </div>
          <div className="flex flex-col gap-3">
            {[
              {
                step: '1',
                text: 'Open the Planner to define product goals',
                href: `/${orgSlug}/${productSlug}/planner`,
                color: '#8B5CF6',
              },
              {
                step: '2',
                text: 'Set up your Brand with colors and typography',
                href: `/${orgSlug}/${productSlug}/brand`,
                color: '#EC4899',
              },
              {
                step: '3',
                text: 'Design components in the Component Studio',
                href: `/${orgSlug}/${productSlug}/components`,
                color: '#06B6D4',
              },
              {
                step: '4',
                text: 'Generate code and create a release',
                href: `/${orgSlug}/${productSlug}/code`,
                color: '#10B981',
              },
            ].map((item) => (
              <a
                key={item.step}
                href={item.href}
                className="flex items-center gap-3 group hover:bg-white/[0.02] rounded-lg p-1 -m-1 transition"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 border"
                  style={{
                    borderColor: `${item.color}30`,
                    backgroundColor: `${item.color}08`,
                    color: item.color,
                  }}
                >
                  {item.step}
                </div>
                <p className="text-sm text-[#94A3B8] group-hover:text-[#F1F5F9] transition flex-1">
                  {item.text}
                </p>
                <ArrowRight className="w-3.5 h-3.5 text-[#4A5568] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </a>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#6366F1]" />
            <p className="text-xs text-[#64748B]">
              AI assists you at every step throughout your product journey
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
