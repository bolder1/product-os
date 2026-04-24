'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Plus, Trash2, GripVertical, ChevronRight, Link2, ExternalLink } from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  pageId?: string
  href?: string
  children: NavItem[]
  order: number
}

interface NavigationBuilderProps {
  items: NavItem[]
  pages: Array<{ id: string; name: string; slug: string }>
  navType: 'header' | 'footer' | 'sidebar'
  onChange: (items: NavItem[]) => void
}

let navCounter = 0
function newNavId() {
  return `nav-${Date.now()}-${++navCounter}`
}

function NavItemRow({
  item,
  pages,
  depth,
  onUpdate,
  onDelete,
  onAddChild,
}: {
  item: NavItem
  pages: Array<{ id: string; name: string; slug: string }>
  depth: number
  onUpdate: (id: string, updates: Partial<NavItem>) => void
  onDelete: (id: string) => void
  onAddChild: (parentId: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const hasChildren = item.children.length > 0
  const linkedPage = pages.find((p) => p.id === item.pageId)

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div className="group flex items-center gap-1 py-1 px-1.5 rounded-md hover:bg-white/[0.03] transition-colors">
        <GripVertical className="w-3 h-3 text-[var(--text-tertiary)]/40 opacity-0 group-hover:opacity-100 cursor-grab shrink-0" />

        {hasChildren && (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
        {!hasChildren && <span className="w-4" />}

        {editing ? (
          <input
            autoFocus
            value={item.label}
            onChange={(e) => onUpdate(item.id, { label: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
            className="flex-1 px-1.5 py-0.5 rounded bg-white/[0.06] border border-[var(--accent)]/30 text-[11px] text-[var(--text-primary)] outline-none"
          />
        ) : (
          <span className="flex-1 text-[11px] text-[var(--text-primary)] cursor-pointer truncate" onClick={() => setEditing(true)}>
            {item.label}
          </span>
        )}

        {/* Link indicator */}
        {linkedPage && (
          <span className="text-[9px] text-[var(--text-tertiary)] truncate max-w-[60px]">{linkedPage.slug}</span>
        )}
        {item.href && !item.pageId && (
          <ExternalLink className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <select
            value={item.pageId ?? '__href__'}
            onChange={(e) => {
              if (e.target.value === '__href__') onUpdate(item.id, { pageId: undefined })
              else onUpdate(item.id, { pageId: e.target.value, href: undefined })
            }}
            className="w-16 px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-[9px] text-[var(--text-secondary)] outline-none"
          >
            <option value="__href__">Custom</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button onClick={() => onAddChild(item.id)} className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--accent)]" title="Add child">
            <Plus className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-0.5 text-[var(--text-tertiary)] hover:text-red-400" title="Remove">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Custom href field */}
      {!item.pageId && (
        <div className="ml-8 mb-1">
          <input
            type="text"
            value={item.href ?? ''}
            onChange={(e) => onUpdate(item.id, { href: e.target.value })}
            placeholder="https://... or /path"
            className="w-full px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06] text-[10px] text-[var(--text-secondary)] placeholder-[var(--text-tertiary)]/60 outline-none focus:border-[var(--accent)]/30"
          />
        </div>
      )}

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {item.children
              .sort((a, b) => a.order - b.order)
              .map((child) => (
                <NavItemRow
                  key={child.id}
                  item={child}
                  pages={pages}
                  depth={depth + 1}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                />
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function NavigationBuilder({ items, pages, navType, onChange }: NavigationBuilderProps) {
  const updateItem = useCallback(
    (id: string, updates: Partial<NavItem>) => {
      function walk(list: NavItem[]): NavItem[] {
        return list.map((item) => {
          if (item.id === id) return { ...item, ...updates }
          return { ...item, children: walk(item.children) }
        })
      }
      onChange(walk(items))
    },
    [items, onChange],
  )

  const deleteItem = useCallback(
    (id: string) => {
      function walk(list: NavItem[]): NavItem[] {
        return list.filter((item) => item.id !== id).map((item) => ({ ...item, children: walk(item.children) }))
      }
      onChange(walk(items))
    },
    [items, onChange],
  )

  const addChild = useCallback(
    (parentId: string) => {
      const newItem: NavItem = { id: newNavId(), label: 'New Item', children: [], order: 0 }
      function walk(list: NavItem[]): NavItem[] {
        return list.map((item) => {
          if (item.id === parentId) return { ...item, children: [...item.children, { ...newItem, order: item.children.length }] }
          return { ...item, children: walk(item.children) }
        })
      }
      onChange(walk(items))
    },
    [items, onChange],
  )

  const addRoot = () => {
    onChange([...items, { id: newNavId(), label: 'New Item', children: [], order: items.length }])
  }

  const typeLabels = { header: 'Header Nav', footer: 'Footer Nav', sidebar: 'Sidebar Nav' }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
          <Menu className="w-3 h-3" /> {typeLabels[navType]}
        </span>
        <span className="text-[10px] text-[var(--text-tertiary)]">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <div className="py-4 text-center text-[10px] text-[var(--text-tertiary)]/60">
          No navigation items yet
        </div>
      ) : (
        <div className="space-y-0.5">
          {items
            .sort((a, b) => a.order - b.order)
            .map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                pages={pages}
                depth={0}
                onUpdate={updateItem}
                onDelete={deleteItem}
                onAddChild={addChild}
              />
            ))}
        </div>
      )}

      <button
        onClick={addRoot}
        className="flex items-center gap-1 w-full py-1.5 rounded-md text-[10px] text-[var(--accent)] hover:bg-[var(--accent)]/5 justify-center transition-colors"
      >
        <Plus className="w-3 h-3" /> Add Item
      </button>
    </div>
  )
}
