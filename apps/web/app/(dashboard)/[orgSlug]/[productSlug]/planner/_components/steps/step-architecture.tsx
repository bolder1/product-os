'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  X,
  Sparkles,
  Database,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  PenTool,
  Palette,
  Component,
  Paintbrush,
  GitBranch,
  FileCode,
  Code,
  ArrowRightLeft,
  Image,
  BarChart3,
  CheckSquare,
  ThumbsUp,
  Bell,
  Rocket,
  TestTube,
  Radio,
  Network,
} from 'lucide-react'

/* ── Types ── */
interface EntityField {
  name: string
  type: string
}

interface Entity {
  id: string
  name: string
  fields: EntityField[]
}

interface Studio {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  color: string
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

const studios: Studio[] = [
  { id: 'planner', name: 'Planner', description: 'Plan your product vision and scope', icon: <ClipboardList className="w-5 h-5" />, category: 'Plan', color: '#3B82F6' },
  { id: 'templates', name: 'Templates', description: 'Reusable product templates', icon: <FileText className="w-5 h-5" />, category: 'Plan', color: '#8B5CF6' },
  { id: 'canvas', name: 'Canvas', description: 'Visual product canvas editor', icon: <PenTool className="w-5 h-5" />, category: 'Build', color: '#6366F1' },
  { id: 'brand', name: 'Brand', description: 'Brand identity and guidelines', icon: <Palette className="w-5 h-5" />, category: 'Build', color: '#EC4899' },
  { id: 'components', name: 'Components', description: 'Design system components', icon: <Component className="w-5 h-5" />, category: 'Build', color: '#F59E0B' },
  { id: 'design', name: 'Design', description: 'UI/UX design studio', icon: <Paintbrush className="w-5 h-5" />, category: 'Build', color: '#06B6D4' },
  { id: 'workflows', name: 'Workflows', description: 'Business logic and automations', icon: <GitBranch className="w-5 h-5" />, category: 'Build', color: '#10B981' },
  { id: 'pages', name: 'Pages', description: 'Page layouts and routing', icon: <FileCode className="w-5 h-5" />, category: 'Build', color: '#3B82F6' },
  { id: 'code', name: 'Code', description: 'Code generation and editing', icon: <Code className="w-5 h-5" />, category: 'Build', color: '#64748B' },
  { id: 'handoff', name: 'Handoff', description: 'Dev handoff and specs', icon: <ArrowRightLeft className="w-5 h-5" />, category: 'Ship', color: '#94A3B8' },
  { id: 'graphics', name: 'Graphics', description: 'Image and graphic assets', icon: <Image className="w-5 h-5" />, category: 'Ship', color: '#EC4899' },
  { id: 'releases', name: 'Releases', description: 'Release management', icon: <Rocket className="w-5 h-5" />, category: 'Ship', color: '#06B6D4' },
  { id: 'testing', name: 'Testing', description: 'QA and testing tools', icon: <TestTube className="w-5 h-5" />, category: 'Ship', color: '#F59E0B' },
  { id: 'analytics', name: 'Analytics', description: 'Product analytics and insights', icon: <BarChart3 className="w-5 h-5" />, category: 'Operate', color: '#8B5CF6' },
  { id: 'tasks', name: 'Tasks', description: 'Task and issue tracking', icon: <CheckSquare className="w-5 h-5" />, category: 'Operate', color: '#F59E0B' },
  { id: 'approvals', name: 'Approvals', description: 'Review and approval workflows', icon: <ThumbsUp className="w-5 h-5" />, category: 'Operate', color: '#10B981' },
  { id: 'notifications', name: 'Notifications', description: 'Notification management', icon: <Bell className="w-5 h-5" />, category: 'Operate', color: '#F43F5E' },
  { id: 'control-tower', name: 'Control Tower', description: 'Operational command center', icon: <Radio className="w-5 h-5" />, category: 'Overview', color: '#3B82F6' },
  { id: 'graph-explorer', name: 'Graph Explorer', description: 'Explore product graph data', icon: <Network className="w-5 h-5" />, category: 'Overview', color: '#6366F1' },
]

const categoryOrder = ['Plan', 'Build', 'Ship', 'Operate', 'Overview']

/* ── Props ── */
interface StepArchitectureProps {
  entities: Entity[]
  activeStudios: string[]
  onEntitiesChange: (entities: Entity[]) => void
  onStudiosChange: (activeStudios: string[]) => void
}

export default function StepArchitecture({
  entities,
  activeStudios,
  onEntitiesChange,
  onStudiosChange,
}: StepArchitectureProps) {
  /* ── Entity state ── */
  const [showEntityForm, setShowEntityForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    fields: [] as EntityField[],
    fieldName: '',
    fieldType: 'text',
  })

