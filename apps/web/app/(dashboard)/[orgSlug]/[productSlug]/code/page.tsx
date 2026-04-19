'use client'

import { useState, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Code2, Play, Download, Search, Sparkles, PanelRight } from 'lucide-react'
import { mockFiles, buildFolderTree, type FileNode } from './_data/mock-files'
import { FileTree } from './_components/file-tree'
import { CodeViewer } from './_components/code-viewer'
import { useProduct } from '../layout'
import { useCodeStore } from '../../../../lib/code-store'
import { useAuthStore } from '../../../../lib/auth-store'
import { eventBus, makeActor } from '../../../../lib/event-bus'
import { outputPipeline } from '../../../../lib/output-pipeline'
import { AIActionBar } from '../../../../components/primitives/ai-action-bar'
import { ExportMenu } from '../../../../components/primitives/export-menu'
import { ScaffoldPanel } from './_components/scaffold-panel'

export default function CodeStudioPage() {
  const params = useParams<{ productSlug: string }>()
  const product = useProduct()
  const productId = product?.id ?? params.productSlug

  const modules = useCodeStore((s) => s.modules)
  const storeSearch = useCodeStore((s) => s.search)
  const setStoreSearch = useCodeStore((s) => s.setSearch)

  const productModules = useMemo(
    () => modules.filter((m) => m.productId === productId),
    [modules, productId],
  )

  /**
   * Flatten files across all modules for the active product. If the product
   * has no persisted modules yet we fall back to the mock project so the
   * studio still reads as a working reference.
   */
  const files: FileNode[] = useMemo(() => {
    if (productModules.length === 0) return mockFiles
    const all: FileNode[] = []
    for (const m of productModules) {
      for (const f of m.files ?? []) {
        all.push({
          path: f.path,
          name: f.name,
          language: (f.language as FileNode['language']) ?? 'ts',
          content: f.content,
          folder: f.folder,
        })
      }
    }
    return all
  }, [productModules])

  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [openPaths, setOpenPaths] = useState<string[]>([])
  const [showScaffold, setShowScaffold] = useState(true)

  const folderTree = useMemo(() => buildFolderTree(files), [files])

  const activeFile = useMemo(
    () => files.find((f) => f.path === selectedPath) ?? null,
    [files, selectedPath],
  )

  const openFiles = useMemo(
    () =>
      openPaths
        .map((p) => files.find((f) => f.path === p))
        .filter(Boolean) as FileNode[],
    [openPaths, files],
  )

  const handleSelectFile = useCallback((path: string) => {
    setSelectedPath(path)
    setOpenPaths((prev) => (prev.includes(path) ? prev : [...prev, path]))
  }, [])

  const handleCloseFile = useCallback(
    (path: string) => {
      setOpenPaths((prev) => {
        const next = prev.filter((p) => p !== path)
        if (selectedPath === path) {
          setSelectedPath(next.length > 0 ? next[next.length - 1] : null)
        }
        return next
      })
    },
    [selectedPath],
  )

  const isLive = productModules.length > 0

  const userId = useAuthStore((s) => s.user?.id ?? 'anon')
  const userName = useAuthStore((s) => s.user?.name ?? 'Unknown')

  const handleGenerateAll = useCallback(() => {
    eventBus.emit({
      type: 'engineer.code.generated',
      productId,
      componentId: 'all',
      filePath: 'generated/',
      actor: makeActor(userId, userName),
    })
  }, [productId, userId, userName])

  const handleExport = useCallback(async (format: string) => {
    const content = activeFile?.content ?? files.map((f) => `// ${f.path}\n${f.content}`).join('\n\n')
    await outputPipeline.download(format as any, {
      label: activeFile?.name ?? `${productId}-code`,
      markdownContent: content,
      productId,
    })
  }, [activeFile, files, productId])

  return (
    <div className="flex flex-col h-full bg-[var(--bg-workspace)]">
      {/* Toolbar */}
      <div className="h-[var(--toolbar-h)] flex items-center justify-between px-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span className="text-[13px] font-medium text-[var(--text-primary)]">Code Studio</span>
          <span className="text-[10px] text-[var(--text-tertiary)] ml-1">
            {files.length} file{files.length === 1 ? '' : 's'}
            {isLive ? (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent-text)]">
                live
              </span>
            ) : (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-tertiary)]">
                sample
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={handleGenerateAll} className="tool-btn flex items-center gap-1.5 text-[var(--accent-text)]">
            <Play className="w-3 h-3" />
            <span className="text-[11px]">Generate All</span>
          </button>
          <ExportMenu formats={['tsx', 'markdown']} onExport={handleExport} compact />
          <button
            onClick={() => setShowScaffold((v) => !v)}
            className={`tool-btn flex items-center gap-1.5 ${showScaffold ? 'text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}
            title="Toggle scaffold panel"
          >
            <Sparkles className="w-3 h-3" />
            <span className="text-[11px]">Scaffold</span>
          </button>
          <AIActionBar workspace="engineer" productId={productId} compact />
        </div>
      </div>

      {/* Main content — two-panel */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel — File tree, 240px */}
        <div className="w-[240px] shrink-0 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)]">
          {/* Search */}
          <div className="px-2 py-2 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-workspace)] border border-[var(--border-default)] rounded-[var(--radius-sm)]">
              <Search className="w-3 h-3 text-[var(--text-tertiary)]" />
              <input
                type="text"
                placeholder="Search files..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                className="tool-input flex-1 bg-transparent border-none p-0 text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
              />
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-auto px-1 py-1">
            <FileTree
              node={folderTree}
              selectedFile={selectedPath}
              onSelectFile={handleSelectFile}
            />
          </div>

          {/* Stats footer */}
          <div className="px-3 py-1.5 border-t border-[var(--border-default)]">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
              <span>{files.length} files</span>
              <span>
                {files.filter((f) => f.language === 'tsx').length} TSX
                {' / '}
                {files.filter((f) => f.language === 'ts').length} TS
                {' / '}
                {files.filter((f) => f.language === 'css').length} CSS
                {' / '}
                {files.filter((f) => f.language === 'json').length} JSON
              </span>
            </div>
          </div>
        </div>

        {/* Center panel — Code viewer */}
        <div className="flex-1 flex min-w-0 bg-[var(--bg-workspace)]">
          <CodeViewer
            openFiles={openFiles}
            activeFile={activeFile}
            onSelectFile={handleSelectFile}
            onCloseFile={handleCloseFile}
          />
        </div>

        {/* Right panel — Scaffold */}
        {showScaffold && (
          <div
            className="w-[220px] shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col overflow-hidden"
            style={{ animation: 'slideInRight 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <ScaffoldPanel productId={productId} />
          </div>
        )}
      </div>
    </div>
  )
}
