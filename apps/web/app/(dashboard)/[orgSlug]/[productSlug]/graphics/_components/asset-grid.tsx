'use client'

import { motion } from 'framer-motion'
import { Download, Trash2 } from 'lucide-react'
import type { GraphicAsset } from '../_data/mock-assets'

interface AssetGridProps {
  assets: GraphicAsset[]
  view: 'grid' | 'list'
  onSelect: (asset: GraphicAsset) => void
  onDelete: (id: string) => void
}

const typeBadgeColors: Record<GraphicAsset['type'], string> = {
  illustration: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  icon: 'bg-[var(--accent)]/10 text-[var(--accent)]',
  photo: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  logo: 'bg-[var(--accent)]/10 text-[var(--accent)]',
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

export function AssetGrid({ assets, view, onSelect, onDelete }: AssetGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-3">
          <span className="text-[var(--accent)] text-lg">0</span>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">No assets found</p>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {assets.map((asset) => (
          <motion.div
            key={asset.id}
            variants={itemVariants}
            onClick={() => onSelect(asset)}
            className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-colors group"
          >
            {/* Thumbnail */}
            <div
              className="w-12 h-12 rounded-lg shrink-0"
              style={{
                background: `linear-gradient(135deg, ${asset.gradient[0]}, ${asset.gradient[1]})`,
              }}
            />
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{asset.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {asset.width} x {asset.height} &middot; {asset.size}
              </p>
            </div>
            {/* Type badge */}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${typeBadgeColors[asset.type]}`}
            >
              {asset.type}
            </span>
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                }}
                className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(asset.id)
                }}
                className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  // Grid view (masonry-style with columns)
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
    >
      {assets.map((asset) => {
        // Vary aspect ratios for masonry feel
        const isWide = asset.width > asset.height
        const heightClass = isWide ? 'h-40' : 'h-56'

        return (
          <motion.div
            key={asset.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelect(asset)}
            className="break-inside-avoid rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden cursor-pointer group"
          >
            {/* Thumbnail */}
            <div
              className={`w-full ${heightClass} relative`}
              style={{
                background: `linear-gradient(135deg, ${asset.gradient[0]}, ${asset.gradient[1]})`,
              }}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(asset.id)
                  }}
                  className="p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-red-500/60 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {/* Type badge */}
              <span
                className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-sm ${typeBadgeColors[asset.type]}`}
              >
                {asset.type}
              </span>
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{asset.name}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {asset.width} x {asset.height} &middot; {asset.size}
              </p>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
