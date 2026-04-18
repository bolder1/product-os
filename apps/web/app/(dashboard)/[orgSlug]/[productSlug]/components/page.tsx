'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useProduct } from '../layout'
import { Box, Plus, Sparkles, Search, Trash2, LayoutTemplate, FormInput, Database, AlertCircle, Navigation as NavIcon } from 'lucide-react'
import { type ComponentDef, type Category, categories, mockComponents } from './_data/mock-components'
import { useGraphStore } from '../../../../lib/graph-store'
import { useBrandTokens } from '../../../../lib/use-brand-tokens'
import { ComponentDetail } from './_components/component-detail'
import { ComponentCreateModal } from './_components/component-create-modal'
import { StudioHealthBadge } from '../../../../components/shared/studio-health-badge'
import { StudioEmptyState } from '../../../../components/shared/studio-empty-state'

/* ------------------------------------------------------------------ */
/*  Graph-node → local ComponentDef converter                         */
/* ------------------------------------------------------------------ */
function nodeToComponent(n: { id: string; label: string; data: Record<string, unknown> }): ComponentDef {
  try {
    return {
      id: n.id,
      name: n.label,
      category: (String(n.data.category || 'Layout')) as ComponentDef['category'],
      description: String(n.data.description || ''),
      props: n.data.props ? JSON.parse(String(n.data.props)) : [],
      variants: n.data.variants ? JSON.parse(String(n.data.variants)) : [],
      usageCount: Number(n.data.usageCount || 0),
      tokenBindings: n.data.tokenBindings ? JSON.parse(String(n.data.tokenBindings)) : [],
    }
  } catch {
    return { id: n.id, name: n.label, category: 'Layout', description: '', props: [], variants: [], usageCount: 0, tokenBindings: [] }
  }
}

