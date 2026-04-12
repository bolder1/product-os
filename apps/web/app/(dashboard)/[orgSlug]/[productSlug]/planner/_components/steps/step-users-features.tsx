'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Sparkles,
  ChevronUp,
  ChevronDown,
  GripVertical,
  User,
} from 'lucide-react'

/* ── Types ── */
interface Persona {
  id: string
  name: string
  role: string
  painPoint: string
}

interface Feature {
  id: string
  name: string
  description: string
  priority: 'must-have' | 'should-have' | 'nice-to-have'
}

const priorityConfig = {
  'must-have': { label: 'Must Have', color: '#F43F5E', bg: '#F43F5E' },
  'should-have': { label: 'Should Have', color: '#F59E0B', bg: '#F59E0B' },
  'nice-to-have': { label: 'Nice to Have', color: '#06B6D4', bg: '#06B6D4' },
}

const avatarColors = ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#F43F5E']

/* ── Props ── */
interface StepUsersFeaturesProps {
  personas: Persona[]
  features: Feature[]
  onPersonasChange: (personas: Persona[]) => void
  onFeaturesChange: (features: Feature[]) => void
}

export default function StepUsersFeatures({
  personas,
  features,
  onPersonasChange,
  onFeaturesChange,
}: StepUsersFeaturesProps) {
  /* ── Persona state ── */
  const [showPersonaForm, setShowPersonaForm] = useState(false)
  const [personaForm, setPersonaForm] = useState({ name: '', role: '', painPoint: '' })

  const addPersona = () => {
    if (!personaForm.name.trim() || !personaForm.role.trim()) return
    const newPersona: Persona = {
      id: crypto.randomUUID(),
      name: personaForm.name.trim(),
      role: personaForm.role.trim(),
      painPoint: personaForm.painPoint.trim(),
    }
    onPersonasChange([...personas, newPersona])
    setPersonaForm({ name: '', role: '', painPoint: '' })
    setShowPersonaForm(false)
  }

  const removePersona = (id: string) => {
    onPersonasChange(personas.filter((p) => p.id !== id))
  }

  /* ── Feature state ── */
  const [showFeatureForm, setShowFeatureForm] = useState(false)
  const [featureName, setFeatureName] = useState('')
  const [featureDesc, setFeatureDesc] = useState('')
  const [featurePriority, setFeaturePriority] = useState<Feature['priority']>('must-have')

  const addFeature = () => {
    if (!featureName.trim()) return
    const newFeature: Feature = {
      id: crypto.randomUUID(),
      name: featureName.trim(),
      description: featureDesc.trim(),
      priority: featurePriority,
    }
    onFeaturesChange([...features, newFeature])
    setFeatureName('')
    setFeatureDesc('')
    setFeaturePriority('must-have')
    setShowFeatureForm(false)
  }

  const removeFeature = (id: string) => {
    onFeaturesChange(features.filter((f) => f.id !== id))
  }

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const next = [...features]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onFeaturesChange(next)
  }

  const cyclePriority = (id: string) => {
    const order: Feature['priority'][] = ['must-have', 'should-have', 'nice-to-have']
    onFeaturesChange(
      features.map((f) => {
        if (f.id !== id) return f
        const idx = order.indexOf(f.priority)
        return { ...f, priority: order[(idx + 1) % order.length] }
      }),
    )
  }

  const mustHaveCount = features.filter((f) => f.priority === 'must-have').length
  const shouldHaveCount = features.filter((f) => f.priority === 'should-have').length
  const niceToHaveCount = features.filter((f) => f.priority === 'nice-to-have').length

  return (
    <div className="space-y-8">
      {/* ════════════════ PERSONAS ════════════════ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Who and what</h2>
          <p className="text-[#94A3B8] text-sm">
            Define your target users and the features they need.
          </p>
        </div>

        {/* Persona cards */}
        <div className="space-y-2">
          <AnimatePresence>
            {personas.map((persona, index) => {
              const color = avatarColors[index % avatarColors.length]
              return (
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 group hover:border-white/[0.12] transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ backgroundColor: color + '20', color }}
                  >
                    {persona.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F1F5F9]">{persona.name}</p>
                    <p className="text-xs text-[#64748B]">{persona.role}</p>
                  </div>
                  {persona.painPoint && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F43F5E]/10 text-[#F43F5E]/80 flex-shrink-0 max-w-[160px] truncate">
                      {persona.painPoint}
                    </span>
                  )}
                  <button
                    onClick={() => removePersona(persona.id)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/[0.05] transition-all"
                  >
                    <X className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Add Persona inline form */}
        <AnimatePresence>
          {showPersonaForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/[0.03] border border-[#8B5CF6]/20 rounded-xl p-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={personaForm.name}
                  onChange={(e) => setPersonaForm({ ...personaForm, name: e.target.value })}
                  placeholder="Name (e.g. Startup Steve)"
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                  autoFocus
                />
                <input
                  type="text"
                  value={personaForm.role}
                  onChange={(e) => setPersonaForm({ ...personaForm, role: e.target.value })}
                  placeholder="Role (e.g. Founder / CEO)"
                  className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                />
              </div>
              <input
                type="text"
                value={personaForm.painPoint}
                onChange={(e) => setPersonaForm({ ...personaForm, painPoint: e.target.value })}
                placeholder="Key pain point (e.g. Too many tools)"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addPersona()
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowPersonaForm(false)
                    setPersonaForm({ name: '', role: '', painPoint: '' })
                  }}
                  className="px-4 py-2 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPersona}
                  className="px-4 py-2 text-xs bg-[#8B5CF6] text-white rounded-lg hover:bg-[#8B5CF6]/90 transition-colors font-medium"
                >
                  Add Persona
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowPersonaForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/[0.08] rounded-xl text-sm text-[#64748B] hover:text-[#94A3B8] hover:border-[#8B5CF6]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Persona
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider">Features</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* ════════════════ FEATURES ════════════════ */}
      <div className="space-y-4">
        {/* Summary pills */}
        <div className="flex items-center gap-4">
          <div className="flex gap-3">
            {[
              { label: 'Must Have', count: mustHaveCount, color: '#F43F5E' },
              { label: 'Should Have', count: shouldHaveCount, color: '#F59E0B' },
              { label: 'Nice to Have', count: niceToHaveCount, color: '#06B6D4' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#64748B]">{item.label}</span>
                <span className="font-medium" style={{ color: item.color }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* AI Generate button */}
          <button className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg text-xs text-[#8B5CF6] hover:bg-[#8B5CF6]/15 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            AI: Generate features from goals
          </button>
        </div>

        {/* Features list */}
        <div className="space-y-2">
          <AnimatePresence>
            {features.map((feature, index) => {
              const pc = priorityConfig[feature.priority]
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                  className="flex items-start gap-2 bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-3 group hover:border-white/[0.12] transition-colors"
                >
                  {/* Reorder controls */}
                  <div className="flex flex-col items-center gap-0.5 pt-0.5">
                    <button
                      onClick={() => moveFeature(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 rounded hover:bg-white/[0.05] transition-colors disabled:opacity-20"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>
                    <GripVertical className="w-3.5 h-3.5 text-[#64748B]/40" />
                    <button
                      onClick={() => moveFeature(index, 'down')}
                      disabled={index === features.length - 1}
                      className="p-0.5 rounded hover:bg-white/[0.05] transition-colors disabled:opacity-20"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#F1F5F9]">{feature.name}</p>
                      <button
                        onClick={() => cyclePriority(feature.id)}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: pc.bg + '15', color: pc.color }}
                      >
                        {pc.label}
                      </button>
                    </div>
                    {feature.description && (
                      <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">{feature.description}</p>
                    )}
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFeature(feature.id)}
                    className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/[0.05] transition-all flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Add Feature Form */}
        <AnimatePresence>
          {showFeatureForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/[0.03] border border-[#8B5CF6]/20 rounded-xl p-4 space-y-3"
            >
              <input
                type="text"
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder="Feature name"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                autoFocus
              />
              <textarea
                value={featureDesc}
                onChange={(e) => setFeatureDesc(e.target.value)}
                placeholder="Feature description (optional)"
                rows={2}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none resize-none transition-colors"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">Priority:</span>
                {(['must-have', 'should-have', 'nice-to-have'] as const).map((p) => {
                  const pc = priorityConfig[p]
                  return (
                    <button
                      key={p}
                      onClick={() => setFeaturePriority(p)}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all"
                      style={
                        featurePriority === p
                          ? { backgroundColor: pc.bg + '20', color: pc.color, borderColor: pc.bg + '40' }
                          : { backgroundColor: 'transparent', color: '#64748B', borderColor: 'rgba(255,255,255,0.08)' }
                      }
                    >
                      {pc.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowFeatureForm(false)
                    setFeatureName('')
                    setFeatureDesc('')
                  }}
                  className="px-4 py-2 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addFeature}
                  className="px-4 py-2 text-xs bg-[#8B5CF6] text-white rounded-lg hover:bg-[#8B5CF6]/90 transition-colors font-medium"
                >
                  Add Feature
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowFeatureForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/[0.08] rounded-xl text-sm text-[#64748B] hover:text-[#94A3B8] hover:border-[#8B5CF6]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Feature
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
