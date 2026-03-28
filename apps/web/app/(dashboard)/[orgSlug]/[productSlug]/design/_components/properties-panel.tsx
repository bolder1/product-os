'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ChevronDown } from 'lucide-react'
import type { ElementDef } from '../_data/mock-screens'

interface PropertiesPanelProps {
  element: ElementDef | null
  onUpdate: (id: string, updates: Partial<ElementDef>) => void
}

// Collapsible section
function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/[0.06] last:border-none">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">{title}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#64748B] transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
        />
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

// Numeric input field
function NumField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-[#64748B] font-medium">{label}</label>
      <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-lg overflow-hidden">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-[#F1F5F9] text-xs px-2.5 py-1.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        {suffix && <span className="text-[10px] text-[#64748B] pr-2">{suffix}</span>}
      </div>
    </div>
  )
}

// Text input field
function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-[#64748B] font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/[0.03] border border-white/[0.06] rounded-lg text-[#F1F5F9] text-xs px-2.5 py-1.5 outline-none focus:border-violet-500/40 transition-colors"
      />
    </div>
  )
}

// Select field
function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-[#64748B] font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/[0.03] border border-white/[0.06] rounded-lg text-[#F1F5F9] text-xs px-2.5 py-1.5 outline-none focus:border-violet-500/40 transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0d1129]">
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

const isTextElement = (type: string) =>
  ['Heading', 'Paragraph', 'Link', 'Button', 'Badge'].includes(type)

const componentOptions = ['None', 'Header', 'HeroSection', 'FeatureCard', 'PricingCard', 'Footer', 'Sidebar', 'DataTable', 'StatCard', 'UserProfile']

export default function PropertiesPanel({ element, onUpdate }: PropertiesPanelProps) {
  const [local, setLocal] = useState<ElementDef | null>(null)

  useEffect(() => {
    setLocal(element ? { ...element, style: { ...element.style } } : null)
  }, [element])

  if (!local) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2 px-4">
          <p className="text-sm text-[#64748B]">No element selected</p>
          <p className="text-[11px] text-[#475569]">Click an element on the canvas to edit its properties</p>
        </div>
      </div>
    )
  }

  const commitPos = (field: 'x' | 'y', val: number) => {
    setLocal((p) => (p ? { ...p, [field]: val } : p))
    onUpdate(local.id, { [field]: val })
  }
  const commitSize = (field: 'width' | 'height', val: number) => {
    setLocal((p) => (p ? { ...p, [field]: val } : p))
    onUpdate(local.id, { [field]: val })
  }
  const commitStyle = (key: string, val: string) => {
    const newStyle = { ...local.style, [key]: val }
    setLocal((p) => (p ? { ...p, style: newStyle } : p))
    onUpdate(local.id, { style: newStyle })
  }
  const commitContent = (val: string) => {
    setLocal((p) => (p ? { ...p, content: val } : p))
    onUpdate(local.id, { content: val })
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-500/15 flex items-center justify-center">
            <span className="text-[10px] text-violet-400 font-bold">{local.type.charAt(0)}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#F1F5F9]">{local.type}</p>
            <p className="text-[10px] text-[#64748B]">{local.id}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {/* Position */}
        <Section title="Position">
          <div className="grid grid-cols-2 gap-2">
            <NumField label="X" value={local.x} onChange={(v) => commitPos('x', v)} suffix="px" />
            <NumField label="Y" value={local.y} onChange={(v) => commitPos('y', v)} suffix="px" />
          </div>
        </Section>

        {/* Size */}
        <Section title="Size">
          <div className="grid grid-cols-2 gap-2">
            <NumField label="Width" value={local.width} onChange={(v) => commitSize('width', v)} suffix="px" />
            <NumField label="Height" value={local.height} onChange={(v) => commitSize('height', v)} suffix="px" />
          </div>
        </Section>

        {/* Style */}
        <Section title="Style">
          <div className="space-y-2">
            <TextField
              label="Background"
              value={local.style.background || ''}
              onChange={(v) => commitStyle('background', v)}
            />
            <TextField
              label="Border Radius"
              value={local.style.borderRadius || '0'}
              onChange={(v) => commitStyle('borderRadius', v)}
            />
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="Padding"
                value={local.style.padding || '0'}
                onChange={(v) => commitStyle('padding', v)}
              />
              <TextField
                label="Opacity"
                value={local.style.opacity || '1'}
                onChange={(v) => commitStyle('opacity', v)}
              />
            </div>
            <TextField
              label="Border"
              value={local.style.border || 'none'}
              onChange={(v) => commitStyle('border', v)}
            />
          </div>
        </Section>

        {/* Text (conditional) */}
        {isTextElement(local.type) && (
          <Section title="Text">
            <div className="space-y-2">
              <TextField label="Content" value={local.content || ''} onChange={commitContent} />
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  label="Font Size"
                  value={local.style.fontSize || '14px'}
                  onChange={(v) => commitStyle('fontSize', v)}
                />
                <SelectField
                  label="Weight"
                  value={local.style.fontWeight || '400'}
                  options={['300', '400', '500', '600', '700', '800']}
                  onChange={(v) => commitStyle('fontWeight', v)}
                />
              </div>
              <TextField
                label="Color"
                value={local.style.color || '#F1F5F9'}
                onChange={(v) => commitStyle('color', v)}
              />
              <SelectField
                label="Alignment"
                value={local.style.textAlign || 'left'}
                options={['left', 'center', 'right']}
                onChange={(v) => commitStyle('textAlign', v)}
              />
            </div>
          </Section>
        )}

        {/* Component Binding */}
        <Section title="Component Binding" defaultOpen={false}>
          <SelectField
            label="Linked Component"
            value={local.style._componentBinding || 'None'}
            options={componentOptions}
            onChange={(v) => commitStyle('_componentBinding', v)}
          />
        </Section>
      </div>

      {/* AI Button */}
      <div className="shrink-0 p-3 border-t border-white/[0.08]">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6]/20 to-[#7C3AED]/20 border border-violet-500/20 text-violet-300 text-xs font-medium hover:from-[#8B5CF6]/30 hover:to-[#7C3AED]/30 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI: Suggest Layout
        </motion.button>
      </div>
    </div>
  )
}
