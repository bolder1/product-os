'use client'

import { useState } from 'react'
import { Database, Link2, Unlink, Plus, Trash2, Server, Globe, FileText } from 'lucide-react'

interface DataBinding {
  sourceType: 'entity' | 'api' | 'static'
  entityId?: string
  endpoint?: string
  fieldMappings: Array<{ sectionField: string; sourceField: string }>
}

interface DataBindingPanelProps {
  sectionId: string
  sectionType: string
  binding: DataBinding | undefined
  entities: Array<{ id: string; label: string; fields: Array<{ name: string }> }>
  onBind: (binding: DataBinding) => void
  onUnbind: () => void
}

const SECTION_FIELDS: Record<string, string[]> = {
  Hero: ['heading', 'subheading', 'ctaText', 'ctaLink'],
  Features: ['features'],
  Content: ['text'],
  CTA: ['heading', 'description', 'buttonText', 'buttonLink'],
  Pricing: ['plans'],
  Stats: ['title', 'description'],
  FAQ: ['title', 'description'],
  Testimonials: ['title', 'description'],
  Gallery: ['title', 'description'],
}

export function DataBindingPanel({
  sectionId,
  sectionType,
  binding,
  entities,
  onBind,
  onUnbind,
}: DataBindingPanelProps) {
  const [sourceType, setSourceType] = useState<'entity' | 'api' | 'static'>(binding?.sourceType ?? 'static')
  const [entityId, setEntityId] = useState(binding?.entityId ?? '')
  const [endpoint, setEndpoint] = useState(binding?.endpoint ?? '')
  const [mappings, setMappings] = useState(binding?.fieldMappings ?? [])

  const availableFields = SECTION_FIELDS[sectionType] ?? ['title', 'description']
  const selectedEntity = entities.find((e) => e.id === entityId)
  const entityFields = selectedEntity?.fields.map((f) => f.name) ?? []

  const handleApply = () => {
    onBind({
      sourceType,
      entityId: sourceType === 'entity' ? entityId : undefined,
      endpoint: sourceType === 'api' ? endpoint : undefined,
      fieldMappings: mappings,
    })
  }

  const addMapping = () => {
    setMappings([...mappings, { sectionField: availableFields[0] ?? '', sourceField: '' }])
  }

  const updateMapping = (index: number, field: 'sectionField' | 'sourceField', value: string) => {
    setMappings(mappings.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index))
  }

  const isBound = !!binding && binding.sourceType !== 'static'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
          <Database className="w-3 h-3" /> Data Source
        </span>
        {isBound && (
          <button
            onClick={onUnbind}
            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition-colors"
          >
            <Unlink className="w-3 h-3" /> Unbind
          </button>
        )}
      </div>

      {/* Source type selector */}
      <div className="flex gap-1">
        {[
          { value: 'static' as const, icon: FileText, label: 'Static' },
          { value: 'entity' as const, icon: Server, label: 'Entity' },
          { value: 'api' as const, icon: Globe, label: 'API' },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setSourceType(value)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
              sourceType === value
                ? 'bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30'
                : 'bg-white/[0.03] text-[var(--text-tertiary)] border border-white/[0.06] hover:text-[var(--text-secondary)]'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {sourceType === 'static' && (
        <div className="text-[10px] text-[var(--text-tertiary)] p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          Content is edited directly in section properties. No dynamic data binding.
        </div>
      )}

      {sourceType === 'entity' && (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Entity</label>
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]/40"
            >
              <option value="">Select entity...</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {sourceType === 'api' && (
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">API Endpoint</label>
          <input
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://api.example.com/data"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/40"
          />
        </div>
      )}

      {/* Field mappings */}
      {sourceType !== 'static' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Field Mappings</span>
            <button onClick={addMapping} className="flex items-center gap-0.5 text-[10px] text-[var(--accent)] hover:text-[var(--accent)]">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {mappings.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                value={m.sectionField}
                onChange={(e) => updateMapping(i, 'sectionField', e.target.value)}
                className="flex-1 px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] text-[var(--text-primary)] focus:outline-none"
              >
                {availableFields.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <Link2 className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
              {sourceType === 'entity' ? (
                <select
                  value={m.sourceField}
                  onChange={(e) => updateMapping(i, 'sourceField', e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="">Select field...</option>
                  {entityFields.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={m.sourceField}
                  onChange={(e) => updateMapping(i, 'sourceField', e.target.value)}
                  placeholder="data.field"
                  className="flex-1 px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.08] text-[10px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
                />
              )}
              <button onClick={() => removeMapping(i)} className="p-0.5 text-[var(--text-tertiary)] hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Apply button */}
      {sourceType !== 'static' && (
        <button
          onClick={handleApply}
          className="w-full py-2 rounded-lg text-[11px] font-medium bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25 transition-colors"
        >
          Apply Binding
        </button>
      )}
    </div>
  )
}
