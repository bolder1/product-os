'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  File,
  Image as ImageIcon,
  Search,
  Sparkles,
  Trash2,
  ChevronRight,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Brain,
  Database,
  MessageSquare,
  Download,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useProductMemoryStore, type MemoryAsset, kindFromFilename } from '../../../../lib/product-memory-store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// R20: status tone — each processing status gets a semantic tone that
// maps to chrome class-pairs via TONE_TEXT / TONE_PILL_SOFT below.
type StatusTone = 'accent' | 'accent-text' | 'neutral' | 'warning' | 'success' | 'error'

const TONE_TEXT: Record<StatusTone, string> = {
  accent:        'text-[var(--accent)]',
  'accent-text': 'text-[var(--accent-text)]',
  neutral:       'text-[var(--text-tertiary)]',
  warning:       'text-[var(--color-warning)]',
  success:       'text-[var(--color-success)]',
  error:         'text-[var(--color-error)]',
}

const TONE_PILL_SOFT: Record<StatusTone, string> = {
  accent:        'bg-[var(--accent)]/10',
  'accent-text': 'bg-[var(--accent-muted)]',
  neutral:       'bg-white/[0.06]',
  warning:       'bg-[var(--color-warning)]/10',
  success:       'bg-[var(--color-success)]/10',
  error:         'bg-[var(--color-error)]/10',
}

const STATUS_META: Record<MemoryAsset['status'], { label: string; tone: StatusTone; icon: React.ReactNode }> = {
  uploading:  { label: 'Uploading',  tone: 'accent',       icon: <Loader2 size={12} className="animate-spin" /> },
  queued:     { label: 'Queued',     tone: 'neutral',      icon: <Clock size={12} /> },
  parsing:    { label: 'Parsing',    tone: 'warning',      icon: <Loader2 size={12} className="animate-spin" /> },
  embedding:  { label: 'Embedding',  tone: 'accent-text',  icon: <Loader2 size={12} className="animate-spin" /> },
  ready:      { label: 'Ready',      tone: 'success',      icon: <CheckCircle size={12} /> },
  failed:     { label: 'Failed',     tone: 'error',        icon: <AlertCircle size={12} /> },
}

const KIND_ICON: Record<MemoryAsset['kind'], React.ReactNode> = {
  pdf:    <FileText size={18} className="text-[var(--color-error)]" />,
  docx:   <FileText size={18} className="text-[var(--accent)]" />,
  md:     <FileText size={18} className="text-[var(--accent)]" />,
  txt:    <FileText size={18} className="text-[var(--text-tertiary)]" />,
  image:  <ImageIcon size={18} className="text-[var(--color-warning)]" />,
  other:  <File size={18} className="text-[var(--text-tertiary)]" />,
}

// ---------------------------------------------------------------------------
// Mock retrieval for demo (replaces real tRPC call when no backend)
// ---------------------------------------------------------------------------

interface RetrievalResult {
  text: string
  source: string
  score: number
}

async function mockRetrieve(query: string, assets: MemoryAsset[]): Promise<RetrievalResult[]> {
  await new Promise((r) => setTimeout(r, 1200))
  const ready = assets.filter((a) => a.status === 'ready')
  if (ready.length === 0) return []
  return ready.slice(0, 3).map((a, i) => ({
    text: `This excerpt from "${a.filename}" is relevant to your query about "${query}". The document discusses key aspects of your product that align with the context you're looking for. This is a representative chunk that would surface in a real pgvector cosine similarity search.`,
    source: a.filename,
    score: 0.92 - i * 0.07,
  }))
}

