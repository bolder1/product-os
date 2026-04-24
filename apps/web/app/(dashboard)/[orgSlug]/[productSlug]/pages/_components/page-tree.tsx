'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  FileText,
  GripVertical,
  Plus,
} from 'lucide-react'
import type { PageDef } from '../_data/mock-pages'

interface PageTreeProps {
  pages: PageDef[]
  selectedPageId: string | null
  onSelectPage: (id: string) => void
  onAddPage: () => void
}

interface TreeNode {
  page: PageDef
  children: TreeNode[]
}

function buildTree(pages: PageDef[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const page of pages) {
    map.set(page.id, { page, children: [] })
  }

  for (const page of pages) {
    const node = map.get(page.id)!
    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort by order
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.page.order - b.page.order)
    nodes.forEach((n) => sortNodes(n.children))
  }
  sortNodes(roots)

  return roots
}

function TreeItem({
  node,
  depth,
  selectedPageId,
  onSelectPage,
  expandedIds,
  toggleExpanded,
}: {
  node: TreeNode
  depth: number
  selectedPageId: string | null
  onSelectPage: (id: string) => void
  expandedIds: Set<string>
  toggleExpanded: (id: string) => void
}) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.page.id)
  const isSelected = selectedPageId === node.page.id

  return (
    <>
      <motion.button
        onClick={() => onSelectPage(node.page.id)}
        className={`group flex items-center w-full px-2 py-1.5 rounded-md text-left transition-colors ${
          isSelected
            ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
            : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Drag handle */}
        <GripVertical className="w-3 h-3 mr-1 opacity-0 group-hover:opacity-40 flex-shrink-0 cursor-grab" />

        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(node.page.id)
            }}
            className="mr-1 flex-shrink-0 hover:text-[var(--text-primary)] transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </button>
        ) : (
          <span className="w-3.5 mr-1 flex-shrink-0" />
        )}

        {/* Icon */}
        <FileText className="w-3.5 h-3.5 mr-2 flex-shrink-0" />

        {/* Name */}
        <span className="text-xs font-medium truncate flex-1">
          {node.page.name}
        </span>

        {/* Status dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ml-2 ${
            node.page.status === 'published' ? 'bg-emerald-400' : 'bg-gray-500'
          }`}
        />
      </motion.button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {node.children.map((child) => (
              <TreeItem
                key={child.page.id}
                node={child}
                depth={depth + 1}
                selectedPageId={selectedPageId}
                onSelectPage={onSelectPage}
                expandedIds={expandedIds}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function PageTree({
  pages,
  selectedPageId,
  onSelectPage,
  onAddPage,
}: PageTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(pages.filter((p) => pages.some((c) => c.parentId === p.id)).map((p) => p.id))
  )

  const tree = buildTree(pages)

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)] border-r border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Sitemap
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">{pages.length} pages</span>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {tree.map((node) => (
          <TreeItem
            key={node.page.id}
            node={node}
            depth={0}
            selectedPageId={selectedPageId}
            onSelectPage={onSelectPage}
            expandedIds={expandedIds}
            toggleExpanded={toggleExpanded}
          />
        ))}
      </div>

      {/* Add page */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <button
          onClick={onAddPage}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Page
        </button>
      </div>
    </div>
  )
}
