'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Sparkles, Database, ChevronDown, ChevronUp } from 'lucide-react'

interface EntityField {
  name: string
  type: string
}

interface Entity {
  id: string
  name: string
  description: string
  fields: EntityField[]
}

const fieldTypes = ['text', 'number', 'boolean', 'date', 'relation', 'enum', 'json']

const typeColors: Record<string, string> = {
  text: '#3B82F6',
  number: '#10B981',
  boolean: '#F59E0B',
  date: '#8B5CF6',
  relation: '#EC4899',
  enum: '#06B6D4',
  json: '#64748B',
}

interface StepEntitiesProps {
  entities: Entity[]
  onChange: (entities: Entity[]) => void
}

export default function StepEntities({ entities, onChange }: StepEntitiesProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [] as EntityField[],
    fieldName: '',
    fieldType: 'text',
  })

  const resetForm = () => {
    setFormData({ name: '', description: '', fields: [], fieldName: '', fieldType: 'text' })
    setShowForm(false)
    setEditingId(null)
  }

  const addField = () => {
    if (!formData.fieldName.trim()) return
    setFormData({
      ...formData,
      fields: [...formData.fields, { name: formData.fieldName.trim(), type: formData.fieldType }],
      fieldName: '',
      fieldType: 'text',
    })
  }

  const removeField = (idx: number) => {
    setFormData({ ...formData, fields: formData.fields.filter((_, i) => i !== idx) })
  }

  const saveEntity = () => {
    if (!formData.name.trim()) return
    if (editingId) {
      onChange(entities.map((e) =>
        e.id === editingId
          ? { ...e, name: formData.name.trim(), description: formData.description.trim(), fields: formData.fields }
          : e
      ))
    } else {
      const newEntity: Entity = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        fields: formData.fields,
      }
      onChange([...entities, newEntity])
    }
    resetForm()
  }

  const editEntity = (entity: Entity) => {
    setFormData({
      name: entity.name,
      description: entity.description,
      fields: [...entity.fields],
      fieldName: '',
      fieldType: 'text',
    })
    setEditingId(entity.id)
    setShowForm(true)
  }

  const removeEntity = (id: string) => {
    onChange(entities.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">What data entities exist?</h2>
        <p className="text-[#94A3B8] text-sm">
          Define your data model by listing the key entities and their fields.
        </p>
      </div>

      {/* AI Generate button */}
      <button className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/15 transition-colors">
        <Sparkles className="w-4 h-4" />
        Auto-detect from features
      </button>

      {/* Entities list */}
      <div className="space-y-3">
        <AnimatePresence>
          {entities.map((entity) => {
            const isExpanded = expandedId === entity.id
            return (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4 text-[#8B5CF6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F1F5F9]">{entity.name}</p>
                    <p className="text-xs text-[#64748B]">{entity.description || 'No description'} &middot; {entity.fields.length} fields</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entity.id)}
                      className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                    </button>
                    <button
                      onClick={() => editEntity(entity)}
                      className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors text-xs text-[#64748B] hover:text-[#94A3B8]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeEntity(entity.id)}
                      className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/[0.06] px-4 py-3"
                    >
                      <div className="space-y-1.5">
                        {entity.fields.map((field, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-[#F1F5F9] font-mono">{field.name}</span>
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{ backgroundColor: (typeColors[field.type] || '#64748B') + '15', color: typeColors[field.type] || '#64748B' }}
                            >
                              {field.type}
                            </span>
                          </div>
                        ))}
                        {entity.fields.length === 0 && <p className="text-xs text-[#64748B] italic">No fields defined</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Add Entity Form */}
      <AnimatePresence>
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/[0.03] border border-[#8B5CF6]/20 rounded-xl p-4 space-y-4"
          >
            <p className="text-sm font-medium text-[#F1F5F9]">{editingId ? 'Edit Entity' : 'New Entity'}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. User, Product, Order"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Fields */}
            <div>
              <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-2 block">Fields</label>

              {/* Existing fields */}
              <div className="space-y-1.5 mb-3">
                {formData.fields.map((field, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/[0.02] rounded-lg px-3 py-1.5">
                    <span className="text-xs text-[#F1F5F9] font-mono flex-1">{field.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: (typeColors[field.type] || '#64748B') + '15', color: typeColors[field.type] || '#64748B' }}
                    >
                      {field.type}
                    </span>
                    <button onClick={() => removeField(i)} className="p-0.5 hover:bg-white/[0.05] rounded">
                      <X className="w-3 h-3 text-[#64748B]" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add field row */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  placeholder="Field name"
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter') addField() }}
                />
                <select
                  value={formData.fieldType}
                  onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#F1F5F9] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {fieldTypes.map((t) => (
                    <option key={t} value={t} className="bg-[#0C1024] text-[#F1F5F9]">{t}</option>
                  ))}
                </select>
                <button onClick={addField} className="px-3 py-1.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors">Add</button>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={resetForm} className="px-4 py-2 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors">Cancel</button>
              <button onClick={saveEntity} className="px-4 py-2 text-xs bg-[#8B5CF6] text-white rounded-lg hover:bg-[#8B5CF6]/90 transition-colors font-medium">
                {editingId ? 'Update' : 'Add Entity'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/[0.08] rounded-xl text-sm text-[#64748B] hover:text-[#94A3B8] hover:border-[#8B5CF6]/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Entity
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
