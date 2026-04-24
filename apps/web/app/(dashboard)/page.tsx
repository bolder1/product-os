'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Bell,
  Clock,
  Shield,
  Store,
  ArrowRight,
  Sparkles,
  Coins,
  LayoutGrid,
} from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { roleConfigs, type OrgRole } from '../lib/role-config'
import { useProductStore } from '../lib/product-store'
import { useNotificationStore } from '../lib/notification-store'
import { useCommandPaletteStore } from '../lib/command-palette-store'
import { useBudgetStore } from '../lib/budget-store'
import { useCopilotStore } from '../lib/copilot-store'
import { trpc } from '../lib/trpc'
import { Shield as ShieldIcon, Briefcase, BarChart3, Bug, Palette, Code2, Server, Eye } from 'lucide-react'
import CreateProductModal from './_components/create-product-modal'
import QuickStartTemplates from './_components/quick-start-templates'
import TodaysAITasks from './_components/todays-ai-tasks'
import MarketplaceBanner from './_components/marketplace-banner'
import { TemplateMarketplace } from '../components/shared/template-marketplace'
import { UserMenu } from '../components/shell/user-menu'
import { ThemeSwitcher } from '../components/shell/theme-switcher'

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

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
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const openCommandPalette = useCommandPaletteStore((s) => s.open)
  const toggleCopilot = useCopilotStore((s) => s.togglePanel)
  const copilotOpen = useCopilotStore((s) => s.open)
  const notifications = useNotificationStore((s) => s.notifications)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const unreadNotifs = useMemo(() => notifications.filter((n) => !n.read), [notifications])
  const capToday = useBudgetStore((s) => s.capToday)
  const budgetRuns = useBudgetStore((s) => s.runs)
  const usedToday = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    return budgetRuns.filter((r) => new Date(r.at).getTime() >= cutoff).reduce((a, r) => a + r.cost, 0)
  }, [budgetRuns])
  const budgetPct = Math.min(100, Math.round((usedToday / Math.max(capToday, 0.0001)) * 100))
  const { user } = useAuth()
  const orgSlug =
    user?.orgSlug ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
    'my-org'
  const allProducts = useProductStore((s) => s.products)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    if (showNotifs) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNotifs])

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
            <button
              onClick={openCommandPalette}
              className="w-full flex items-center gap-2 px-3 h-9 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--text-tertiary)] hover:border-white/[0.14] hover:text-[var(--text-secondary)] transition text-left"
              aria-label="Search — Command K"
            >
              <Search className="w-4 h-4 shrink-0 opacity-60" />
              <span className="flex-1">Search products, studios, templates...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 h-5 rounded bg-white/[0.06] text-[10px] font-mono text-[var(--text-tertiary)]">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* All Products shortcut */}
            <a
              href="/products"
              className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition text-xs font-medium"
              title="View all products"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Products
            </a>

            {/* Budget pill */}
            <button
              type="button"
              className="hidden md:flex items-center gap-1.5 h-8 px-2 rounded-md text-[11px] tabular-nums border border-white/[0.06] hover:border-white/[0.12] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title={`AI spend today: $${usedToday.toFixed(2)} of $${capToday.toFixed(2)} (${budgetPct}%)`}
              aria-label="AI budget"
            >
              <Coins className={`w-3.5 h-3.5 ${budgetPct >= 80 ? 'text-[var(--color-error)]' : 'opacity-60'}`} />
              <span>
                ${usedToday < 1 ? usedToday.toFixed(3) : usedToday.toFixed(2)}
                <span className="text-[var(--text-tertiary)]"> / ${capToday.toFixed(0)}</span>
              </span>
            </button>

            {/* Copilot toggle */}
            <button
              onClick={toggleCopilot}
              className="p-2 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition"
              title="Copilot"
              aria-label="Toggle copilot"
              aria-pressed={copilotOpen}
              style={{ color: copilotOpen ? 'var(--accent)' : undefined }}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Theme */}
            <ThemeSwitcher />

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs((v) => !v)}
                className="relative p-2 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition"
                title="Notifications"
                aria-label={unreadNotifs.length > 0 ? `Notifications — ${unreadNotifs.length} unread` : 'Notifications'}
                aria-haspopup="true"
                aria-expanded={showNotifs}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-base)]" />
                )}
              </button>

              {showNotifs && (
                <div
                  className="absolute right-0 top-full mt-2 w-[320px] z-[100] rounded-xl border border-white/10 bg-[var(--bg-elevated)] shadow-[var(--shadow-panel)] overflow-hidden"
                  style={{ animation: 'slideInDown 150ms cubic-bezier(0.16,1,0.3,1)' }}
                >
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">Notifications</span>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="text-[11px] text-[var(--accent)] hover:opacity-80 transition"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex items-center justify-center py-10 text-xs text-[var(--text-tertiary)]">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { if (!n.read) markRead(n.id) }}
                          className={`w-full flex items-start gap-2.5 px-3 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition text-left ${
                            !n.read ? 'bg-[var(--accent)]/[0.04]' : ''
                          }`}
                        >
                          <div className={`mt-1.5 w-[6px] h-[6px] rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-[var(--accent)]'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[var(--text-primary)] line-clamp-1">{n.title}</p>
                            {n.body && (
                              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 line-clamp-2">{n.body}</p>
                            )}
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{timeAgo(n.timestamp)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* User menu */}
            <UserMenu />
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
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[var(--text-tertiary)]">{storeProducts.length} total</span>
                {storeProducts.length > 7 && (
                  <a
                    href="/products"
                    className="flex items-center gap-1 text-[var(--accent)] hover:text-[var(--accent)]/80 font-medium transition"
                  >
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {hasProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="group relative p-5 rounded-xl border border-dashed border-white/[0.1] bg-gradient-to-br from-[var(--accent)]/[0.04] to-transparent hover:from-[var(--accent)]/[0.1] hover:border-[var(--accent)]/30 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px] overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at 50% 20%, rgba(59,130,246,0.14), transparent 60%)' }}
                />
                <div className="relative w-11 h-11 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <span className="relative text-sm font-medium text-[var(--text-primary)]">Create new product</span>
                <span className="relative text-[11px] text-[var(--text-tertiary)]">Start fresh or from template</span>
              </button>

              {storeProducts.slice(0, 7).map((product) => (
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

        {/* Blueprint Marketplace banner (Microsoft-style hero) */}
        <motion.div variants={fadeUp} custom={2}>
          <MarketplaceBanner onOpen={() => setMarketplaceOpen(true)} />
        </motion.div>

        {/* Today's Tasks — AI-curated card grid */}
        <motion.div className="mb-10" variants={fadeUp} custom={3}>
          <TodaysAITasks orgSlug={orgSlug} />
        </motion.div>

        {/* Quick Start (shown when no products) */}
        {!hasProducts && (
          <motion.section className="mb-10" variants={fadeUp} custom={4}>
            <QuickStartTemplates />
          </motion.section>
        )}
      </motion.main>

      <CreateProductModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <TemplateMarketplace open={marketplaceOpen} onClose={() => setMarketplaceOpen(false)} />
    </div>
  )
}
