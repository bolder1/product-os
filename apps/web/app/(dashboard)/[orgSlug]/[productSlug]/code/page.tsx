'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Code2, Play, Download, Sparkles, Search } from 'lucide-react'
import { mockFiles, buildFolderTree, type FileNode } from './_data/mock-files'
import { FileTree } from './_components/file-tree'
import { CodeViewer } from './_components/code-viewer'

export default function CodeStudioPage() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [openPaths, setOpenPaths] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const folderTree = useMemo(() => buildFolderTree(mockFiles), [])

  const activeFile = useMemo(
    () => mockFiles.find((f) => f.path === selectedPath) ?? null,
    [selectedPath]
  )

  const openFiles = useMemo(
    () => openPaths.map((p) => mockFiles.find((f) => f.path === p)).filter(Boolean) as FileNode[],
    [openPaths]
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
    [selectedPath]
  )

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/10 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-[#06B6D4]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#F1F5F9]">Code Studio</h1>
            <p className="text-xs text-[#64748B]">
              {mockFiles.length} files in project
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#06B6D4] bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/20 transition-colors">
            <Play className="w-3.5 h-3.5" />
            Generate All
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[#94A3B8] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-colors">
            <Sparkles className="w-4 h-4" />
            AI: Write Code
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left panel - File tree */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-[30%] min-w-[260px] flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden"
        >
          {/* Search */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#F1F5F9] placeholder:text-[#64748B] outline-none"
              />
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-auto p-2">
            <FileTree
              node={folderTree}
              selectedFile={selectedPath}
              onSelectFile={handleSelectFile}
            />
          </div>

          {/* Stats */}
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-[10px] text-[#64748B]">
              <span>{mockFiles.length} files</span>
              <span>{mockFiles.filter((f) => f.language === 'tsx').length} TSX / {mockFiles.filter((f) => f.language === 'ts').length} TS / {mockFiles.filter((f) => f.language === 'css').length} CSS / {mockFiles.filter((f) => f.language === 'json').length} JSON</span>
            </div>
          </div>
        </motion.div>

        {/* Right panel - Code viewer */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 flex min-w-0"
        >
          <CodeViewer
            openFiles={openFiles}
            activeFile={activeFile}
            onSelectFile={handleSelectFile}
            onCloseFile={handleCloseFile}
          />
        </motion.div>
      </div>
    </div>
  )
}
