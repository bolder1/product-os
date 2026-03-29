'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EC4899]/10 flex items-center justify-center">
            <Image className="w-5 h-5 text-[#EC4899]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#F1F5F9]">Graphics Studio</h1>
            <p className="text-xs text-[#64748B]">
              {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
              {typeFilter !== 'all' ? ` (${typeFilter})` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Generate
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EC4899] text-white text-sm font-medium hover:bg-[#DB2777] transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Asset
          </motion.button>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center justify-between gap-3 flex-wrap"
      >
        {/* Type filters */}
        <div className="flex items-center gap-1">
          {typeFilters.map((filter) => {
            const isActive = typeFilter === filter.key
            const count =
              filter.key === 'all'
                ? assets.length
                : assets.filter((a) => a.type === filter.key).length
            return (
              <button
                key={filter.key}
                onClick={() => setTypeFilter(filter.key)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-[#EC4899] bg-[#EC4899]/10'
                    : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.04]'
                }`}
              >
                {filter.label}
                <span className="ml-1 text-[10px] opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-[#F1F5F9] placeholder-[#64748B] outline-none focus:border-[#EC4899]/40 w-48"
            />
          </div>
          <div className="flex items-center rounded-lg border border-white/[0.08] overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`p-1.5 transition-colors ${
                view === 'grid'
                  ? 'text-[#EC4899] bg-[#EC4899]/10'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-1.5 transition-colors ${
                view === 'list'
                  ? 'text-[#EC4899] bg-[#EC4899]/10'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Asset grid */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AssetGrid
          assets={filteredAssets}
          view={view}
          onSelect={setSelectedAsset}
          onDelete={handleDelete}
        />
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedAsset && (
          <AssetDetail
            asset={selectedAsset}
            onClose={() => setSelectedAsset(null)}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>

      {/* Upload modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}
