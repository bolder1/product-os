'use client'

import { useState, useMemo } from 'react'
import { LayoutTemplate } from 'lucide-react'
import { TemplateFilters, type Category, type SortOption } from './_components/template-filters'
import { TemplateCard } from './_components/template-card'
import { TemplatePreview } from './_components/template-preview'
import { TemplateApplyWizard } from './_components/template-apply-wizard'
import { templates, type Template } from './_data/templates'

export default function TemplateGalleryPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category>('All')
  const [sort, setSort] = useState<SortOption>('Popular')
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [applyTemplate, setApplyTemplate] = useState<Template | null>(null)

  const filtered = useMemo(() => {
    let result = templates

    // Filter by category
    if (category !== 'All') {
      result = result.filter((t) => t.category === category)
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    // Sort
    switch (sort) {
      case 'Name A-Z':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'Recent':
        // Reverse order to simulate "recent"
        result = [...result].reverse()
        break
      case 'Popular':
      default:
        // Default order (by nodeCount as proxy for popularity)
        result = [...result].sort((a, b) => b.nodeCount - a.nodeCount)
        break
    }

    return result
  }, [search, category, sort])

  const handleApply = (template: Template) => {
    setPreviewTemplate(null)
    setApplyTemplate(template)
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
          <LayoutTemplate className="w-5 h-5 text-[#3B82F6]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#F1F5F9]">Template Gallery</h1>
          <p className="text-xs text-[#64748B]">Browse, preview, and apply product templates</p>
        </div>
      </div>

      {/* Filters */}
      <TemplateFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              index={i}
              onClick={() => setPreviewTemplate(template)}
            />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <LayoutTemplate className="w-6 h-6 text-[#64748B]" />
          </div>
          <p className="text-sm text-[#94A3B8]">No templates match your filters</p>
          <button
            onClick={() => {
              setSearch('')
              setCategory('All')
            }}
            className="text-xs text-[#3B82F6] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onApply={handleApply}
        />
      )}

      {/* Apply Wizard */}
      {applyTemplate && (
        <TemplateApplyWizard
          template={applyTemplate}
          onClose={() => setApplyTemplate(null)}
        />
      )}
    </div>
  )
}
