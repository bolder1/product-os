'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useProduct } from '../layout'
import { Plus, Eye, Sparkles, FileText } from 'lucide-react'
import { mockPages, type PageDef, type SectionDef } from './_data/mock-pages'
import { useGraphStore } from '../../../../lib/graph-store'
import { PageTree } from './_components/page-tree'
import { SectionEditor } from './_components/section-editor'
import { SectionProperties } from './_components/section-properties'
import { PagePreview } from './_components/page-preview'
import { StudioHealthBadge } from '../../../../components/shared/studio-health-badge'
import { AnalyticsOverlay } from '../../../../components/shared/analytics-overlay'

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

  const selectedPage = pages.find((p) => p.id === selectedPageId) || null
  const selectedSection =
    selectedPage?.sections.find((s) => s.id === selectedSectionId) || null

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
          // Shift orders for sections at or after the insert index
          const updated = sections.map((s) =>
            s.order >= atIndex ? { ...s, order: s.order + 1 } : s
          )
          return { ...page, sections: [...updated, newSection] }
        })
      )
      setSelectedSectionId(newSection.id)
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
          page.id === selectedPageId ? { ...page, seo } : page
        )
      )
    },
    [selectedPageId]
  )

  return (
    <div className="flex flex-col h-full" style={{ margin: 0 }}>
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
              onSelectSection={setSelectedSectionId}
              onAddSection={handleAddSection}
              onDeleteSection={handleDeleteSection}
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

        {/* Right panel: Properties */}
        <div className="tool-panel-right w-[220px] min-w-[220px] flex-shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-surface)] overflow-y-auto">
          {selectedSection && selectedPage ? (
            <SectionProperties
              key={selectedSection.id}
              section={selectedSection}
              page={selectedPage}
              onUpdateSection={handleUpdateSection}
              onUpdateSeo={handleUpdateSeo}
              onClose={() => setSelectedSectionId(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-2">
              <FileText className="w-4 h-4 text-[var(--text-tertiary)] mb-2" />
              <p className="text-[11px] text-[var(--text-secondary)] mb-0.5">
                No section selected
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Click a section to edit its properties
              </p>
            </div>
          )}
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
    </div>
  )
}
