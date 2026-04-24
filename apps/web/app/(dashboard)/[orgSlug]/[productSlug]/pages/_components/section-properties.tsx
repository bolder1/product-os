'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Plus, Trash2, X } from 'lucide-react'
import {
  SECTION_COLORS,
  type SectionDef,
  type PageDef,
} from '../_data/mock-pages'

interface SectionPropertiesProps {
  section: SectionDef
  page: PageDef
  onUpdateSection: (sectionId: string, content: Record<string, any>) => void
  onUpdateSeo: (seo: { title: string; description: string }) => void
  onClose: () => void
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  placeholder?: string
  multiline?: boolean
}) {
  const baseClass =
    'w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]/40 focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors'

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-8 h-4.5 rounded-full transition-colors ${
          value ? 'bg-[var(--accent)]' : 'bg-white/[0.1]'
        }`}
      >
        <span
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${
            value ? 'left-4' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function HeroFields({
  content,
  onUpdate,
}: {
  content: Record<string, any>
  onUpdate: (c: Record<string, any>) => void
}) {
  return (
    <>
      <Field
        label="Heading"
        value={content.heading || ''}
        onChange={(v) => onUpdate({ ...content, heading: v })}
        placeholder="Enter hero heading..."
      />
      <Field
        label="Subheading"
        value={content.subheading || ''}
        onChange={(v) => onUpdate({ ...content, subheading: v })}
        placeholder="Enter subheading..."
        multiline
      />
      <Field
        label="CTA Text"
        value={content.ctaText || ''}
        onChange={(v) => onUpdate({ ...content, ctaText: v })}
        placeholder="Button text..."
      />
      <Field
        label="CTA Link"
        value={content.ctaLink || ''}
        onChange={(v) => onUpdate({ ...content, ctaLink: v })}
        placeholder="/path"
      />
      <Toggle
        label="Background"
        value={content.background ?? false}
        onChange={(v) => onUpdate({ ...content, background: v })}
      />
    </>
  )
}

function FeaturesFields({
  content,
  onUpdate,
}: {
  content: Record<string, any>
  onUpdate: (c: Record<string, any>) => void
}) {
  const features = content.features || []

  const updateFeature = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...features]
    updated[index] = { ...updated[index], [field]: value }
    onUpdate({ ...content, features: updated })
  }

  const addFeature = () => {
    if (features.length >= 6) return
    onUpdate({
      ...content,
      features: [
        ...features,
        { icon: 'Star', title: '', description: '' },
      ],
    })
  }

  const removeFeature = (index: number) => {
    onUpdate({
      ...content,
      features: features.filter((_: any, i: number) => i !== index),
    })
  }

  return (
    <>
      <div className="space-y-3">
        {features.map((feat: any, i: number) => (
          <div
            key={i}
            className="space-y-1.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                Feature {i + 1}
              </span>
              <button
                onClick={() => removeFeature(i)}
                className="p-0.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <Field
              label="Icon"
              value={feat.icon || ''}
              onChange={(v) => updateFeature(i, 'icon', v)}
              placeholder="Icon name"
            />
            <Field
              label="Title"
              value={feat.title || ''}
              onChange={(v) => updateFeature(i, 'title', v)}
              placeholder="Feature title"
            />
            <Field
              label="Description"
              value={feat.description || ''}
              onChange={(v) => updateFeature(i, 'description', v)}
              placeholder="Short description"
            />
          </div>
        ))}
      </div>
      {features.length < 6 && (
        <button
          onClick={addFeature}
          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Feature
        </button>
      )}
    </>
  )
}

function ContentFields({
  content,
  onUpdate,
}: {
  content: Record<string, any>
  onUpdate: (c: Record<string, any>) => void
}) {
  return (
    <>
      <Field
        label="Content"
        value={content.text || ''}
        onChange={(v) => onUpdate({ ...content, text: v })}
        placeholder="Enter page content..."
        multiline
      />
      <Toggle
        label="Show Image"
        value={content.image ?? false}
        onChange={(v) => onUpdate({ ...content, image: v })}
      />
    </>
  )
}

function CTAFields({
  content,
  onUpdate,
}: {
  content: Record<string, any>
  onUpdate: (c: Record<string, any>) => void
}) {
  return (
    <>
      <Field
        label="Heading"
        value={content.heading || ''}
        onChange={(v) => onUpdate({ ...content, heading: v })}
        placeholder="CTA heading..."
      />
      <Field
        label="Description"
        value={content.description || ''}
        onChange={(v) => onUpdate({ ...content, description: v })}
        placeholder="Supporting text..."
        multiline
      />
      <Field
        label="Button Text"
        value={content.buttonText || ''}
        onChange={(v) => onUpdate({ ...content, buttonText: v })}
        placeholder="Button label"
      />
      <Field
        label="Button Link"
        value={content.buttonLink || ''}
        onChange={(v) => onUpdate({ ...content, buttonLink: v })}
        placeholder="/path"
      />
    </>
  )
}

function PricingFields({
  content,
  onUpdate,
}: {
  content: Record<string, any>
  onUpdate: (c: Record<string, any>) => void
}) {
  const plans = content.plans || []

  const updatePlan = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...plans]
    updated[index] = { ...updated[index], [field]: value }
    onUpdate({ ...content, plans: updated })
  }

  const addPlan = () => {
    if (plans.length >= 3) return
    onUpdate({
      ...content,
      plans: [...plans, { name: '', price: '', features: [] }],
    })
  }

  const removePlan = (index: number) => {
    onUpdate({
      ...content,
      plans: plans.filter((_: any, i: number) => i !== index),
    })
  }

  return (
    <>
      <div className="space-y-3">
        {plans.map((plan: any, i: number) => (
          <div
            key={i}
            className="space-y-1.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[var(--text-secondary)]">
                Plan {i + 1}
              </span>
              <button
                onClick={() => removePlan(i)}
                className="p-0.5 rounded hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <Field
              label="Name"
              value={plan.name || ''}
              onChange={(v) => updatePlan(i, 'name', v)}
              placeholder="Plan name"
            />
            <Field
              label="Price"
              value={plan.price || ''}
              onChange={(v) => updatePlan(i, 'price', v)}
              placeholder="$0/mo"
            />
            <Field
              label="Features (comma-separated)"
              value={(plan.features || []).join(', ')}
              onChange={(v) =>
                updatePlan(
                  i,
                  'features',
                  v.split(',').map((s: string) => s.trim())
                )
              }
              placeholder="Feature 1, Feature 2, ..."
              multiline
            />
          </div>
        ))}
      </div>
      {plans.length < 3 && (
        <button
          onClick={addPlan}
          className="flex items-center gap-1 text-xs text-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Plan
        </button>
      )}
    </>
  )
}

function DefaultFields({
  content,
  onUpdate,
}: {
  content: Record<string, any>
  onUpdate: (c: Record<string, any>) => void
}) {
  return (
    <>
      <Field
        label="Title"
        value={content.title || ''}
        onChange={(v) => onUpdate({ ...content, title: v })}
        placeholder="Section title..."
      />
      <Field
        label="Description"
        value={content.description || ''}
        onChange={(v) => onUpdate({ ...content, description: v })}
        placeholder="Section description..."
        multiline
      />
    </>
  )
}

export function SectionProperties({
  section,
  page,
  onUpdateSection,
  onUpdateSeo,
  onClose,
}: SectionPropertiesProps) {
  const color = SECTION_COLORS[section.type] || '#64748B'

  const handleContentUpdate = (content: Record<string, any>) => {
    onUpdateSection(section.id, content)
  }

  const renderFields = () => {
    switch (section.type) {
      case 'Hero':
        return (
          <HeroFields
            content={section.content}
            onUpdate={handleContentUpdate}
          />
        )
      case 'Features':
        return (
          <FeaturesFields
            content={section.content}
            onUpdate={handleContentUpdate}
          />
        )
      case 'Content':
        return (
          <ContentFields
            content={section.content}
            onUpdate={handleContentUpdate}
          />
        )
      case 'CTA':
        return (
          <CTAFields
            content={section.content}
            onUpdate={handleContentUpdate}
          />
        )
      case 'Pricing':
        return (
          <PricingFields
            content={section.content}
            onUpdate={handleContentUpdate}
          />
        )
      default:
        return (
          <DefaultFields
            content={section.content}
            onUpdate={handleContentUpdate}
          />
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {section.type}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">Properties</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/[0.06] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Section fields */}
        <div className="space-y-3">{renderFields()}</div>

        {/* AI button */}
        <button className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors">
          <Sparkles className="w-3.5 h-3.5" />
          AI: Write Content
        </button>

        {/* SEO section */}
        <div className="pt-3 border-t border-white/[0.06] space-y-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            SEO
          </span>
          <Field
            label="Page Title"
            value={page.seo.title}
            onChange={(v) =>
              onUpdateSeo({ ...page.seo, title: v })
            }
            placeholder="Page title for search engines..."
          />
          <Field
            label="Meta Description"
            value={page.seo.description}
            onChange={(v) =>
              onUpdateSeo({ ...page.seo, description: v })
            }
            placeholder="Short description for search results..."
            multiline
          />
          <Field
            label="Slug"
            value={page.slug}
            onChange={() => {}}
            placeholder="/path"
          />
        </div>
      </div>
    </motion.div>
  )
}
