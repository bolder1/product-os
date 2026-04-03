'use client'

import { useState, useMemo, useCallback } from 'react'
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
  RefreshCw,
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
  preview: string
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
  'full-product': { label: 'Full Product', icon: <Package className="w-3 h-3" /> },
  'brand': { label: 'Brand', icon: <Palette className="w-3 h-3" /> },
  'components': { label: 'Components', icon: <Layers className="w-3 h-3" /> },
  'pages': { label: 'Pages', icon: <Layout className="w-3 h-3" /> },
  'workflows': { label: 'Workflows', icon: <GitFork className="w-3 h-3" /> },
  'design-system': { label: 'Design System', icon: <FileText className="w-3 h-3" /> },
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[800px] max-h-[85vh] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-[var(--topbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2">
            <Store className="w-3.5 h-3.5 text-[var(--accent-text)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">Template Marketplace</span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {marketplaceTemplates.length} templates
            </span>
          </div>
          <button onClick={onClose} className="tool-btn p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search + Category filter */}
        <div className="px-3 py-2 border-b border-[var(--border-default)] space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="tool-input w-full pl-7 pr-3 py-1.5"
            />
          </div>
          <div className="tool-tabs border-0">
            {(['all', ...Object.keys(categoryMeta)] as (TemplateCategory | 'all')[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`tool-tab flex items-center gap-1 ${activeCategory === cat ? 'active' : ''}`}
              >
                {cat !== 'all' && categoryMeta[cat].icon}
                {cat === 'all' ? 'All' : categoryMeta[cat].label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-3">
          {/* Featured section */}
          {activeCategory === 'all' && !search && featured.length > 0 && (
            <div className="mb-3">
              <p className="tool-section-label">Featured</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {featured.slice(0, 2).map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-[var(--radius-md)] border border-[var(--accent)]/20 bg-[var(--accent)]/[0.03] p-3 cursor-pointer hover:border-[var(--accent)]/40 transition-colors"
                    onClick={() => setPreviewId(tpl.id)}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <h3 className="text-[12px] font-medium text-[var(--text-primary)]">{tpl.name}</h3>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-[var(--color-warning)]" />
                        <span className="text-[10px] text-[var(--color-warning)]">{tpl.rating}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {tpl.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-tertiary)]">
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />{tpl.downloads.toLocaleString()}
                      </span>
                      <span>{tpl.nodeCount} nodes</span>
                      <span>{tpl.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-inset)] p-3 hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-medium text-[var(--text-primary)]">{tpl.name}</h3>
                    {tpl.isNew && (
                      <span className="tool-badge text-[var(--color-success)]">NEW</span>
                    )}
                  </div>
                  <span className="tool-badge text-[var(--accent-text)]">
                    {categoryMeta[tpl.category]?.label ?? tpl.category}
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2 mb-2">
                  {tpl.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-2">
                  {tpl.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="tool-badge">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-[var(--color-warning)]" />{tpl.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />{tpl.downloads.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewId(tpl.id)}
                      className="tool-btn p-1"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                    {installedIds.has(tpl.id) ? (
                      <span className="tool-btn text-[var(--color-success)] text-[11px]">
                        <Check className="w-3 h-3" /> Installed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInstall(tpl)}
                        disabled={installingId === tpl.id}
                        className="tool-btn text-[var(--accent-text)] text-[11px] disabled:opacity-50"
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
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <Search className="w-5 h-5 text-[var(--text-tertiary)]" />
              <p className="text-[12px] text-[var(--text-secondary)]">No templates match your search</p>
            </div>
          )}
        </div>

        {/* Preview panel */}
        {previewTemplate && (
          <div className="border-t border-[var(--border-default)]">
            <div className="px-3 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-[13px] font-medium text-[var(--text-primary)]">{previewTemplate.name}</h3>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">{previewTemplate.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--text-secondary)]">
                    <span>{previewTemplate.nodeCount} nodes</span>
                    <span>{previewTemplate.edgeCount} edges</span>
                    <span>by {previewTemplate.author}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3">
                  {!installedIds.has(previewTemplate.id) && (
                    <button
                      onClick={() => handleInstall(previewTemplate)}
                      disabled={installingId === previewTemplate.id}
                      className="tool-btn tool-btn-primary text-[11px]"
                    >
                      <Download className="w-3 h-3" />
                      Install Template
                    </button>
                  )}
                  <button
                    onClick={() => setPreviewId(null)}
                    className="tool-btn p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
