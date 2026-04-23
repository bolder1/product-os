'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import { Plus, Eye, Sparkles, FileText, Rocket, Search, Database, Menu } from 'lucide-react'
import { mockPages, type PageDef, type SectionDef } from './_data/mock-pages'
import { useGraphStore } from '../../../../lib/graph-store'
import { PageTree } from './_components/page-tree'
import { SectionEditor } from './_components/section-editor'
import { SectionProperties } from './_components/section-properties'
import { PagePreview } from './_components/page-preview'
import { SeoPanel } from './_components/seo-panel'
import { DataBindingPanel } from './_components/data-binding-panel'
import { NavigationBuilder, type NavItem } from './_components/navigation-builder'
import { PublishModal } from './_components/publish-modal'
import { StudioHealthBadge } from '../../../../components/shared/studio-health-badge'
import { AnalyticsOverlay } from '../../../../components/shared/analytics-overlay'
import { StudioEmptyState } from '../../../../components/shared/studio-empty-state'
import { ContextBanner } from '../../../../components/shared/upstream-empty-state'

type RightPanelTab = 'properties' | 'seo' | 'data' | 'nav'

export default function PageBuilderPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  // Graph store for persistence
  const allNodes = useGraphStore((s) => s.nodes)
  const addNode = useGraphStore((s) => s.addNode)
  const updateNode = useGraphStore((s) => s.updateNode)

  const pageNodes = useMemo(
    () => allNodes.filter((n) => n.productId === productId && n.kind === 'page'),
    [allNodes, productId]
  )

  // Get entity nodes for data binding panel
  const entityNodes = useMemo(
    () =>
      allNodes
        .filter((n) => n.productId === productId && n.kind === 'entity')
        .map((n) => {
          const data = n.data as Record<string, unknown>
          let fields: Array<{ name: string }> = []
          try {
            fields = typeof data.fields === 'string' ? JSON.parse(data.fields) : (data.fields as Array<{ name: string }>) ?? []
          } catch { /* empty */ }
          return { id: n.id, label: n.label, fields }
        }),
    [allNodes, productId]
  )

  const hasStorePages = pageNodes.length > 0

  const [pages, setPages] = useState<PageDef[]>(() => {
    if (!hasStorePages) return mockPages
    try {
      return pageNodes.map((n) => JSON.parse(String(n.data.payload)) as PageDef)
    } catch { return mockPages }
  })
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    pages[0]?.id ?? 'page-home'
  )

  // Sync pages to graph store
  useEffect(() => {
    for (const page of pages) {
      const existing = pageNodes.find((n) => (n.data as Record<string, unknown>).pageLocalId === page.id)
      const payload = JSON.stringify(page)
      if (existing) {
        if (String(existing.data.payload) !== payload) {
          updateNode(existing.id, { label: page.name, data: { pageLocalId: page.id, payload } })
        }
      } else {
        addNode({ kind: 'page', label: page.name, productId, data: { pageLocalId: page.id, payload } })
      }
    }
  }, [pages]) // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  )
  const [previewOpen, setPreviewOpen] = useState(false)
  const [publishModalOpen, setPublishModalOpen] = useState(false)
  const [rightTab, setRightTab] = useState<RightPanelTab>('properties')
  const [navItems, setNavItems] = useState<NavItem[]>([])

  const selectedPage = pages.find((p) => p.id === selectedPageId) || null
  const selectedSection =
    selectedPage?.sections.find((s) => s.id === selectedSectionId) || null

  // Compute SEO score for selected page (client-side)
  const seoScore = useMemo(() => {
    if (!selectedPage) return 0
    let score = 100
    if (!selectedPage.seo.title) score -= 25
    else if (selectedPage.seo.title.length > 60) score -= 10
    if (!selectedPage.seo.description) score -= 25
    else if (selectedPage.seo.description.length > 160) score -= 10
    return Math.max(0, score)
  }, [selectedPage])

  // Add a new page
  const handleAddPage = useCallback(() => {
    const newPage: PageDef = {
      id: `page-${Date.now()}`,
      name: 'Untitled Page',
      slug: `/untitled-${pages.length + 1}`,
      status: 'draft',
      parentId: null,
      order: pages.length,
      sections: [],
      seo: { title: 'Untitled Page', description: '' },
    }
    setPages((prev) => [...prev, newPage])
    setSelectedPageId(newPage.id)
    setSelectedSectionId(null)
  }, [pages.length])

  // Add a section to the selected page
  const handleAddSection = useCallback(
    (type: string, atIndex: number) => {
      if (!selectedPageId) return
      const newSection: SectionDef = {
        id: `sec-${Date.now()}`,
        type,
        order: atIndex,
        content:
          type === 'Hero'
            ? {
                heading: '',
                subheading: '',
                ctaText: '',
                ctaLink: '',
                background: false,
              }
            : type === 'Features'
              ? { features: [] }
              : type === 'Content'
                ? { text: '', image: false }
                : type === 'CTA'
                  ? {
                      heading: '',
                      description: '',
                      buttonText: '',
                      buttonLink: '',
                    }
                  : type === 'Pricing'
                    ? { plans: [] }
                    : { title: '', description: '' },
      }

      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== selectedPageId) return page
          const sections = [...page.sections]
          const updated = sections.map((s) =>
            s.order >= atIndex ? { ...s, order: s.order + 1 } : s
          )
          return { ...page, sections: [...updated, newSection] }
        })
      )
      setSelectedSectionId(newSection.id)
      setRightTab('properties')
    },
    [selectedPageId]
  )

  // Delete a section
  const handleDeleteSection = useCallback(
    (sectionId: string) => {
      if (!selectedPageId) return
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== selectedPageId) return page
          return {
            ...page,
            sections: page.sections.filter((s) => s.id !== sectionId),
          }
        })
      )
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null)
      }
    },
    [selectedPageId, selectedSectionId]
  )

  // Update section content
  const handleUpdateSection = useCallback(
    (sectionId: string, content: Record<string, any>) => {
      if (!selectedPageId) return
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== selectedPageId) return page
          return {
            ...page,
            sections: page.sections.map((s) =>
              s.id === sectionId ? { ...s, content } : s
            ),
          }
        })
      )
    },
    [selectedPageId]
  )

  // Update page SEO
  const handleUpdateSeo = useCallback(
    (seo: { title: string; description: string }) => {
      if (!selectedPageId) return
      setPages((prev) =>
        prev.map((page) =>
          page.id === selectedPageId ? { ...page, seo: { ...page.seo, ...seo } } : page
        )
      )
    },
    [selectedPageId]
  )

  // Publish / unpublish
  const handlePublish = useCallback(
    (scheduledAt?: string) => {
      if (!selectedPageId) return
      setPages((prev) =>
        prev.map((page) =>
          page.id === selectedPageId
            ? { ...page, status: scheduledAt ? 'draft' : ('published' as any) }
            : page
        )
      )
    },
    [selectedPageId]
  )

  const handleUnpublish = useCallback(
    (_reason?: string) => {
      if (!selectedPageId) return
      setPages((prev) =>
        prev.map((page) =>
          page.id === selectedPageId ? { ...page, status: 'draft' } : page
        )
      )
    },
    [selectedPageId]
  )

  // Data binding for a section
  const handleBindSection = useCallback(
    (sectionId: string, binding: { sourceType: 'entity' | 'api' | 'static'; entityId?: string; endpoint?: string; fieldMappings: Array<{ sectionField: string; sourceField: string }> }) => {
      if (!selectedPageId) return
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== selectedPageId) return page
          return {
            ...page,
            sections: page.sections.map((s) =>
              s.id === sectionId ? { ...s, dataBinding: binding } as any : s
            ),
          }
        })
      )
    },
    [selectedPageId]
  )

  const handleUnbindSection = useCallback(
    (sectionId: string) => {
      if (!selectedPageId) return
      setPages((prev) =>
        prev.map((page) => {
          if (page.id !== selectedPageId) return page
          return {
            ...page,
            sections: page.sections.map((s) => {
              if (s.id !== sectionId) return s
              const { dataBinding, ...rest } = s as any
              return rest
            }),
          }
        })
      )
    },
    [selectedPageId]
  )

  const rightTabs: { key: RightPanelTab; icon: React.ReactNode; label: string }[] = [
    { key: 'properties', icon: <FileText className="w-3 h-3" />, label: 'Props' },
    { key: 'seo', icon: <Search className="w-3 h-3" />, label: 'SEO' },
    { key: 'data', icon: <Database className="w-3 h-3" />, label: 'Data' },
    { key: 'nav', icon: <Menu className="w-3 h-3" />, label: 'Nav' },
  ]

  return (
    <div className="flex flex-col h-full" style={{ margin: 0 }}>
      <ContextBanner
        chips={[
          { label: 'Design Screens', source: 'design', color: '#3B82F6' },
          { label: 'Components', source: 'components', color: '#6366F1' },
          { label: 'Brand Tokens', source: 'brand', color: '#EC4899' },
        ]}
        missing={[]}
      />
      {/* Top toolbar — 32px, dense */}
      <div className="flex items-center justify-between h-[var(--toolbar-h)] min-h-[32px] px-2 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)] leading-none">
            Page Builder
          </span>
          <StudioHealthBadge productId={productId} studio="pages" />
          <span className="text-[10px] text-[var(--text-tertiary)] leading-none ml-1">
            {pages.length} pages
            {selectedPage ? ` / ${selectedPage.name}` : ''}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            className="tool-btn flex items-center gap-1 h-[24px] px-2 text-[10px] font-medium text-[var(--accent-text)] bg-transparent hover:bg-[var(--accent)]/10 border border-transparent hover:border-[var(--accent)]/20"
          >
            <Sparkles className="w-3 h-3" />
            AI Generate
          </button>

          <button
            onClick={() => selectedPage && setPreviewOpen(true)}
            disabled={!selectedPage}
            className="tool-btn flex items-center gap-1 h-[24px] px-2 text-[10px] font-medium text-[var(--text-secondary)] bg-transparent hover:bg-[var(--border-subtle)] border border-transparent hover:border-[var(--border-default)] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>

          <button
            onClick={() => selectedPage && setPublishModalOpen(true)}
            disabled={!selectedPage}
            className="tool-btn flex items-center gap-1 h-[24px] px-2 text-[10px] font-medium text-emerald-400 bg-transparent hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Rocket className="w-3 h-3" />
            Publish
          </button>

          <button
            onClick={handleAddPage}
            className="tool-btn flex items-center gap-1 h-[24px] px-2 text-[10px] font-medium text-[var(--bg-workspace)] bg-[var(--accent)] hover:opacity-90"
          >
            <Plus className="w-3 h-3" />
            New Page
          </button>
        </div>
      </div>

      {/* Analytics Overlay — compact */}
      <div className="px-0 border-b border-[var(--border-default)] bg-[var(--bg-workspace)]">
        <AnalyticsOverlay productId={productId} context="pages" />
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0 bg-[var(--bg-workspace)]">
        {/* Left panel: Page tree */}
        <div className="tool-panel-left w-[200px] min-w-[200px] flex-shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-surface)] overflow-y-auto">
          <PageTree
            pages={pages}
            selectedPageId={selectedPageId}
            onSelectPage={(id) => {
              setSelectedPageId(id)
              setSelectedSectionId(null)
            }}
            onAddPage={handleAddPage}
          />
        </div>

        {/* Center panel: Section editor */}
        <div className="flex-1 min-w-0 overflow-y-auto p-2 bg-[var(--bg-workspace)]">
          {selectedPage ? (
            <SectionEditor
              page={selectedPage}
              selectedSectionId={selectedSectionId}
              onSelectSection={(id) => { setSelectedSectionId(id); setRightTab('properties') }}
              onAddSection={handleAddSection}
              onDeleteSection={handleDeleteSection}
            />
          ) : pages.length === 0 ? (
            <StudioEmptyState
              title="No Pages Yet"
              description="Build pages by assembling components into sections. Define page routes, navigation, SEO metadata, and publish workflows."
              icon={<FileText className="w-6 h-6" />}
              createLabel="New Page"
              onCreate={handleAddPage}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-5 h-5 text-[var(--text-tertiary)] mb-2" />
              <p className="text-[12px] text-[var(--text-secondary)] mb-0.5">No page selected</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Select a page from the tree or create a new one
              </p>
            </div>
          )}
        </div>

        {/* Right panel: Tabbed — Properties / SEO / Data / Nav */}
        <div className="tool-panel-right w-[240px] min-w-[240px] flex-shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center border-b border-white/[0.06] px-1 shrink-0">
            {rightTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRightTab(tab.key)}
                className={`flex items-center gap-1 px-2 py-1.5 text-[10px] font-medium transition-colors border-b-2 ${
                  rightTab === tab.key
                    ? 'text-[#3B82F6] border-[#3B82F6]'
                    : 'text-[#64748B] border-transparent hover:text-[#94A3B8]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-2">
            {rightTab === 'properties' && selectedSection && selectedPage ? (
              <SectionProperties
                key={selectedSection.id}
                section={selectedSection}
                page={selectedPage}
                onUpdateSection={handleUpdateSection}
                onUpdateSeo={handleUpdateSeo}
                onClose={() => setSelectedSectionId(null)}
              />
            ) : rightTab === 'properties' && (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <FileText className="w-4 h-4 text-[var(--text-tertiary)] mb-2" />
                <p className="text-[11px] text-[var(--text-secondary)] mb-0.5">No section selected</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Click a section to edit its properties</p>
              </div>
            )}

            {rightTab === 'seo' && selectedPage && (
              <SeoPanel
                seo={selectedPage.seo as any}
                slug={selectedPage.slug}
                onUpdate={(seo) => handleUpdateSeo({ ...selectedPage.seo, ...seo } as any)}
              />
            )}

            {rightTab === 'seo' && !selectedPage && (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <Search className="w-4 h-4 text-[var(--text-tertiary)] mb-2" />
                <p className="text-[11px] text-[var(--text-secondary)]">Select a page to edit SEO</p>
              </div>
            )}

            {rightTab === 'data' && selectedSection && selectedPage && (
              <DataBindingPanel
                sectionId={selectedSection.id}
                sectionType={selectedSection.type}
                binding={(selectedSection as any).dataBinding}
                entities={entityNodes}
                onBind={(binding) => handleBindSection(selectedSection.id, binding)}
                onUnbind={() => handleUnbindSection(selectedSection.id)}
              />
            )}

            {rightTab === 'data' && !selectedSection && (
              <div className="flex flex-col items-center justify-center h-full text-center px-2">
                <Database className="w-4 h-4 text-[var(--text-tertiary)] mb-2" />
                <p className="text-[11px] text-[var(--text-secondary)] mb-0.5">No section selected</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">Select a section to bind data sources</p>
              </div>
            )}

            {rightTab === 'nav' && (
              <NavigationBuilder
                items={navItems}
                pages={pages.map((p) => ({ id: p.id, name: p.name, slug: p.slug }))}
                navType="header"
                onChange={setNavItems}
              />
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {selectedPage && (
        <PagePreview
          page={selectedPage}
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* Publish modal */}
      {selectedPage && (
        <PublishModal
          open={publishModalOpen}
          onClose={() => setPublishModalOpen(false)}
          pageName={selectedPage.name}
          currentStatus={selectedPage.status}
          seoScore={seoScore}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />
      )}
    </div>
  )
}