// ---------------------------------------------------------------------------
// Status pill
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: MemoryAsset['status'] }) {
  const meta = STATUS_META[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TONE_PILL_SOFT[meta.tone]} ${TONE_TEXT[meta.tone]}`}>
      {meta.icon}
      {meta.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Asset drawer
// ---------------------------------------------------------------------------

function AssetDrawer({ asset, onClose }: { asset: MemoryAsset; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="fixed right-0 top-0 bottom-0 w-[420px] z-50 border-l border-white/[0.08] bg-[var(--bg-surface-raised)] flex flex-col"
      style={{ boxShadow: '-24px 0 64px rgba(0,0,0,0.5)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          {KIND_ICON[asset.kind]}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[260px]">{asset.filename}</p>
            <p className="text-xs text-[var(--text-tertiary)]">{formatBytes(asset.size)} · {timeAgo(asset.createdAt)}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-tertiary)]">Status</span>
          <StatusPill status={asset.status} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Chunks', value: asset.status === 'ready' ? Math.floor(asset.size / 800) : '—' },
            { label: 'Tokens', value: asset.status === 'ready' ? `~${(asset.size / 4).toFixed(0)}` : '—' },
            { label: 'Kind', value: asset.kind.toUpperCase() },
            { label: 'Size', value: formatBytes(asset.size) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
              <p className="text-[10px] text-[var(--text-tertiary)] mb-0.5">{label}</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </div>

        {/* Sample chunks */}
        {asset.status === 'ready' && (
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-2 font-medium uppercase tracking-wide">Sample Chunks</p>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-1">Chunk {i}</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    This is a representative text chunk from {asset.filename}, demonstrating how your document
                    has been split into searchable segments for vector retrieval. Each chunk overlaps slightly
                    with its neighbours for better context preservation.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Used in */}
        {asset.status === 'ready' && (
          <div>
            <p className="text-xs text-[var(--text-tertiary)] mb-2 font-medium uppercase tracking-wide">Used In</p>
            <div className="flex flex-col gap-1.5">
              {['Plan Mode intake', 'Brand Voice generation', 'Onboarding summary'].map((use) => (
                <div key={use} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Sparkles size={11} className="text-[var(--accent)]" />
                  {use}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-white/[0.08] flex gap-2">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-white/[0.08] text-[var(--text-secondary)] hover:bg-white/[0.04] transition-colors">
          <Download size={13} />
          Download
        </button>
        <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-error)]/30 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
          <Trash2 size={13} />
          Delete
        </button>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Ask memory panel
// ---------------------------------------------------------------------------

function AskMemoryPanel({ assets }: { assets: MemoryAsset[] }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<RetrievalResult[] | null>(null)

  async function handleAsk() {
    if (!query.trim()) return
    setLoading(true)
    setResults(null)
    const r = await mockRetrieve(query, assets)
    setResults(r)
    setLoading(false)
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center">
          <Brain size={14} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Ask Your Memory</p>
          <p className="text-xs text-[var(--text-tertiary)]">Retrieves relevant chunks · summarised with citations</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="What does this product do? Who are the target users?"
          className="flex-1 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 transition"
        />
        <button
          onClick={handleAsk}
          disabled={!query.trim() || loading}
          className={`px-4 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            query.trim() && !loading
              ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]'
              : 'bg-white/[0.06] text-[var(--text-tertiary)] cursor-not-allowed'
          }`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Ask
        </button>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 text-xs text-[var(--text-tertiary)]"
          >
            <Loader2 size={13} className="animate-spin text-[var(--accent)]" />
            Searching embeddings · assembling answer…
          </motion.div>
        )}

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex flex-col gap-3"
          >
            {results.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No relevant chunks found. Try uploading more documents.</p>
            ) : (
              <>
                {/* AI summary */}
                <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/05 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} className="text-[var(--accent)]" />
                    <span className="text-[10px] font-semibold text-[var(--accent)] uppercase tracking-wide">AI Summary</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Based on your uploaded documents, {results.map((r) => `"${r.source}"`).join(', ')} contain
                    relevant information about "{query}". The documents collectively describe your product's core
                    value proposition, target audience, and key capabilities.
                  </p>
                </div>

                {/* Citation chips */}
                <div className="flex flex-col gap-2">
                  {results.map((r, i) => (
                    <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-[var(--accent)]">{r.source}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">{(r.score * 100).toFixed(0)}% match</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">{r.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drop zone
// ---------------------------------------------------------------------------

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }, [onFiles])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 py-10 px-6 ${
        dragging
          ? 'border-[var(--accent)]/60 bg-[var(--accent)]/08'
          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.03]'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.md,.txt,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => { if (e.target.files) onFiles(Array.from(e.target.files)) }}
      />
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
        dragging ? 'bg-[var(--accent)]/20' : 'bg-white/[0.04]'
      }`}>
        <Upload size={22} className={dragging ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">Drop files here or click to browse</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">PDF, DOCX, MD, TXT, Images · Max 50 MB each</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {['PDF', 'DOCX', 'MD', 'TXT', 'PNG', 'JPG'].map((ext) => (
          <span key={ext} className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-[var(--text-tertiary)] font-mono">
            .{ext.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MemoryPage() {
  const { assets, addAsset, removeAsset } = useProductMemoryStore(useShallow((s) => s))
  const [selectedAsset, setSelectedAsset] = useState<MemoryAsset | null>(null)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'files' | 'ask'>('files')

  const productAssets = assets // In real app, filter by productId

  const filtered = (productAssets as MemoryAsset[]).filter((a: MemoryAsset) =>
    a.filename.toLowerCase().includes(search.toLowerCase())
  )

  const readyCount = (productAssets as MemoryAsset[]).filter((a: MemoryAsset) => a.status === 'ready').length
  const processingCount = (productAssets as MemoryAsset[]).filter((a: MemoryAsset) => ['uploading', 'queued', 'parsing', 'embedding'].includes(a.status)).length

  function handleFiles(files: File[]) {
    files.forEach((file) => {
      const asset: MemoryAsset = {
        id: crypto.randomUUID(),
        filename: file.name,
        kind: kindFromFilename(file.name),
        size: file.size,
        status: 'queued',
        tags: [],
        createdAt: new Date().toISOString(),
        productId: 'current',
      }
      addAsset(asset)

      // Simulate status progression
      setTimeout(() => {
        useProductMemoryStore.getState().updateAsset(asset.id, { status: 'parsing' })
      }, 800)
      setTimeout(() => {
        useProductMemoryStore.getState().updateAsset(asset.id, { status: 'embedding' })
      }, 2200)
      setTimeout(() => {
        useProductMemoryStore.getState().updateAsset(asset.id, { status: 'ready' })
      }, 4000)
    })
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center">
            <Database size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[var(--text-primary)]">Product Memory</h1>
            <p className="text-xs text-[var(--text-tertiary)]">Upload docs · AI retrieves relevant context across studios</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-[var(--text-tertiary)]">Ready</p>
            <p className="text-sm font-semibold text-[var(--color-success)]">{readyCount}</p>
          </div>
          {processingCount > 0 && (
            <div className="text-right">
              <p className="text-xs text-[var(--text-tertiary)]">Processing</p>
              <p className="text-sm font-semibold text-[var(--color-warning)]">{processingCount}</p>
            </div>
          )}
          <div className="text-right">
            <p className="text-xs text-[var(--text-tertiary)]">Total</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{productAssets.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 pt-4 gap-1">
        {(['files', 'ask'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white/[0.06] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {t === 'files' ? <Database size={14} /> : <MessageSquare size={14} />}
            {t === 'files' ? 'Files' : 'Ask Memory'}
            {t === 'files' && productAssets.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[10px] text-[var(--text-secondary)]">
                {productAssets.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tab === 'files' && (
          <div className="flex flex-col gap-4 max-w-3xl">
            {/* Drop zone */}
            <DropZone onFiles={handleFiles} />

            {/* Search */}
            {productAssets.length > 0 && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search files…"
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-white/[0.14] focus:outline-none transition"
                />
              </div>
            )}

            {/* Asset list */}
            <AnimatePresence>
              {filtered.length === 0 && productAssets.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <p className="text-sm text-[var(--text-tertiary)]">No files yet. Drop your product docs above to get started.</p>
                </motion.div>
              )}

              {filtered.map((asset) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedAsset(asset)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10] cursor-pointer transition-all group"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                    {KIND_ICON[asset.kind]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{asset.filename}</p>
                      <StatusPill status={asset.status} />
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {formatBytes(asset.size)} · {timeAgo(asset.createdAt)}
                    </p>
                  </div>

                  {/* Progress bar for processing states */}
                  {['parsing', 'embedding'].includes(asset.status) && (
                    <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-[var(--accent)]"
                        animate={{ width: ['20%', '85%', '20%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); removeAsset(asset.id) }}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)]">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty search state */}
            {filtered.length === 0 && productAssets.length > 0 && (
              <p className="text-sm text-[var(--text-tertiary)] text-center py-4">No files match "{search}"</p>
            )}
          </div>
        )}

        {tab === 'ask' && (
          <div className="max-w-3xl">
            {(productAssets as MemoryAsset[]).filter((a: MemoryAsset) => a.status === 'ready').length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
                <Database size={32} className="text-[var(--text-tertiary)] mx-auto mb-3" />
                <p className="text-sm font-medium text-[var(--text-primary)] mb-1">No documents ready yet</p>
                <p className="text-xs text-[var(--text-tertiary)]">Upload and process at least one document on the Files tab, then come back to ask questions.</p>
                <button
                  onClick={() => setTab('files')}
                  className="mt-4 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent)] transition-colors"
                >
                  Go to Files
                </button>
              </div>
            ) : (
              <AskMemoryPanel assets={productAssets} />
            )}
          </div>
        )}
      </div>

      {/* Asset drawer */}
      <AnimatePresence>
        {selectedAsset && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setSelectedAsset(null)}
            />
            <AssetDrawer asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
