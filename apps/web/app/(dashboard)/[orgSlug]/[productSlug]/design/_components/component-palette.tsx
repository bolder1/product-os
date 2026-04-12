'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Search, X, Package, LayoutTemplate, FormInput, Database, AlertCircle, Navigation as NavIcon, GripVertical } from 'lucide-react'
import { useGraphStore } from '../../../../../lib/graph-store'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface ComponentItem {
  id: string
  name: string
  category: string
  description: string
  usageCount: number
}

function nodeToItem(n: { id: string; label: string; data: Record<string, unknown> }): ComponentItem {
  return {
    id: n.id,
    name: n.label,
    category: String(n.data?.category || 'Layout'),
    description: String(n.data?.description || ''),
    usageCount: Number(n.data?.usageCount || 0),
  }
}

const catIcon: Record<string, React.ReactNode> = {
  Layout:     <LayoutTemplate className="w-3 h-3" />,
  Form:       <FormInput className="w-3 h-3" />,
  Data:       <Database className="w-3 h-3" />,
  Feedback:   <AlertCircle className="w-3 h-3" />,
  Navigation: <NavIcon className="w-3 h-3" />,
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface ComponentPaletteProps {
  productId: string
  open: boolean
  onClose: () => void
  onPlaceComponent: (componentId: string, componentName: string) => void
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function ComponentPalette({ productId, open, onClose, onPlaceComponent }: ComponentPaletteProps) {
  const allNodes = useGraphStore((s) => s.nodes)
  const [search, setSearch] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)

  const components = useMemo(() => {
    return allNodes
      .filter((n) => n.productId === productId && n.kind === 'component')
      .map(nodeToItem)
  }, [allNodes, productId])

  // Fallback mock items if graph store is empty
  const items = components.length > 0 ? components : FALLBACK_ITEMS

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
  }, [items, search])

  const grouped = useMemo(() => {
    const map: Record<string, ComponentItem[]> = {}
    for (const c of filtered) {
      ;(map[c.category] ??= []).push(c)
    }
    return map
  }, [filtered])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: -260, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -260, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute left-0 top-0 bottom-0 z-30 w-[260px] flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border-default)] shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="text-[12px] font-medium text-[var(--text-primary)]">Components</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">{items.length}</span>
            </div>
            <button onClick={onClose} className="p-0.5 rounded hover:bg-[var(--bg-elevated)] transition-colors">
              <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>
          </div>

          {/* Search */}
          <div className="px-2 py-1.5 border-b border-[var(--border-default)]">
            <div className="flex items-center gap-1.5 h-6 px-2 rounded bg-[var(--bg-elevated)] border border-[var(--border-default)]">
              <Search className="w-3 h-3 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search components…"
                className="flex-1 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {Object.keys(grouped).length === 0 && (
              <div className="px-3 py-6 text-[11px] text-[var(--text-tertiary)] text-center">
                No components match your search
              </div>
            )}

            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider select-none">
                  {catIcon[cat] ?? <Box className="w-3 h-3" />}
                  {cat}
                  <span className="ml-auto text-[9px]">{items.length}</span>
                </div>

                {items.map((comp) => (
                  <div
                    key={comp.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(comp.id)
                      e.dataTransfer.setData('text/plain', JSON.stringify({ componentId: comp.id, componentName: comp.name }))
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => onPlaceComponent(comp.id, comp.name)}
                    className={`group flex items-center gap-2 px-3 py-1.5 cursor-grab active:cursor-grabbing transition-colors ${
                      dragId === comp.id
                        ? 'bg-[var(--accent)]/10 text-[var(--accent-text)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <GripVertical className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                    <Box className="w-3 h-3 shrink-0 opacity-40" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] truncate">{comp.name}</div>
                      {comp.description && (
                        <div className="text-[9px] text-[var(--text-tertiary)] truncate">{comp.description}</div>
                      )}
                    </div>
                    <span className="text-[9px] text-[var(--text-tertiary)] shrink-0">{comp.usageCount}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-[var(--border-default)] text-[9px] text-[var(--text-tertiary)]">
            Drag or click to place on canvas
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/*  Fallback items when graph store is empty (design-time)             */
/* ------------------------------------------------------------------ */
const FALLBACK_ITEMS: ComponentItem[] = [
  { id: 'fb-1', name: 'Button', category: 'Form', description: 'Primary action button with variants', usageCount: 24 },
  { id: 'fb-2', name: 'Input', category: 'Form', description: 'Text input with label and validation', usageCount: 18 },
  { id: 'fb-3', name: 'Card', category: 'Layout', description: 'Content container with border and padding', usageCount: 15 },
  { id: 'fb-4', name: 'Avatar', category: 'Data', description: 'User avatar with fallback initials', usageCount: 12 },
  { id: 'fb-5', name: 'Badge', category: 'Feedback', description: 'Status indicator badge', usageCount: 9 },
  { id: 'fb-6', name: 'Tabs', category: 'Navigation', description: 'Tabbed navigation with active state', usageCount: 7 },
  { id: 'fb-7', name: 'Modal', category: 'Layout', description: 'Overlay dialog with backdrop', usageCount: 6 },
  { id: 'fb-8', name: 'Select', category: 'Form', description: 'Dropdown select with search', usageCount: 11 },
  { id: 'fb-9', name: 'Checkbox', category: 'Form', description: 'Checkbox with label', usageCount: 8 },
  { id: 'fb-10', name: 'DataTable', category: 'Data', description: 'Sortable data table with pagination', usageCount: 5 },
  { id: 'fb-11', name: 'Tooltip', category: 'Feedback', description: 'Hover tooltip with arrow', usageCount: 14 },
  { id: 'fb-12', name: 'Breadcrumb', category: 'Navigation', description: 'Breadcrumb trail navigation', usageCount: 3 },
]
