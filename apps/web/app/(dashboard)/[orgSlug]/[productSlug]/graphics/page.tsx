'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Image, Upload, Search, LayoutGrid, List } from 'lucide-react'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { type GraphicAsset as MockAsset, mockAssets } from './_data/mock-assets'
import { AssetGrid } from './_components/asset-grid'
import { AssetDetail } from './_components/asset-detail'
import { UploadModal } from './_components/upload-modal'
import { useProduct } from '../layout'
import {
  useGraphicsStore,
  type GraphicAsset as StoreAsset,
  type AssetType,
} from '../../../../lib/graphics-store'
import { trpc } from '../../../../lib/trpc'

type FilterType = 'all' | MockAsset['type']

const typeFilters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'illustration', label: 'Illustrations' },
  { key: 'icon', label: 'Icons' },
  { key: 'photo', label: 'Photos' },
  { key: 'logo', label: 'Logos' },
]

/**
 * The mock UI only understands four asset types. Collapse
 * 'animation' and 'diagram' onto 'illustration' so they still render.
 */
function toUiType(t: AssetType): MockAsset['type'] {
  if (t === 'animation' || t === 'diagram') return 'illustration'
  return t
}

/** Map a persisted store asset into the dense shape the mock UI expects. */
function toMockAsset(a: StoreAsset): MockAsset {
  return {
    id: a.id,
    name: a.label,
    type: toUiType(a.type),
    width: a.width ?? 1200,
    height: a.height ?? 800,
    size: a.size ?? '—',
    gradient: a.gradient ?? ['#EC4899', '#DB2777'],
    tags: a.tags ?? [],
    createdAt: a.createdAt ?? new Date().toISOString(),
  }
}

export default function GraphicsStudioPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  // Store state — persistable UI prefs + hydrated assets
  const storeAssets = useGraphicsStore((s) => s.assets)
  const typeFilter = useGraphicsStore((s) => s.typeFilter) as FilterType
  const setTypeFilter = useGraphicsStore((s) => s.setTypeFilter)
  const search = useGraphicsStore((s) => s.search)
  const setSearch = useGraphicsStore((s) => s.setSearch)
  const view = useGraphicsStore((s) => s.view)
  const setView = useGraphicsStore((s) => s.setView)
  const uploadOpen = useGraphicsStore((s) => s.uploadOpen)
  const setUploadOpen = useGraphicsStore((s) => s.setUploadOpen)

  // Local selection for the detail modal (doesn't need to persist)
  const [selectedAsset, setSelectedAsset] = useState<MockAsset | null>(null)

  const productAssets = useMemo(
    () => storeAssets.filter((a) => a.productId === productId),
    [storeAssets, productId],
  )
  const isLive = productAssets.length > 0

  const assets: MockAsset[] = isLive
    ? productAssets.map(toMockAsset)
    : mockAssets

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
          a.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    return result
  }, [assets, typeFilter, search])

  /* ---------- tRPC mutations ------------------------------------- */
  const utils = trpc.useUtils()
  const createMutation = trpc.graphics.create.useMutation({
    onSuccess: () => {
      utils.graphics.list.invalidate()
    },
  })
  const updateMutation = trpc.graphics.update.useMutation({
    onSuccess: () => {
      utils.graphics.list.invalidate()
    },
  })
  const deleteMutation = trpc.graphics.delete.useMutation({
    onSuccess: () => {
      utils.graphics.list.invalidate()
    },
  })

  const handleUpload = (data: { name: string; tags: string[] }) => {
    if (!productId) return
    createMutation.mutate({
      productId,
      label: data.name,
      asset: {
        type: 'illustration',
        width: 1200,
        height: 800,
        size: '1.2 MB',
        gradient: ['#EC4899', '#DB2777'],
        tags: data.tags,
      },
    })
  }

  const handleDelete = (id: string) => {
    // When viewing mock data, a delete only makes sense against live rows
    if (!isLive) return
    deleteMutation.mutate({ id })
    setSelectedAsset((prev) => (prev?.id === id ? null : prev))
  }

  const handleUpdate = (id: string, changes: Partial<MockAsset>) => {
    if (!isLive) {
      setSelectedAsset((prev) => (prev && prev.id === id ? { ...prev, ...changes } : prev))
      return
    }
    updateMutation.mutate({
      id,
      label: changes.name,
      asset: {
        tags: changes.tags,
        width: changes.width,
        height: changes.height,
        size: changes.size,
        gradient: changes.gradient,
      },
    })
    setSelectedAsset((prev) => (prev && prev.id === id ? { ...prev, ...changes } : prev))
  }

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
          {isLive ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)]">
              live
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
              sample
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <AIActionBar workspace="design" productId={productId} compact />
          <button
            onClick={() => setUploadOpen(true)}
            disabled={createMutation.isPending}
            className="tool-btn-primary flex items-center gap-1.5"
          >
            <Upload className="w-3 h-3" />
            <span className="text-[11px]">
              {createMutation.isPending ? 'Uploading…' : 'Upload Asset'}
            </span>
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
