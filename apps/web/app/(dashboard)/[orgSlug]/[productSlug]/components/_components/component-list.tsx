'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Box, LayoutTemplate, FormInput, Database, AlertCircle, Navigation } from 'lucide-react'
import { type ComponentDef, type Category, categories, categoryColors } from '../_data/mock-components'

const categoryIcons: Record<string, React.ReactNode> = {
  Layout: <LayoutTemplate className="w-4 h-4" />,
  Form: <FormInput className="w-4 h-4" />,
  Data: <Database className="w-4 h-4" />,
  Feedback: <AlertCircle className="w-4 h-4" />,
  Navigation: <Navigation className="w-4 h-4" />,
}

interface ComponentListProps {
  components: ComponentDef[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAddNew: () => void
}

export function ComponentList({ components, selectedId, onSelect, onAddNew }: ComponentListProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('All')

  const filtered = components.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-white/[0.06]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#06B6D4]/50 transition-colors"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 p-3 border-b border-white/[0.06] overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-[#06B6D4]/15 text-[#06B6D4]'
                : 'text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.03]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence mode="popLayout">
          {filtered.map((comp, i) => (
            <motion.button
              key={comp.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              onClick={() => onSelect(comp.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors group ${
                selectedId === comp.id
                  ? 'border-l-2 border-[#06B6D4] bg-white/[0.04]'
                  : 'border-l-2 border-transparent hover:bg-white/[0.03]'
              }`}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${categoryColors[comp.category]}15` }}
              >
                <div style={{ color: categoryColors[comp.category] }}>
                  {categoryIcons[comp.category] || <Box className="w-4 h-4" />}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#F1F5F9] truncate">{comp.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[#64748B] shrink-0">
                    {comp.variants.length}v
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: `${categoryColors[comp.category]}15`,
                      color: categoryColors[comp.category],
                    }}
                  >
                    {comp.category}
                  </span>
                  <span className="text-[10px] text-[#64748B]">{comp.usageCount} uses</span>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Add component card */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={onAddNew}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-white/[0.08] hover:border-[#06B6D4]/30 hover:bg-white/[0.02] transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center">
            <Plus className="w-4 h-4 text-[#06B6D4]" />
          </div>
          <span className="text-sm text-[#64748B] group-hover:text-[#94A3B8] transition-colors">
            Add Component
          </span>
        </motion.button>
      </div>
    </div>
  )
}
