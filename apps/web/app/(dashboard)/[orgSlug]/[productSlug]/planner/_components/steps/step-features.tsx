'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Sparkles, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'

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

interface StepFeaturesProps {
  features: Feature[]
  onChange: (features: Feature[]) => void
}

export default function StepFeatures({ features, onChange }: StepFeaturesProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Feature['priority']>('must-have')

  const addFeature = () => {
    if (!name.trim()) return
    const newFeature: Feature = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      priority,
    }
    onChange([...features, newFeature])
    setName('')
    setDescription('')
    setPriority('must-have')
    setShowForm(false)
  }

  const removeFeature = (id: string) => {
    onChange(features.filter((f) => f.id !== id))
  }

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const newFeatures = [...features]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newFeatures.length) return
    ;[newFeatures[index], newFeatures[targetIndex]] = [newFeatures[targetIndex], newFeatures[index]]
    onChange(newFeatures)
  }

  const cyclePriority = (id: string) => {
    const order: Feature['priority'][] = ['must-have', 'should-have', 'nice-to-have']
    onChange(features.map((f) => {
      if (f.id !== id) return f
      const idx = order.indexOf(f.priority)
      return { ...f, priority: order[(idx + 1) % order.length] }
    }))
  }

  const mustHaveCount = features.filter((f) => f.priority === 'must-have').length
  const shouldHaveCount = features.filter((f) => f.priority === 'should-have').length
  const niceToHaveCount = features.filter((f) => f.priority === 'nice-to-have').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">What features do you need?</h2>
        <p className="text-[#94A3B8] text-sm">
          List the features your product needs, prioritize them, and reorder by importance.
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3">
        {[
          { label: 'Must Have', count: mustHaveCount, color: '#F43F5E' },
          { label: 'Should Have', count: shouldHaveCount, color: '#F59E0B' },
          { label: 'Nice to Have', count: niceToHaveCount, color: '#06B6D4' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[#64748B]">{item.label}</span>
            <span className="font-medium" style={{ color: item.color }}>{item.count}</span>
          </div>
        ))}
      </div>

      {/* AI Generate button */}
      <button className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/15 transition-colors">
        <Sparkles className="w-4 h-4" />
        Generate from goals
      </button>

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
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/[0.03] border border-[#8B5CF6]/20 rounded-xl p-4 space-y-3"
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Feature name"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                    onClick={() => setPriority(p)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all"
                    style={
                      priority === p
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
              <button onClick={() => { setShowForm(false); setName(''); setDescription('') }} className="px-4 py-2 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors">Cancel</button>
              <button onClick={addFeature} className="px-4 py-2 text-xs bg-[#8B5CF6] text-white rounded-lg hover:bg-[#8B5CF6]/90 transition-colors font-medium">Add Feature</button>
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
            Add Feature
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
