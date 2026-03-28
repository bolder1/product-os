'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, User, ChevronDown, ChevronUp } from 'lucide-react'

interface Persona {
  id: string
  name: string
  role: string
  painPoints: string[]
  needs: string[]
}

interface StepAudienceProps {
  personas: Persona[]
  onChange: (personas: Persona[]) => void
}

export default function StepAudience({ personas, onChange }: StepAudienceProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', role: '', painPoint: '', need: '', painPoints: [] as string[], needs: [] as string[] })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const resetForm = () => {
    setFormData({ name: '', role: '', painPoint: '', need: '', painPoints: [], needs: [] })
    setShowForm(false)
    setEditingId(null)
  }

  const addPainPoint = () => {
    if (!formData.painPoint.trim()) return
    setFormData({ ...formData, painPoints: [...formData.painPoints, formData.painPoint.trim()], painPoint: '' })
  }

  const removePainPoint = (idx: number) => {
    setFormData({ ...formData, painPoints: formData.painPoints.filter((_, i) => i !== idx) })
  }

  const addNeed = () => {
    if (!formData.need.trim()) return
    setFormData({ ...formData, needs: [...formData.needs, formData.need.trim()], need: '' })
  }

  const removeNeed = (idx: number) => {
    setFormData({ ...formData, needs: formData.needs.filter((_, i) => i !== idx) })
  }

  const savePersona = () => {
    if (!formData.name.trim() || !formData.role.trim()) return
    if (editingId) {
      onChange(personas.map((p) => p.id === editingId ? { ...p, name: formData.name.trim(), role: formData.role.trim(), painPoints: formData.painPoints, needs: formData.needs } : p))
    } else {
      const newPersona: Persona = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        role: formData.role.trim(),
        painPoints: formData.painPoints,
        needs: formData.needs,
      }
      onChange([...personas, newPersona])
    }
    resetForm()
  }

  const editPersona = (persona: Persona) => {
    setFormData({ name: persona.name, role: persona.role, painPoint: '', need: '', painPoints: [...persona.painPoints], needs: [...persona.needs] })
    setEditingId(persona.id)
    setShowForm(true)
  }

  const removePersona = (id: string) => {
    onChange(personas.filter((p) => p.id !== id))
  }

  const avatarColors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#F43F5E']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Who are your users?</h2>
        <p className="text-[#94A3B8] text-sm">
          Define your user personas to understand who you are building for, their pain points, and needs.
        </p>
      </div>

      {/* Personas list */}
      <div className="space-y-3">
        <AnimatePresence>
          {personas.map((persona, index) => {
            const color = avatarColors[index % avatarColors.length]
            const isExpanded = expandedId === persona.id
            return (
              <motion.div
                key={persona.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {persona.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F1F5F9]">{persona.name}</p>
                    <p className="text-xs text-[#64748B]">{persona.role}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : persona.id)}
                      className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                    </button>
                    <button
                      onClick={() => editPersona(persona)}
                      className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors text-xs text-[#64748B] hover:text-[#94A3B8]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removePersona(persona.id)}
                      className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/[0.06] px-4 py-3"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">Pain Points</p>
                          <ul className="space-y-1">
                            {persona.painPoints.map((pp, i) => (
                              <li key={i} className="text-xs text-[#F43F5E]/80 flex items-start gap-1.5">
                                <span className="mt-1 w-1 h-1 rounded-full bg-[#F43F5E]/60 flex-shrink-0" />
                                {pp}
                              </li>
                            ))}
                            {persona.painPoints.length === 0 && <li className="text-xs text-[#64748B] italic">None added</li>}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1.5">Needs</p>
                          <ul className="space-y-1">
                            {persona.needs.map((n, i) => (
                              <li key={i} className="text-xs text-[#10B981]/80 flex items-start gap-1.5">
                                <span className="mt-1 w-1 h-1 rounded-full bg-[#10B981]/60 flex-shrink-0" />
                                {n}
                              </li>
                            ))}
                            {persona.needs.length === 0 && <li className="text-xs text-[#64748B] italic">None added</li>}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Add Persona Form */}
      <AnimatePresence>
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/[0.03] border border-[#8B5CF6]/20 rounded-xl p-4 space-y-4"
          >
            <p className="text-sm font-medium text-[#F1F5F9]">{editingId ? 'Edit Persona' : 'New Persona'}</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Startup Steve"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Founder / CEO"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Pain Points */}
            <div>
              <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">Pain Points</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.painPoint}
                  onChange={(e) => setFormData({ ...formData, painPoint: e.target.value })}
                  placeholder="Add a pain point..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter') addPainPoint() }}
                />
                <button onClick={addPainPoint} className="px-3 py-1.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.painPoints.map((pp, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#F43F5E]/10 text-[#F43F5E]/80">
                    {pp}
                    <button onClick={() => removePainPoint(i)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Needs */}
            <div>
              <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">Needs</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.need}
                  onChange={(e) => setFormData({ ...formData, need: e.target.value })}
                  placeholder="Add a need..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter') addNeed() }}
                />
                <button onClick={addNeed} className="px-3 py-1.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors">Add</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.needs.map((n, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[#10B981]/10 text-[#10B981]/80">
                    {n}
                    <button onClick={() => removeNeed(i)}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={resetForm} className="px-4 py-2 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors">Cancel</button>
              <button onClick={savePersona} className="px-4 py-2 text-xs bg-[#8B5CF6] text-white rounded-lg hover:bg-[#8B5CF6]/90 transition-colors font-medium">
                {editingId ? 'Update' : 'Add Persona'}
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
            Add Persona
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
