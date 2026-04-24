'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react'
import { type FileNode, type FolderNode, getFileCount, languageConfig } from '../_data/mock-files'

interface FileTreeProps {
  node: FolderNode
  selectedFile: string | null
  onSelectFile: (path: string) => void
  depth?: number
}

function FolderItem({
  folder,
  selectedFile,
  onSelectFile,
  depth = 0,
}: {
  folder: FolderNode
  selectedFile: string | null
  onSelectFile: (path: string) => void
  depth: number
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const fileCount = getFileCount(folder)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] transition-colors group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
        </motion.div>
        {expanded ? (
          <FolderOpen className="w-4 h-4 text-[var(--accent)]" />
        ) : (
          <Folder className="w-4 h-4 text-[var(--accent)]/60" />
        )}
        <span className="flex-1 text-left truncate">{folder.name}</span>
        <span className="text-[10px] text-[var(--text-tertiary)] bg-white/[0.05] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          {fileCount}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {folder.children.map((child) => {
              if ('children' in child) {
                return (
                  <FolderItem
                    key={child.path}
                    folder={child}
                    selectedFile={selectedFile}
                    onSelectFile={onSelectFile}
                    depth={depth + 1}
                  />
                )
              }
              return (
                <FileItem
                  key={child.path}
                  file={child}
                  isSelected={selectedFile === child.path}
                  onSelect={() => onSelectFile(child.path)}
                  depth={depth + 1}
                />
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FileItem({
  file,
  isSelected,
  onSelect,
  depth,
}: {
  file: FileNode
  isSelected: boolean
  onSelect: () => void
  depth: number
}) {
  const lang = languageConfig[file.language]

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
        isSelected
          ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]'
      }`}
      style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
    >
      <FileText className="w-3.5 h-3.5" style={{ color: lang?.color ?? '#64748B' }} />
      <span className="flex-1 text-left truncate">{file.name}</span>
      <span
        className="text-[9px] font-medium px-1.5 py-0.5 rounded"
        style={{
          color: lang?.color ?? '#64748B',
          backgroundColor: `${lang?.color ?? '#64748B'}15`,
        }}
      >
        {lang?.label ?? file.language.toUpperCase()}
      </span>
    </button>
  )
}

export function FileTree({ node, selectedFile, onSelectFile, depth = 0 }: FileTreeProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {node.children.map((child, i) => {
        if ('children' in child) {
          return (
            <motion.div
              key={child.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <FolderItem
                folder={child}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                depth={depth}
              />
            </motion.div>
          )
        }
        return (
          <motion.div
            key={child.path}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
          >
            <FileItem
              file={child}
              isSelected={selectedFile === child.path}
              onSelect={() => onSelectFile(child.path)}
              depth={depth}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
