'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Image, Tag } from 'lucide-react'

interface UploadModalProps {
  open: boolean
  onClose: () => void
  onUpload: (data: { name: string; tags: string[] }) => void
}

export function UploadModal({ open, onClose, onUpload }: UploadModalProps) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<{ name: string; preview: boolean } | null>(null)
  const [name, setName] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFilePick = (fileName: string) => {
    const baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    setFile({ name: fileName, preview: true })
    setName(baseName)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFilePick(f.name)
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag])
    setTagInput('')
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onUpload({ name: name.trim(), tags })
    setFile(null)
    setName('')
    setTags([])
    onClose()
  }

  const resetAndClose = () => {
    setFile(null)
    setName('')
    setTags([])
    setDragOver(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={resetAndClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0B1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Upload Asset</span>
              </div>
              <button
                onClick={resetAndClose}
                className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Drop zone */}
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                    dragOver
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                      : 'border-white/[0.12] hover:border-white/[0.2] bg-white/[0.02]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                    <Image className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[var(--text-primary)]">
                      Drop file here or <span className="text-[var(--accent)]">browse</span>
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">SVG, PNG, JPG, GIF, WEBP</p>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".svg,.png,.jpg,.jpeg,.gif,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFilePick(f.name)
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[#DB2777] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{file.name}</p>
                    <p className="text-xs text-[var(--color-success)]">Ready to upload</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 rounded text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-secondary)]">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Asset name"
                  className="w-full px-3 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]/40"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <label className="text-xs text-[var(--text-secondary)]">Tags</label>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-[var(--text-secondary)]"
                    >
                      {tag}
                      <button
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        className="text-[var(--text-tertiary)] hover:text-red-400"
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
                    className="px-2 py-0.5 rounded-md bg-transparent border border-dashed border-white/[0.1] text-xs text-[var(--text-secondary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]/40 w-24"
                  />
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[#DB2777] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Upload Asset
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
