'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Bell,
  Settings,
  ArrowRight,
  Clock,
  Shield,
  Store,
} from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { roleConfigs, type OrgRole } from '../lib/role-config'
import { useProductStore } from '../lib/product-store'
import { useNotificationStore } from '../lib/notification-store'
import { useCommandPaletteStore } from '../lib/command-palette-store'
import { trpc } from '../lib/trpc'
import { Shield as ShieldIcon, Briefcase, BarChart3, Bug, Palette, Code2, Server, Eye } from 'lucide-react'
import CreateProductModal from './_components/create-product-modal'
import QuickStartTemplates from './_components/quick-start-templates'
import TodaysAITasks from './_components/todays-ai-tasks'
import { TemplateMarketplace } from '../components/shared/template-marketplace'

const roleIconMap: Record<string, React.ElementType> = {
  Shield: ShieldIcon, Briefcase, BarChart3, Bug, Palette, Code2, Server, Eye,
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

export default function DashboardHome() {
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)
  const openCommandPalette = useCommandPaletteStore((s) => s.open)
  const { user } = useAuth()
  const orgSlug =
    user?.orgSlug ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
    'my-org'
  const allProducts = useProductStore((s) => s.products)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const productsQuery = trpc.product.list.useQuery({}, { enabled: !!user })
  useEffect(() => {
    if (!user) return
    const resolvedOrgSlug =
      user.orgSlug ||
      user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
      'my-org'

    useProductStore.setState((state) => ({
      products: state.products.map((p) =>
        p.orgSlug === '' ? { ...p, orgSlug: resolvedOrgSlug } : p,
      ),
    }))

    if (!productsQuery.data) return

    const dbProducts = productsQuery.data.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      slug: p.slug,
      orgSlug: resolvedOrgSlug,
      color: '#3B82F6',
      icon: p.icon ?? '🚀',
      status: p.status as 'draft' | 'active' | 'archived',
      createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
      updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
    }))
    useProductStore.setState({ products: dbProducts })
  }, [productsQuery.data, user])

  const storeProducts = useMemo(
    () => allProducts.filter((p) => p.orgSlug === orgSlug || p.orgSlug === ''),
    [allProducts, orgSlug],
  )
  const hasProducts = storeProducts.length > 0

  const userRole: OrgRole = user?.role ?? 'viewer'
  const rc = roleConfigs[userRole]
  const RoleIcon = roleIconMap[rc.icon] || Eye

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(59,130,246,0.12)' }}
            >
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="8" r="3" fill="var(--accent)" />
                <circle cx="8" cy="22" r="3" fill="var(--accent)" />
                <circle cx="24" cy="22" r="3" fill="var(--accent)" />
                <line x1="16" y1="11" x2="8" y2="19" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />
                <line x1="16" y1="11" x2="24" y2="19" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
                <line x1="11" y1="22" x2="21" y2="22" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">Product OS</span>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search products, studios, templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={(e) => { e.target.blur(); openCommandPalette(); }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20 transition cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--color-error)] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition">
              <Settings className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-[var(--color-white)] ml-1 bg-[var(--accent)]">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <motion.main
        className="max-w-7xl mx-auto px-6 py-8"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Welcome */}
        <motion.div className="flex items-start justify-between mb-10" variants={fadeUp} custom={0}>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {(() => {
                  const h = new Date().getHours()
                  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
                  if (!user) return greeting
                  return (
                    <>
                      {greeting},{' '}
                      <span className="gradient-text">{user.name}</span>
                    </>
                  )
                })()}
              </h1>
              {user && (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                  <RoleIcon className="w-3 h-3" />
                  {rc.label}
                </span>
              )}
            </div>
            <p className="text-[var(--text-secondary)] mt-1">
              {user ? `${user.orgName || 'Your'} unified product workspace` : 'Your unified product workspace'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && (userRole === 'admin' || userRole === 'manager') && (
              <a
                href="/admin"
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm font-medium rounded-lg transition-all hover:bg-[var(--color-error)]/20 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]"
              >
                <Shield className="w-4 h-4" />
                Admin Panel
              </a>
            )}
            <button
              onClick={() => setMarketplaceOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[var(--text-primary)] text-sm font-medium rounded-lg transition-all"
            >
              <Store className="w-4 h-4" />
              Marketplace
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <Plus className="w-4 h-4" />
              New Product
            </button>
          </div>
        </motion.div>

        {/* All Products */}
        <motion.section className="mb-10" variants={fadeUp} custom={1}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">All Products</h2>
            {hasProducts && (
              <span className="text-xs text-[var(--text-tertiary)]">{storeProducts.length} total</span>
            )}
          </div>

          {hasProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeProducts.map((product) => (
                <motion.a
                  key={product.id}
                  href={`/${product.orgSlug || orgSlug}/${product.slug}/planner`}
                  className="group relative p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden block"
                  whileHover={{
                    borderColor: 'rgba(255,255,255,0.12)',
                    backgroundColor: 'rgba(255,255,255,0.035)',
                    boxShadow: `0 8px 32px ${product.color}18`,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 90% 10%, ${product.color}09 0%, transparent 60%)` }}
                  />
                  <div className="relative flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${product.color}15` }}
                    >
                      {product.icon}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      product.status === 'active'
                        ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                        : product.status === 'draft'
                          ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
                          : 'bg-white/[0.06] text-[var(--text-tertiary)]'
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <h3 className="font-medium text-[var(--text-primary)] group-hover:text-white transition">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 line-clamp-2">{product.description}</p>
                  )}
                  <div className="relative flex items-center gap-1 mt-3 text-xs text-[var(--text-tertiary)]">
                    <Clock className="w-3 h-3" />
                    {new Date(product.createdAt).toLocaleDateString()}
                  </div>
                </motion.a>
              ))}

              <button
                onClick={() => setModalOpen(true)}
                className="p-5 rounded-xl border border-dashed border-white/[0.08] bg-transparent hover:bg-white/[0.02] hover:border-white/[0.15] transition-all flex flex-col items-center justify-center gap-2 min-h-[160px]"
              >
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[var(--text-tertiary)]" />
                </div>
                <span className="text-sm text-[var(--text-tertiary)]">Create new product</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
              <p className="text-sm text-[var(--text-secondary)]">No products yet — pick a Quick Start template below to begin.</p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm font-medium rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Or start from scratch
              </button>
            </div>
          )}
        </motion.section>

        {/* Quick Start (shown when no products) */}
        {!hasProducts && (
          <motion.section className="mb-10" variants={fadeUp} custom={2}>
            <QuickStartTemplates />
          </motion.section>
        )}

        {/* Today's AI Tasks + Marketplace CTA */}
        <motion.section variants={fadeUp} custom={3}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TodaysAITasks orgSlug={orgSlug} />
            </div>
            <button
              onClick={() => setMarketplaceOpen(true)}
              className="group relative p-5 rounded-xl border border-white/[0.08] bg-gradient-to-br from-[var(--accent)]/[0.08] to-[var(--accent)]/[0.04] hover:from-[var(--accent)]/[0.12] hover:to-[var(--accent)]/[0.08] transition-all text-left overflow-hidden"
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-[var(--accent)]/10 blur-3xl group-hover:bg-[#8B5CF6]/20 transition" />
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center mb-3">
                  <Store className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">Browse Marketplace</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  100+ responsive templates organized by use case — from landing pages to full SaaS apps.
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                  Open marketplace <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </button>
          </div>
        </motion.section>
      </motion.main>

      <CreateProductModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <TemplateMarketplace open={marketplaceOpen} onClose={() => setMarketplaceOpen(false)} />
    </div>
  )
}
