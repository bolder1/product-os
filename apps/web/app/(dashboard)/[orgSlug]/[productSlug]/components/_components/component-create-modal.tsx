'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2 } from 'lucide-react'
import { type ComponentDef, type PropDef, categories } from '../_data/mock-components'

interface ComponentCreateModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: Omit<ComponentDef, 'id' | 'usageCount'>) => void
}

interface DraftProp {
  name: string
  type: 'string' | 'number' | 'boolean' | 'enum'
  defaultValue: string
  required: boolean
  description: string
}

export function ComponentCreateModal({ open, onClose, onCreate }: ComponentCreateModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ComponentDef['category']>('Layout')
  const [description, setDescription] = useState('')
  const [variantName, setVariantName] = useState('Default')
  const [props, setProps] = useState<DraftProp[]>([])

  const handleAddProp = useCallback(() => {
    setProps((prev) => [
      ...prev,
      { name: '', type: 'string', defaultValue: '', required: false, description: '' },
    ])
  }, [])

  const handleRemoveProp = useCallback((index: number) => {
    setProps((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handlePropChange = useCallback(
    (index: number, field: keyof DraftProp, value: string | boolean) => {
      setProps((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
      )
    },
    []
  )

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate({
      name: name.trim(),
      category,
      description: description.trim(),
      props: props
        .filter((p) => p.name.trim())
        .map((p, i) => ({
          id: `p-${i}`,
          name: p.name.trim(),
          type: p.type,
          defaultValue: p.defaultValue,
          required: p.required,
          description: p.description,
        })),
      variants: [
        {
          id: `v-${Date.now()}`,
          name: variantName.trim() || 'Default',
          props: {},
        },
      ],
    })
    // Reset
    setName('')
    setCategory('Layout')
    setDescription('')
    setVariantName('Default')
    setProps([])
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0c1125] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">New Component</h3>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Component Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dropdown"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComponentDef['category'])}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c} className="bg-[#0c1125]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Describe this component..."
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors resize-none"
                  />
                </div>

                {/* Initial variant name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Initial Variant Name
                  </label>
                  <input
                    type="text"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    placeholder="Default"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50 transition-colors"
                  />
                </div>

                {/* Props */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">Props</label>
                    <button
                      onClick={handleAddProp}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Prop
                    </button>
                  </div>

                  {props.length === 0 && (
                    <p className="text-xs text-[var(--text-tertiary)] py-3 text-center border border-dashed border-white/[0.06] rounded-lg">
                      No props yet. Click "Add Prop" to start.
                    </p>
                  )}

                  <div className="space-y-2">
                    {props.map((prop, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={prop.name}
                            onChange={(e) => handlePropChange(i, 'name', e.target.value)}
                            placeholder="Prop name"
                            className="px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50"
                          />
                          <select
                            value={prop.type}
                            onChange={(e) => handlePropChange(i, 'type', e.target.value)}
                            className="px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/50"
                          >
                            <option value="string" className="bg-[#0c1125]">string</option>
                            <option value="number" className="bg-[#0c1125]">number</option>
                            <option value="boolean" className="bg-[#0c1125]">boolean</option>
                            <option value="enum" className="bg-[#0c1125]">enum</option>
                          </select>
                          <input
                            type="text"
                            value={prop.defaultValue}
                            onChange={(e) => handlePropChange(i, 'defaultValue', e.target.value)}
                            placeholder="Default value"
                            className="px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/50"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <input
                              type="checkbox"
                              checked={prop.required}
                              onChange={(e) => handlePropChange(i, 'required', e.target.checked)}
                              className="rounded accent-[var(--accent)]"
                            />
                            Required
                          </label>
                        </div>
                        <button
                          onClick={() => handleRemoveProp(i)}
                          className="p-1 rounded-md hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Create Component
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
