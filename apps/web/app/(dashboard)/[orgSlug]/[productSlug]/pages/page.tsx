'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Eye, Sparkles, FileText } from 'lucide-react'
import { mockPages, type PageDef, type SectionDef } from './_data/mock-pages'
import { useGraphStore } from '../../../../lib/graph-store'
import { PageTree } from './_components/page-tree'
import { SectionEditor } from './_components/section-editor'
import { SectionProperties } from './_components/section-properties'
import { PagePreview } from './_components/page-preview'

export default function PageBuilderPage() {
  const params = useParams<{ productSlug: string }>()
  const productId = params.productSlug

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
    <div className="flex flex-col h-full -m-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#060918]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
            <FileText className="w-4.5 h-4.5 text-[#3B82F6]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">
              Page Builder
            </h1>
            <p className="text-xs text-[#64748B]">
              {pages.length} pages
              {selectedPage ? ` \u00B7 Editing: ${selectedPage.name}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Generate */}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#8B5CF6] bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI Generate
          </button>

          {/* Preview */}
          <button
            onClick={() => selectedPage && setPreviewOpen(true)}
            disabled={!selectedPage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#94A3B8] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>

          {/* New Page */}
          <button
            onClick={handleAddPage}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Page
          </button>
        </div>
      </div>

      {/* Three-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: Page tree (~20%) */}
        <div className="w-[20%] min-w-[200px] flex-shrink-0">
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

        {/* Center panel: Section editor (~55%) */}
        <div className="flex-1 min-w-0 overflow-y-auto p-5 border-r border-white/[0.06]">
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
              <div className="w-14 h-14 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-[#64748B]" />
              </div>
              <p className="text-sm text-[#94A3B8] mb-1">No page selected</p>
              <p className="text-xs text-[#64748B]">
                Select a page from the tree or create a new one
              </p>
            </div>
          )}
        </div>

        {/* Right panel: Properties (~25%) */}
        <div className="w-[25%] min-w-[260px] flex-shrink-0 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
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
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-3">
                  <FileText className="w-6 h-6 text-[#64748B]" />
                </div>
                <p className="text-sm text-[#94A3B8] mb-1">
                  No section selected
                </p>
                <p className="text-xs text-[#64748B]">
                  Click a section to edit its properties
                </p>
              </motion.div>
            )}
          </AnimatePresence>
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
