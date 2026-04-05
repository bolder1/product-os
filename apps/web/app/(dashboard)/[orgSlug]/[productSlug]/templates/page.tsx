'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  LayoutTemplate,
  Search,
  ChevronDown,
  X,
  Copy,
  FileText,
  Layers,
  GitBranch,
  Palette,
  Settings,
  Zap,
  Box,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { trpcMutate, trpcQuery } from '../../../../lib/api'
import { useProductStore } from '../../../../lib/product-store'
import { useProduct } from '../layout'

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

type Category = 'All' | 'Workflow' | 'Page' | 'Component' | 'Design' | 'Release' | 'Integration'
type SortOption = 'Popular' | 'Name A-Z' | 'Recent'

interface Template {
  id: string
  name: string
  description: string
  category: Exclude<Category, 'All'>
  tags: string[]
  nodeCount: number
  author: string
  usageCount: number
  nodes: string[]
}

const CATEGORIES: Category[] = ['All', 'Workflow', 'Page', 'Component', 'Design', 'Release', 'Integration']

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Workflow: <GitBranch className="w-3 h-3" />,
  Page: <FileText className="w-3 h-3" />,
  Component: <Box className="w-3 h-3" />,
  Design: <Palette className="w-3 h-3" />,
  Release: <Zap className="w-3 h-3" />,
  Integration: <Settings className="w-3 h-3" />,
}

const templates: Template[] = [
  {
    id: 't-1', name: 'SaaS Onboarding Flow', description: 'End-to-end onboarding workflow with email sequences, feature tours, and activation tracking.',
    category: 'Workflow', tags: ['onboarding', 'saas', 'activation'], nodeCount: 24, author: 'Product OS', usageCount: 1820,
    nodes: ['Welcome Email', 'Feature Tour', 'Activation Check', 'Follow-up Sequence'],
  },
  {
    id: 't-2', name: 'Landing Page', description: 'Conversion-optimized landing page with hero, features, pricing, and CTA sections.',
    category: 'Page', tags: ['landing', 'marketing', 'conversion'], nodeCount: 18, author: 'Product OS', usageCount: 2340,
    nodes: ['Hero Section', 'Feature Grid', 'Pricing Table', 'CTA Block'],
  },
  {
    id: 't-3', name: 'Design System Starter', description: 'Foundation tokens, color scales, typography, and spacing for a new design system.',
    category: 'Design', tags: ['tokens', 'typography', 'colors'], nodeCount: 32, author: 'Product OS', usageCount: 1560,
    nodes: ['Color Tokens', 'Typography Scale', 'Spacing Grid', 'Shadow Set'],
  },
  {
    id: 't-4', name: 'React Component Kit', description: 'Button, Input, Modal, and Table primitives with variants and accessibility baked in.',
    category: 'Component', tags: ['react', 'a11y', 'primitives'], nodeCount: 16, author: 'Product OS', usageCount: 2890,
    nodes: ['Button', 'Input', 'Modal', 'Table'],
  },
  {
    id: 't-5', name: 'Release Checklist', description: 'Pre-launch verification workflow with QA gates, stakeholder sign-off, and rollback plan.',
    category: 'Release', tags: ['release', 'qa', 'checklist'], nodeCount: 14, author: 'Product OS', usageCount: 980,
    nodes: ['QA Gate', 'Staging Deploy', 'Stakeholder Review', 'Go/No-Go'],
  },
  {
    id: 't-6', name: 'API Integration Blueprint', description: 'REST/GraphQL integration scaffold with auth, error handling, and retry patterns.',
    category: 'Integration', tags: ['api', 'rest', 'graphql'], nodeCount: 20, author: 'Product OS', usageCount: 1120,
    nodes: ['Auth Setup', 'Endpoint Map', 'Error Handler', 'Retry Logic'],
  },
  {
    id: 't-7', name: 'Sprint Planning Board', description: 'Kanban-style sprint layout with backlog, in-progress, review, and done columns.',
    category: 'Workflow', tags: ['sprint', 'agile', 'kanban'], nodeCount: 12, author: 'Product OS', usageCount: 1640,
    nodes: ['Backlog', 'In Progress', 'Review', 'Done'],
  },
  {
    id: 't-8', name: 'Settings Page', description: 'Account settings page with profile, billing, notifications, and security sections.',
    category: 'Page', tags: ['settings', 'account', 'profile'], nodeCount: 22, author: 'Product OS', usageCount: 1350,
    nodes: ['Profile Section', 'Billing Tab', 'Notification Prefs', 'Security Panel'],
  },
  {
    id: 't-9', name: 'Dashboard Layout', description: 'Analytics dashboard with KPI cards, chart panels, and data table.',
    category: 'Page', tags: ['dashboard', 'analytics', 'charts'], nodeCount: 28, author: 'Product OS', usageCount: 3100,
    nodes: ['KPI Row', 'Line Chart', 'Bar Chart', 'Data Table'],
  },
]