  const resetForm = () => {
    setFormData({ name: '', fields: [], fieldName: '', fieldType: 'text' })
    setShowEntityForm(false)
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
      onEntitiesChange(
        entities.map((e) =>
          e.id === editingId
            ? { ...e, name: formData.name.trim(), fields: formData.fields }
            : e,
        ),
      )
    } else {
      const newEntity: Entity = {
        id: crypto.randomUUID(),
        name: formData.name.trim(),
        fields: formData.fields,
      }
      onEntitiesChange([...entities, newEntity])
    }
    resetForm()
  }

  const editEntity = (entity: Entity) => {
    setFormData({
      name: entity.name,
      fields: [...entity.fields],
      fieldName: '',
      fieldType: 'text',
    })
    setEditingId(entity.id)
    setShowEntityForm(true)
  }

  const removeEntity = (id: string) => {
    onEntitiesChange(entities.filter((e) => e.id !== id))
  }

  /* ── Studio toggle ── */
  const toggleStudio = (id: string) => {
    if (activeStudios.includes(id)) {
      onStudiosChange(activeStudios.filter((s) => s !== id))
    } else {
      onStudiosChange([...activeStudios, id])
    }
  }

  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    studios: studios.filter((s) => s.category === cat),
  }))

  return (
    <div className="space-y-8">
      {/* ════════════════ ENTITIES ════════════════ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-[#F1F5F9] mb-2">Data & studio setup</h2>
          <p className="text-[#94A3B8] text-sm">
            Define your data model and choose which studios to activate.
          </p>
        </div>

        {/* AI Detect button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-lg text-sm text-[#8B5CF6] hover:bg-[#8B5CF6]/15 transition-colors">
          <Sparkles className="w-4 h-4" />
          AI: Detect entities from features
        </button>

        {/* Entities list */}
        <div className="space-y-2">
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
                      <p className="text-xs text-[#64748B]">{entity.fields.length} fields</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entity.id)}
                        className="p-1.5 rounded-md hover:bg-white/[0.05] transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#64748B]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#64748B]" />
                        )}
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
                                style={{
                                  backgroundColor: (typeColors[field.type] || '#64748B') + '15',
                                  color: typeColors[field.type] || '#64748B',
                                }}
                              >
                                {field.type}
                              </span>
                            </div>
                          ))}
                          {entity.fields.length === 0 && (
                            <p className="text-xs text-[#64748B] italic">No fields defined</p>
                          )}
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
          {showEntityForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/[0.03] border border-[#8B5CF6]/20 rounded-xl p-4 space-y-4"
            >
              <p className="text-sm font-medium text-[#F1F5F9]">
                {editingId ? 'Edit Entity' : 'New Entity'}
              </p>

              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-1 block">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. User, Product, Order"
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                  autoFocus
                />
              </div>

              {/* Fields */}
              <div>
                <label className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider mb-2 block">
                  Fields
                </label>
                <div className="space-y-1.5 mb-3">
                  {formData.fields.map((field, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/[0.02] rounded-lg px-3 py-1.5">
                      <span className="text-xs text-[#F1F5F9] font-mono flex-1">{field.name}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: (typeColors[field.type] || '#64748B') + '15',
                          color: typeColors[field.type] || '#64748B',
                        }}
                      >
                        {field.type}
                      </span>
                      <button onClick={() => removeField(i)} className="p-0.5 hover:bg-white/[0.05] rounded">
                        <X className="w-3 h-3 text-[#64748B]" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.fieldName}
                    onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                    placeholder="Field name"
                    className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addField()
                    }}
                  />
                  <select
                    value={formData.fieldType}
                    onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#F1F5F9] focus:border-[#8B5CF6]/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                  >
                    {fieldTypes.map((t) => (
                      <option key={t} value={t} className="bg-[#0C1024] text-[#F1F5F9]">
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addField}
                    className="px-3 py-1.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-[#94A3B8] hover:bg-white/[0.08] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEntity}
                  className="px-4 py-2 text-xs bg-[#8B5CF6] text-white rounded-lg hover:bg-[#8B5CF6]/90 transition-colors font-medium"
                >
                  {editingId ? 'Update' : 'Add Entity'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowEntityForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-white/[0.08] rounded-xl text-sm text-[#64748B] hover:text-[#94A3B8] hover:border-[#8B5CF6]/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Entity
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider">Studios</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* ════════════════ STUDIOS ════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#64748B]">Active studios:</span>
          <span className="text-[#8B5CF6] font-semibold">{activeStudios.length}</span>
          <span className="text-[#64748B]">/ {studios.length}</span>
        </div>

        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.category}>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                {group.category}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {group.studios.map((studio) => {
                  const isActive = activeStudios.includes(studio.id)
                  return (
                    <motion.button
                      key={studio.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleStudio(studio.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        isActive
                          ? 'bg-white/[0.05] border-white/[0.12]'
                          : 'bg-white/[0.02] border-white/[0.06] opacity-60 hover:opacity-80'
                      }`}
                      style={isActive ? { borderColor: studio.color + '30' } : {}}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: studio.color + (isActive ? '20' : '10'),
                          color: isActive ? studio.color : '#64748B',
                        }}
                      >
                        {studio.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${isActive ? 'text-[#F1F5F9]' : 'text-[#94A3B8]'}`}>
                          {studio.name}
                        </p>
                        <p className="text-[10px] text-[#64748B] leading-relaxed mt-0.5 line-clamp-2">
                          {studio.description}
                        </p>
                      </div>
                      <div
                        className={`w-8 h-4 rounded-full flex items-center p-0.5 flex-shrink-0 transition-colors ${
                          isActive ? '' : 'bg-white/[0.06]'
                        }`}
                        style={isActive ? { backgroundColor: studio.color + '40' } : {}}
                      >
                        <motion.div
                          className="w-3 h-3 rounded-full"
                          animate={{ x: isActive ? 16 : 0 }}
                          style={{ backgroundColor: isActive ? studio.color : '#64748B' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