/* ------------------------------------------------------------------ */
/*  Category icons for the left-panel tree                            */
/* ------------------------------------------------------------------ */
const catIcon: Record<string, React.ReactNode> = {
  Layout:     <LayoutTemplate className="w-3 h-3" />,
  Form:       <FormInput className="w-3 h-3" />,
  Data:       <Database className="w-3 h-3" />,
  Feedback:   <AlertCircle className="w-3 h-3" />,
  Navigation: <NavIcon className="w-3 h-3" />,
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ComponentBuilderPage() {
  const params = useParams<{ productSlug: string }>()
  const searchParams = useSearchParams()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  /* --- brand tokens (for token binding) ---------------------------- */
  const brandTokens = useBrandTokens(productId)

  /* --- graph store ------------------------------------------------ */
  const allNodes   = useGraphStore((s) => s.nodes)
  const addNode    = useGraphStore((s) => s.addNode)
  const updateNode = useGraphStore((s) => s.updateNode)
  const deleteNode = useGraphStore((s) => s.deleteNode)

  const componentNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId && n.kind === 'component'),
    [allNodes, productId],
  )

  const hasStoreData = componentNodes.length > 0

  const components = useMemo(
    () => (hasStoreData ? componentNodes.map(nodeToComponent) : mockComponents),
    [hasStoreData, componentNodes],
  )

  /* --- local state ------------------------------------------------ */
  const [selectedId, setSelectedId] = useState<string | null>(components[0]?.id ?? null)
  const [modalOpen, setModalOpen]   = useState(false)
  const [search, setSearch]         = useState('')

  // Auto-select component when navigated from Graph Explorer via ?nodeId
  useEffect(() => {
    const nodeId = searchParams.get('nodeId')
    if (!nodeId || components.length === 0) return
    const match = components.find((c) => c.id === nodeId)
    if (match) setSelectedId(match.id)
  }, [searchParams, components])
  const [catFilter, setCatFilter]   = useState<Category>('All')

  const selectedComponent = components.find((c) => c.id === selectedId) ?? null

  /* --- filtered list ---------------------------------------------- */
  const filtered = useMemo(() => {
    let list = components
    if (catFilter !== 'All') list = list.filter((c) => c.category === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q))
    }
    return list
  }, [components, catFilter, search])

  /* --- grouped by category for tree view -------------------------- */
  const grouped = useMemo(() => {
    const map: Record<string, ComponentDef[]> = {}
    for (const c of filtered) {
      ;(map[c.category] ??= []).push(c)
    }
    return map
  }, [filtered])

  /* --- handlers --------------------------------------------------- */
  const handleUpdateComponent = useCallback(
    (id: string, updates: Partial<ComponentDef>) => {
      const existing = componentNodes.find((n) => n.id === id)
      if (existing) {
        const merged = { ...nodeToComponent(existing), ...updates }
        updateNode(id, {
          label: merged.name,
          data: {
            category: merged.category,
            description: merged.description,
            props: JSON.stringify(merged.props),
            variants: JSON.stringify(merged.variants),
            usageCount: String(merged.usageCount),
            tokenBindings: JSON.stringify(merged.tokenBindings ?? []),
          },
        })
      }
    },
    [componentNodes, updateNode],
  )

  const handleCreateComponent = useCallback(
    (data: Omit<ComponentDef, 'id' | 'usageCount'>) => {
      const node = addNode({
        kind: 'component',
        label: data.name,
        productId,
        data: {
          category: data.category,
          description: data.description,
          props: JSON.stringify(data.props),
          variants: JSON.stringify(data.variants),
          usageCount: '0',
          tokenBindings: JSON.stringify(data.tokenBindings ?? []),
        },
      })
      setSelectedId(node.id)
    },
    [addNode, productId],
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteNode(id)
      if (selectedId === id) setSelectedId(null)
    },
    [deleteNode, selectedId],
  )

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">

      {/* ---- top toolbar ------------------------------------------ */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        {/* left cluster */}
        <div className="flex items-center gap-2">
          <Box className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)] leading-none">Component Builder</span>
          <StudioHealthBadge productId={productId} studio="components" />
          <span className="text-[11px] text-[var(--text-tertiary)] leading-none ml-1">
            {components.length} item{components.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* right cluster */}
        <div className="flex items-center gap-1">
          <button className="tool-btn flex items-center gap-1 px-2 h-6 rounded text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors">
            <Sparkles className="w-3 h-3" />
            AI Generate
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="tool-btn flex items-center gap-1 px-2 h-6 rounded text-[11px] text-[var(--text-primary)] bg-[var(--accent)] hover:bg-[var(--accent)]/80 transition-colors"
          >
            <Plus className="w-3 h-3" />
            New Component
          </button>
        </div>
      </div>

      {/* ---- body: left panel + main area ------------------------ */}
      <div className="flex flex-1 min-h-0">

        {/* ======= LEFT PANEL (240px) ============================= */}
        <div className="tool-panel-left w-60 min-w-[240px] flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)]">

          {/* search */}
          <div className="px-2 py-1.5 border-b border-[var(--border-default)]">
            <div className="tool-input flex items-center gap-1.5 h-6 px-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)]">
              <Search className="w-3 h-3 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search components..."
                className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
              />
            </div>
          </div>

          {/* category tabs */}
          <div className="tool-tabs flex items-center gap-0.5 px-2 py-1 border-b border-[var(--border-default)] overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat as Category)}
                className={`tool-tab shrink-0 px-1.5 h-5 rounded text-[11px] leading-none transition-colors ${
                  catFilter === cat
                    ? 'text-[var(--accent-text)] bg-[var(--accent)]/10'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* component tree */}
          <div className="flex-1 overflow-y-auto">
            {Object.keys(grouped).length === 0 && (
              <div className="px-3 py-4 text-[11px] text-[var(--text-tertiary)] text-center">No components found</div>
            )}

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                {/* category header */}
                <div className="tool-section-label flex items-center gap-1.5 px-3 py-1 text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider select-none">
                  {catIcon[cat] ?? <Box className="w-3 h-3" />}
                  {cat}
                  <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">{items.length}</span>
                </div>

                {/* items */}
                {items.map((comp) => {
                  const active = comp.id === selectedId
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedId(comp.id)}
                      className={`w-full flex items-center gap-2 px-3 py-1 text-left group transition-colors ${
                        active
                          ? 'bg-[var(--accent)]/10 text-[var(--accent-text)]'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <Box className="w-3 h-3 shrink-0 opacity-40" />
                      <span className="text-[12px] truncate flex-1">{comp.name}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 shrink-0">
                        {comp.usageCount}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* bottom bar */}
          <div className="px-3 py-1.5 border-t border-[var(--border-default)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-tertiary)]">{filtered.length} shown</span>
            <button
              onClick={() => setModalOpen(true)}
              className="tool-btn flex items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>

        {/* ======= MAIN AREA ====================================== */}
        <div className="tool-panel-right flex-1 min-w-0 overflow-y-auto bg-[var(--bg-workspace)]">
          {selectedComponent ? (
            <div className="h-full">
              <ComponentDetail
                component={selectedComponent}
                onUpdate={handleUpdateComponent}
                brandTokens={brandTokens}
              />
            </div>
          ) : components.length === 0 && hasStoreData ? (
            <StudioEmptyState
              title="No Components Yet"
              description="Create reusable UI building blocks with variants, props, and token bindings. Components are shared across Design Studio, Page Builder, and Code Studio."
              icon={<Box className="w-6 h-6" />}
              createLabel="New Component"
              onCreate={() => setModalOpen(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <Box className="w-5 h-5 text-[var(--text-tertiary)]" />
              <p className="text-[12px] text-[var(--text-secondary)]">No component selected</p>
              <p className="text-[11px] text-[var(--text-tertiary)] max-w-[220px]">
                Select a component from the list or create a new one to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ---- create modal ---------------------------------------- */}
      <ComponentCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreateComponent}
      />
    </div>
  )
}
