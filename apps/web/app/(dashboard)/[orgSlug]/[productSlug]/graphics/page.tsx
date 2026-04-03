'use client'

import { useState, useMemo, useCallback } from 'react'
import { Image, Upload, Sparkles, Search, LayoutGrid, List } from 'lucide-react'
import { type GraphicAsset, mockAssets } from './_data/mock-assets'
import { AssetGrid } from './_components/asset-grid'
import { AssetDetail } from './_components/asset-detail'
import { UploadModal } from './_components/upload-modal'

type AssetType = 'all' | GraphicAsset['type']

const typeFilters: { key: AssetType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'illustration', label: 'Illustrations' },
  { key: 'icon', label: 'Icons' },
  { key: 'photo', label: 'Photos' },
  { key: 'logo', label: 'Logos' },
]

export default function GraphicsStudioPage() {
  const [assets, setAssets] = useState<GraphicAsset[]>(mockAssets)
  const [selectedAsset, setSelectedAsset] = useState<GraphicAsset | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AssetType>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filteredAssets = useMemo(() => {
    let result = assets
    if (typeFilter !== 'all') {
      result = result.filter((a) => a.type === typeFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.tags.some((t) => t.includes(q))
      )
    }
    return result
  }, [assets, typeFilter, search])

  const handleDelete = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const handleUpdate = useCallback((id: string, changes: Partial<GraphicAsset>) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)))
    setSelectedAsset((prev) => (prev && prev.id === id ? { ...prev, ...changes } : prev))
  }, [])

  const handleUpload = useCallback((data: { name: string; tags: string[] }) => {
    const newAsset: GraphicAsset = {
      id: `asset-${Date.now()}`,
      name: data.name,
      type: 'illustration',
      width: 1200,
      height: 800,
      size: '1.2 MB',
      gradient: ['#EC4899', '#DB2777'],
      tags: data.tags,
      createdAt: new Date().toISOString(),
    }
    setAssets((prev) => [newAsset, ...prev])
  }, [])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* Toolbar */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <Image className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Graphics Studio</span>
          <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
            {typeFilter !== 'all' ? ` (${typeFilter})` : ''}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button className="tool-btn flex items-center gap-1.5 text-[var(--accent-text)]">
            <Sparkles className="w-3 h-3" />
            <span className="text-[11px]">AI Generate</span>
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="tool-btn-primary flex items-center gap-1.5"
          >
            <Upload className="w-3 h-3" />
            <span className="text-[11px]">Upload Asset</span>
          </button>
        </div>
      </div>

      {/* Filter bar — search, type tabs, view toggle */}
      <div className="h-[var(--toolbar-h)] flex items-center gap-2 px-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        {/* Type filters */}
        <div className="tool-tabs flex items-center">
          {typeFilters.map((f) => {
            const isActive = typeFilter === f.key
            const count =
              f.key === 'all'
                ? assets.length
                : assets.filter((a) => a.type === f.key).length
            return (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className={`tool-tab px-2.5 py-1 text-[11px] ${isActive ? 'active' : ''}`}
              >
                {f.label}
                <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-workspace)] border border-[var(--border-default)] rounded-[var(--radius-sm)] w-44">
          <Search className="w-3 h-3 text-[var(--text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="tool-input flex-1 bg-transparent border-none p-0 text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center border border-[var(--border-default)] rounded-[var(--radius-sm)] overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`p-1 transition-colors ${
              view === 'grid'
                ? 'text-[var(--accent-text)] bg-[var(--accent)]/10'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-1 transition-colors ${
              view === 'list'
                ? 'text-[var(--accent-text)] bg-[var(--accent)]/10'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <List className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Asset grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <AssetGrid
          assets={filteredAssets}
          view={view}
          onSelect={setSelectedAsset}
          onDelete={handleDelete}
        />
      </div>

      {/* Detail modal */}
      {selectedAsset && (
        <AssetDetail
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}

      {/* Upload modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}