// ---------------------------------------------------------------------------
// Template Card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  onClick,
}: {
  template: Template
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-active)] transition-colors p-3 flex flex-col gap-2"
    >
      {/* Category + usage */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {CATEGORY_ICONS[template.category]}
          {template.category}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">{template.usageCount.toLocaleString()} uses</span>
      </div>

      {/* Name */}
      <h3 className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{template.name}</h3>

      {/* Description */}
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-2">{template.description}</p>

      {/* Tags */}
      <div className="flex items-center gap-1 flex-wrap mt-auto">
        {template.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="tool-badge">{tag}</span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border-default)]">
        <span className="text-[10px] text-[var(--text-tertiary)]">{template.nodeCount} nodes</span>
        <span className="text-[10px] text-[var(--text-tertiary)]">{template.author}</span>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Preview Modal
// ---------------------------------------------------------------------------

function TemplatePreview({
  template,
  onClose,
  onApply,
  applying,
  applyResult,
}: {
  template: Template
  onClose: () => void
  onApply: (t: Template) => void
  applying?: boolean
  applyResult?: { nodes: number; edges: number } | null
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-3.5 h-3.5 text-[var(--accent-text)]" />
            <span className="text-[13px] font-medium text-[var(--text-primary)]">{template.name}</span>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Meta row */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">
              {CATEGORY_ICONS[template.category]}
              {template.category}
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)]">{template.nodeCount} nodes</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">{template.usageCount.toLocaleString()} uses</span>
          </div>

          {/* Description */}
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed">{template.description}</p>

          {/* Tags */}
          <div className="flex items-center gap-1 flex-wrap">
            {template.tags.map((tag) => (
              <span key={tag} className="tool-badge">{tag}</span>
            ))}
          </div>

          {/* Nodes preview */}
          <div>
            <span className="tool-section-label block mb-2">Included Nodes</span>
            <div className="space-y-1">
              {template.nodes.map((node, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                  <Layers className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <span className="text-[12px] text-[var(--text-primary)]">{node}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[var(--border-default)]">
          {applyResult ? (
            <div className="flex items-center gap-2 text-[12px] text-[var(--color-success)]">
              <CheckCircle2 className="w-4 h-4" />
              Applied! {applyResult.nodes} nodes, {applyResult.edges} edges created
            </div>
          ) : (
            <>
              <button onClick={onClose} className="tool-btn" disabled={applying}>
                Cancel
              </button>
              <button
                onClick={() => onApply(template)}
                className="tool-btn tool-btn-primary"
                disabled={applying}
              >
                {applying ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {applying ? 'Applying...' : 'Apply Template'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TemplateGalleryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('All')
  const [sort, setSort] = useState<SortOption>('Popular')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyResult, setApplyResult] = useState<{ nodes: number; edges: number } | null>(null)
  const params = useParams()
  const router = useRouter()
  const product = useProduct()

  // Fetch real templates from DB
  const [dbTemplates, setDbTemplates] = useState<Template[]>([])
  useEffect(() => {
    trpcQuery<Array<{ id: string; name: string; description: string | null; category: string | null; tags: string[] | null; bundle: Record<string, unknown> | null }>>('template.listBuiltIn', {})
      .then((rows) => {
        const mapped: Template[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? '',
          category: (r.category as Exclude<Category, 'All'>) ?? 'Workflow',
          tags: r.tags ?? [],
          nodeCount: Array.isArray((r.bundle as any)?.nodes) ? (r.bundle as any).nodes.length : 0,
          author: 'Product OS',
          usageCount: 0,
          nodes: Array.isArray((r.bundle as any)?.nodes)
            ? (r.bundle as any).nodes.map((n: any) => n.label ?? n.kind).slice(0, 6)
            : [],
        }))
        setDbTemplates(mapped)
      })
      .catch(() => { /* keep hardcoded fallback */ })
  }, [])

  // Merge DB templates (first) with hardcoded ones
  const allTemplates = useMemo(() => {
    const ids = new Set(dbTemplates.map((t) => t.id))
    return [...dbTemplates, ...templates.filter((t) => !ids.has(t.id))]
  }, [dbTemplates])

  const filtered = useMemo(() => {
    let result = allTemplates

    if (category !== 'All') {
      result = result.filter((t) => t.category === category)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    switch (sort) {
      case 'Name A-Z':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'Recent':
        result = [...result].reverse()
        break
      case 'Popular':
      default:
        result = [...result].sort((a, b) => b.usageCount - a.usageCount)
        break
    }

    return result
  }, [search, category, sort])

  const handleApply = async (template: Template) => {
    if (!product?.id) return

    // Check if the template has a DB UUID (real template) vs hardcoded
    const isDbTemplate = template.id.match(/^[0-9a-f]{8}-/)

    if (isDbTemplate) {
      setApplying(true)
      try {
        const result = await trpcMutate<{ nodesCreated: number; edgesCreated: number }>(
          'template.applyTemplate',
          { templateId: template.id, productId: product.id },
        )
        setApplyResult({ nodes: result.nodesCreated, edges: result.edgesCreated })
        setTimeout(() => {
          setPreviewTemplate(null)
          setApplyResult(null)
          setApplying(false)
          // Navigate to graph explorer to see results
          router.push(`/${params.orgSlug}/${params.productSlug}/graph-explorer`)
        }, 1500)
      } catch (err) {
        console.error('Failed to apply template:', err)
        setApplying(false)
      }
    } else {
      // Hardcoded template — just close the modal for now
      setPreviewTemplate(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="h-[var(--toolbar-h)] flex items-center gap-2 px-2 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <LayoutTemplate className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
        <span className="text-[11px] font-medium text-[var(--text-primary)] shrink-0">Templates</span>

        <div className="w-px h-3.5 bg-[var(--border-default)] mx-1" />

        {/* Category tabs */}
        <div className="flex items-center gap-0 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`tool-tab py-1 px-2 text-[10px] border-b-0 ${category === cat ? 'active text-[var(--text-primary)]' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Sort */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="tool-btn py-0.5 px-2 text-[10px]"
          >
            {sort}
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
          {showSortDropdown && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-elevated)] border border-[var(--border-default)] py-1 min-w-[100px]">
              {(['Popular', 'Name A-Z', 'Recent'] as SortOption[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setSort(opt); setShowSortDropdown(false) }}
                  className={`block w-full text-left px-3 py-1 text-[11px] transition-colors ${
                    sort === opt ? 'text-[var(--accent-text)] bg-[var(--accent)]/8' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="tool-input pl-6 pr-2 py-0.5 w-[160px] text-[11px]"
          />
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 bg-[var(--bg-workspace)]">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-1.5">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => setPreviewTemplate(template)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <LayoutTemplate className="w-5 h-5 text-[var(--text-tertiary)]" />
            <p className="text-[12px] text-[var(--text-secondary)]">No templates match your filters</p>
            <button
              onClick={() => { setSearch(''); setCategory('All') }}
              className="text-[11px] text-[var(--accent-text)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => { setPreviewTemplate(null); setApplyResult(null); setApplying(false) }}
          onApply={handleApply}
          applying={applying}
          applyResult={applyResult}
        />
      )}
    </div>
  )
}
