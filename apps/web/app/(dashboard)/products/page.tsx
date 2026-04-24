'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  ArrowLeft,
  Clock,
  Filter,
  LayoutGrid,
  Rows3,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useProductStore, type Product } from '../../lib/product-store'
import { trpc } from '../../lib/trpc'
import CreateProductModal from '../_components/create-product-modal'

type StatusFilter = 'all' | 'draft' | 'active' | 'archived'
type ViewMode = 'grid' | 'list'

export default function AllProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const { user } = useAuth()
  const orgSlug =
    user?.orgSlug ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
    'my-org'
  const allProducts = useProductStore((s) => s.products)

  const productsQuery = trpc.product.list.useQuery({}, { enabled: !!user })
  useEffect(() => {
    if (!user || !productsQuery.data) return
    const resolvedOrgSlug =
      user.orgSlug ||
      user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
      'my-org'
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return storeProducts.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      )
    })
  }, [storeProducts, searchQuery, statusFilter])

  const counts = useMemo(() => {
    const c = { all: storeProducts.length, draft: 0, active: 0, archived: 0 }
    for (const p of storeProducts) c[p.status as 'draft' | 'active' | 'archived']++
    return c
  }, [storeProducts])

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[var(--bg-base)]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm font-medium rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>
      </header>

      <motion.main
        className="max-w-7xl mx-auto px-6 py-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            All <span className="gradient-text">Products</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {counts.all} product{counts.all === 1 ? '' : 's'} across {user?.orgName || 'your workspace'}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]/40 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/20 transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              {(['all', 'active', 'draft', 'archived'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${
                    statusFilter === s
                      ? 'bg-white/[0.08] text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {s} <span className="opacity-60">· {counts[s]}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'grid' ? 'bg-white/[0.08] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'list' ? 'bg-white/[0.08] text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <Rows3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
            <Filter className="w-8 h-8 text-[var(--text-tertiary)] mb-3" />
            <p className="text-sm text-[var(--text-primary)]">No products match your filters</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Try clearing search or switching status</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="group relative p-5 rounded-xl border border-dashed border-white/[0.1] bg-gradient-to-br from-[var(--accent)]/[0.04] to-transparent hover:from-[var(--accent)]/[0.1] hover:border-[var(--accent)]/30 transition-all flex flex-col items-center justify-center gap-2 min-h-[160px] overflow-hidden"
            >
              <div className="relative w-11 h-11 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <span className="relative text-sm font-medium text-[var(--text-primary)]">Create new product</span>
              <span className="relative text-[11px] text-[var(--text-tertiary)]">Start fresh or from template</span>
            </button>
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} orgSlug={orgSlug} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden divide-y divide-white/[0.04]">
            {filtered.map((product, i) => (
              <ProductRow key={product.id} product={product} index={i} orgSlug={orgSlug} />
            ))}
          </div>
        )}
      </motion.main>

      <CreateProductModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

function ProductCard({ product, index, orgSlug }: { product: Product; index: number; orgSlug: string }) {
  return (
    <motion.a
      href={`/${product.orgSlug || orgSlug}/${product.slug}/planner`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        borderColor: 'rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.035)',
        boxShadow: `0 8px 32px ${product.color}18`,
      }}
      className="group relative p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden block"
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
        <StatusPill status={product.status} />
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
  )
}

function ProductRow({ product, index, orgSlug }: { product: Product; index: number; orgSlug: string }) {
  return (
    <motion.a
      href={`/${product.orgSlug || orgSlug}/${product.slug}/planner`}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className="group flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
        style={{ backgroundColor: `${product.color}15` }}
      >
        {product.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-white">{product.name}</p>
        {product.description && (
          <p className="text-xs text-[var(--text-tertiary)] truncate">{product.description}</p>
        )}
      </div>
      <StatusPill status={product.status} />
      <div className="hidden sm:flex items-center gap-1 text-xs text-[var(--text-tertiary)] w-28 justify-end">
        <Clock className="w-3 h-3" />
        {new Date(product.createdAt).toLocaleDateString()}
      </div>
    </motion.a>
  )
}

function StatusPill({ status }: { status: 'draft' | 'active' | 'archived' }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
        status === 'active'
          ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
          : status === 'draft'
            ? 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]'
            : 'bg-white/[0.06] text-[var(--text-tertiary)]'
      }`}
    >
      {status}
    </span>
  )
}
