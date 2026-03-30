'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  Search,
  Download,
  Star,
  Eye,
  Package,
  Layers,
  Palette,
  Layout,
  FileText,
  GitFork,
  X,
  Check,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Filter,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateCategory = 'full-product' | 'brand' | 'components' | 'pages' | 'workflows' | 'design-system'

export interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  author: string
  downloads: number
  rating: number
  tags: string[]
  preview: string // short visual descriptor
  nodeCount: number
  edgeCount: number
  featured?: boolean
  isNew?: boolean
}

// ---------------------------------------------------------------------------
// Mock marketplace data
// ---------------------------------------------------------------------------

const marketplaceTemplates: MarketplaceTemplate[] = [
  {
    id: 'tpl-saas-starter',
    name: 'SaaS Starter Kit',
    description: 'Complete product graph for a SaaS application: auth flows, dashboard, billing, settings, and onboarding journeys.',
    category: 'full-product',
    author: 'Product OS Team',
    downloads: 2847,
    rating: 4.8,
    tags: ['saas', 'dashboard', 'billing', 'onboarding'],
    preview: 'Full product graph with 45 nodes',
    nodeCount: 45,
    edgeCount: 62,
    featured: true,
  },
  {
    id: 'tpl-ecom-store',
    name: 'E-Commerce Storefront',
    description: 'Product catalog, cart, checkout flow, order management, and customer dashboard with analytics.',
    category: 'full-product',
    author: 'Commerce Labs',
    downloads: 1923,
    rating: 4.6,
    tags: ['ecommerce', 'checkout', 'catalog', 'orders'],
    preview: 'Full product graph with 38 nodes',
    nodeCount: 38,
    edgeCount: 51,
    featured: true,
  },
  {
    id: 'tpl-brand-minimal',
    name: 'Minimal Brand System',
    description: 'Clean, minimal brand tokens: neutral palette, Inter/DM Sans typography, 4px spacing scale.',
    category: 'brand',
    author: 'Design Systems Co',
    downloads: 4210,
    rating: 4.9,
    tags: ['minimal', 'clean', 'neutral', 'modern'],
    preview: '8 tokens, 2 palettes',
    nodeCount: 8,
    edgeCount: 4,
    isNew: true,
  },
  {
    id: 'tpl-brand-bold',
    name: 'Bold & Vibrant Brand',
    description: 'High-energy brand with saturated colors, Clash Display headings, generous spacing.',
    category: 'brand',
    author: 'Creative Studio',
    downloads: 1567,
    rating: 4.5,
    tags: ['bold', 'vibrant', 'colorful', 'energetic'],
    preview: '10 tokens, 3 palettes',
    nodeCount: 10,
    edgeCount: 5,
  },
  {
    id: 'tpl-ui-kit',
    name: 'Enterprise UI Kit',
    description: '24 production-ready components: buttons, inputs, cards, tables, modals, nav, alerts, badges, and more.',
    category: 'components',
    author: 'Component Factory',
    downloads: 3891,
    rating: 4.7,
    tags: ['enterprise', 'ui-kit', 'production', 'accessible'],
    preview: '24 components, 86 variants',
    nodeCount: 24,
    edgeCount: 36,
    featured: true,
  },
  {
    id: 'tpl-mobile-kit',
    name: 'Mobile-First Components',
    description: 'Touch-optimized component set: bottom sheets, swipe cards, gesture handlers, and responsive layouts.',
    category: 'components',
    author: 'Mobile UX Lab',
    downloads: 1245,
    rating: 4.4,
    tags: ['mobile', 'touch', 'responsive', 'gestures'],
    preview: '16 components, 42 variants',
    nodeCount: 16,
    edgeCount: 22,
    isNew: true,
  },
  {
    id: 'tpl-landing-pages',
    name: 'Landing Page Collection',
    description: '6 conversion-optimized landing page layouts: hero, features, pricing, testimonials, CTA, footer.',
    category: 'pages',
    author: 'Growth Templates',
    downloads: 2156,
    rating: 4.6,
    tags: ['landing', 'conversion', 'marketing', 'cta'],
    preview: '6 pages, 18 sections',
    nodeCount: 18,
    edgeCount: 12,
  },
  {
    id: 'tpl-dashboard-pages',
    name: 'Dashboard Layouts',
    description: 'Analytics dashboard, settings page, user profile, data tables, and chart-heavy layouts.',
    category: 'pages',
    author: 'Data Viz Studio',
    downloads: 1678,
    rating: 4.5,
    tags: ['dashboard', 'analytics', 'data', 'charts'],
    preview: '5 pages, 22 sections',
    nodeCount: 22,
    edgeCount: 15,
  },
  {
    id: 'tpl-approval-flow',
    name: 'Multi-Stage Approval',
    description: 'Configurable approval workflow with parallel reviewers, escalation rules, and SLA tracking.',
    category: 'workflows',
    author: 'Workflow Pro',
    downloads: 987,
    rating: 4.3,
    tags: ['approval', 'review', 'sla', 'escalation'],
    preview: '3 workflows, 12 states',
    nodeCount: 12,
    edgeCount: 18,
  },
  {
    id: 'tpl-ds-tokens',
    name: 'Design System Foundation',
    description: 'Complete design system tokens: colors, typography, spacing, shadows, border radii, and breakpoints.',
    category: 'design-system',
    author: 'Token Master',
    downloads: 3456,
    rating: 4.8,
    tags: ['design-system', 'tokens', 'foundations', 'scale'],
    preview: '32 tokens across 6 categories',
    nodeCount: 32,
    edgeCount: 8,
    featured: true,
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const categoryMeta: Record<TemplateCategory, { label: string; icon: React.ReactNode }> = {
  'full-product': { label: 'Full Product', icon: <Package className="w-3.5 h-3.5" /> },
  'brand': { label: 'Brand', icon: <Palette className="w-3.5 h-3.5" /> },
  'components': { label: 'Components', icon: <Layers className="w-3.5 h-3.5" /> },
  'pages': { label: 'Pages', icon: <Layout className="w-3.5 h-3.5" /> },
  'workflows': { label: 'Workflows', icon: <GitFork className="w-3.5 h-3.5" /> },
  'design-system': { label: 'Design System', icon: <FileText className="w-3.5 h-3.5" /> },
}

interface TemplateMarketplaceProps {
  open: boolean
  onClose: () => void
  onInstall?: (template: MarketplaceTemplate) => void
}

export function TemplateMarketplace({ open, onClose, onInstall }: TemplateMarketplaceProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set())
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let items = marketplaceTemplates
    if (activeCategory !== 'all') {
      items = items.filter((t) => t.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q))
      )
    }
    return items
  }, [search, activeCategory])

  const featured = useMemo(() => filtered.filter((t) => t.featured), [filtered])

  const handleInstall = useCallback((template: MarketplaceTemplate) => {
    setInstallingId(template.id)
    setTimeout(() => {
      setInstalledIds((prev) => new Set([...prev, template.id]))
      setInstallingId(null)
      onInstall?.(template)
    }, 1500)
  }, [onInstall])

  const previewTemplate = previewId ? marketplaceTemplates.find((t) => t.id === previewId) : null

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
          className="w-[820px] max-h-[85vh] rounded-2xl border border-white/[0.1] bg-[#0A0F1E] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#10B981] flex items-center justify-center">
                <Store className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#F1F5F9]">Template Marketplace</h2>
                <p className="text-[0.6875rem] text-[#64748B]">
                  {marketplaceTemplates.length} templates available
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#64748B]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search + Category filter */}
          <div className="px-6 py-3 border-b border-white/[0.04] space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#F1F5F9] placeholder-[#475569] focus:outline-none focus:border-[#6366F1]/40"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['all', ...Object.keys(categoryMeta)] as (TemplateCategory | 'all')[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.6875rem] whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? 'bg-[#6366F1]/10 text-[#818CF8]'
                      : 'text-[#475569] hover:bg-white/[0.04]'
                  }`}
                >
                  {cat !== 'all' && categoryMeta[cat].icon}
                  {cat === 'all' ? 'All' : categoryMeta[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-4">
            {/* Featured section */}
            {activeCategory === 'all' && !search && featured.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span className="text-[0.625rem] uppercase tracking-wider text-[#64748B] font-medium">Featured</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {featured.slice(0, 2).map((tpl) => (
                    <motion.div
                      key={tpl.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-[#6366F1]/20 bg-gradient-to-br from-[#6366F1]/5 to-transparent p-4 cursor-pointer hover:border-[#6366F1]/40 transition-colors"
                      onClick={() => setPreviewId(tpl.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xs font-semibold text-[#F1F5F9]">{tpl.name}</h3>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                          <span className="text-[0.5625rem] text-[#F59E0B]">{tpl.rating}</span>
                        </div>
                      </div>
                      <p className="text-[0.6875rem] text-[#64748B] leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-[0.5625rem] text-[#475569]">
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />{tpl.downloads.toLocaleString()}
                        </span>
                        <span>{tpl.nodeCount} nodes</span>
                        <span>{tpl.author}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {filtered.map((tpl, i) => (
                <motion.div
                  key={tpl.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-[#F1F5F9]">{tpl.name}</h3>
                      {tpl.isNew && (
                        <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className={`text-[0.5625rem] px-1.5 py-0.5 rounded bg-white/[0.04] ${
                      categoryMeta[tpl.category] ? 'text-[#818CF8]' : 'text-[#475569]'
                    }`}>
                      {categoryMeta[tpl.category]?.label ?? tpl.category}
                    </span>
                  </div>

                  <p className="text-[0.6875rem] text-[#64748B] leading-relaxed line-clamp-2 mb-3">
                    {tpl.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {tpl.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[0.5625rem] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#475569]">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[0.5625rem] text-[#475569]">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#F59E0B]" />{tpl.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />{tpl.downloads.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewId(tpl.id)}
                        className="p-1.5 rounded-lg text-[#475569] hover:bg-white/[0.04] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {installedIds.has(tpl.id) ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[0.6875rem]">
                          <Check className="w-3 h-3" /> Installed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleInstall(tpl)}
                          disabled={installingId === tpl.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6366F1]/10 text-[#818CF8] text-[0.6875rem] font-medium hover:bg-[#6366F1]/20 transition-colors disabled:opacity-50"
                        >
                          {installingId === tpl.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Download className="w-3 h-3" />
                          )}
                          {installingId === tpl.id ? 'Installing...' : 'Install'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Search className="w-8 h-8 text-[#475569]" />
                <p className="text-sm text-[#64748B]">No templates match your search</p>
              </div>
            )}
          </div>

          {/* Preview panel */}
          <AnimatePresence>
            {previewTemplate && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/[0.06] overflow-hidden"
              >
                <div className="px-6 py-4 bg-white/[0.01]">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-[#F1F5F9]">{previewTemplate.name}</h3>
                      <p className="text-[0.6875rem] text-[#64748B] mt-1">{previewTemplate.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-[0.6875rem] text-[#94A3B8]">
                        <span>{previewTemplate.nodeCount} nodes</span>
                        <span>{previewTemplate.edgeCount} edges</span>
                        <span>by {previewTemplate.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!installedIds.has(previewTemplate.id) && (
                        <button
                          onClick={() => handleInstall(previewTemplate)}
                          disabled={installingId === previewTemplate.id}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#6366F1] text-white text-xs font-medium hover:bg-[#5558E6] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Install Template
                        </button>
                      )}
                      <button
                        onClick={() => setPreviewId(null)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.05] text-[#64748B]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
