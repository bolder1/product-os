'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Trash2, Calendar, Layers, Tag } from 'lucide-react'
import type { GraphicAsset } from '../_data/mock-assets'

interface AssetDetailProps {
  asset: GraphicAsset
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, changes: Partial<GraphicAsset>) => void
}

export function AssetDetail({ asset, onClose, onDelete, onUpdate }: AssetDetailProps) {
  const [name, setName] = useState(asset.name)
  const [tagInput, setTagInput] = useState('')

  const handleNameBlur = () => {
    if (name !== asset.name) {
      onUpdate(asset.id, { name })
    }
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !asset.tags.includes(tag)) {
      onUpdate(asset.id, { tags: [...asset.tags, tag] })
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    onUpdate(asset.id, { tags: asset.tags.filter((t) => t !== tag) })
  }

  const formattedDate = new Date(asset.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0B1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Preview */}
        <div
          className="w-full h-64 relative"
          style={{
            background: `linear-gradient(135deg, ${asset.gradient[0]}, ${asset.gradient[1]})`,
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-lg bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            className="w-full text-lg font-semibold text-[#F1F5F9] bg-transparent border-none outline-none focus:ring-0 placeholder-[#64748B]"
            placeholder="Asset name"
          />

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[#64748B]">Dimensions</span>
              <p className="text-sm text-[#F1F5F9]">
                {asset.width} x {asset.height}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[#64748B]">Format</span>
              <p className="text-sm text-[#F1F5F9] capitalize">{asset.type}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[#64748B]">Size</span>
              <p className="text-sm text-[#F1F5F9]">{asset.size}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#64748B]" />
                <span className="text-[10px] uppercase tracking-wider text-[#64748B]">Created</span>
              </div>
              <p className="text-sm text-[#F1F5F9]">{formattedDate}</p>
            </div>
          </div>

          {/* Used in */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-xs text-[#64748B]">Used in</span>
            </div>
            <p className="text-sm text-[#94A3B8]">3 pages, 1 component</p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="text-xs text-[#64748B]">Tags</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {asset.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-[#94A3B8]"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[#64748B] hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="px-2 py-0.5 rounded-md bg-transparent border border-dashed border-white/[0.1] text-xs text-[#94A3B8] placeholder-[#64748B] outline-none focus:border-[#EC4899]/40 w-24"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EC4899] text-white text-sm font-medium hover:bg-[#DB2777] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onDelete(asset.id)
                onClose()
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
