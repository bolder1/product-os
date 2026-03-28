'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
} from 'lucide-react'
import { SECTION_COLORS, type PageDef, type SectionDef } from '../_data/mock-pages'

interface PagePreviewProps {
  page: PageDef
  open: boolean
  onClose: () => void
}

type Viewport = 'desktop' | 'tablet' | 'mobile'

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
}

function PreviewSection({ section }: { section: SectionDef }) {
  const color = SECTION_COLORS[section.type] || '#64748B'

  switch (section.type) {
    case 'Hero':
      return (
        <div
          className="py-16 px-8 text-center"
          style={{
            background: section.content.background
              ? `linear-gradient(135deg, ${color}15, ${color}05)`
              : undefined,
          }}
        >
          <h1 className="text-3xl font-bold text-[#F1F5F9] mb-3">
            {section.content.heading || 'Hero Heading'}
          </h1>
          <p className="text-base text-[#94A3B8] max-w-lg mx-auto mb-6">
            {section.content.subheading || 'Hero subheading text'}
          </p>
          {section.content.ctaText && (
            <span
              className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {section.content.ctaText}
            </span>
          )}
        </div>
      )

    case 'Features':
      return (
        <div className="py-12 px-8">
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
            {(section.content.features || []).map((feat: any, i: number) => (
              <div key={i} className="space-y-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {feat.icon?.[0] || '?'}
                </div>
                <h3 className="text-sm font-semibold text-[#F1F5F9]">
                  {feat.title || 'Feature'}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  {feat.description || 'Feature description'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'Content':
      return (
        <div className="py-12 px-8 max-w-2xl mx-auto">
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            {section.content.text || 'Content text goes here...'}
          </p>
          {section.content.image && (
            <div className="mt-6 h-40 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#64748B] text-xs">
              Image Placeholder
            </div>
          )}
        </div>
      )

    case 'CTA':
      return (
        <div
          className="py-12 px-8 text-center"
          style={{ backgroundColor: `${color}08` }}
        >
          <h2 className="text-xl font-bold text-[#F1F5F9] mb-2">
            {section.content.heading || 'CTA Heading'}
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto mb-5">
            {section.content.description || 'CTA description text'}
          </p>
          {section.content.buttonText && (
            <span
              className="inline-block px-5 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {section.content.buttonText}
            </span>
          )}
        </div>
      )

    case 'Pricing':
      return (
        <div className="py-12 px-8">
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
            {(section.content.plans || []).map((plan: any, i: number) => (
              <div
                key={i}
                className="rounded-xl p-5 border border-white/[0.08] bg-white/[0.02] text-center space-y-3"
              >
                <h3 className="text-sm font-semibold text-[#F1F5F9]">
                  {plan.name || 'Plan'}
                </h3>
                <p
                  className="text-2xl font-bold"
                  style={{ color }}
                >
                  {plan.price || '$0'}
                </p>
                <ul className="space-y-1.5 text-left">
                  {(plan.features || []).map((f: string, fi: number) => (
                    <li
                      key={fi}
                      className="text-xs text-[#94A3B8] flex items-center gap-1.5"
                    >
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )

    case 'Stats':
      return (
        <div className="py-12 px-8 text-center">
          <h2 className="text-lg font-bold text-[#F1F5F9] mb-1">
            {section.content.title || 'Stats'}
          </h2>
          <p className="text-xs text-[#94A3B8] mb-6">
            {section.content.description || ''}
          </p>
          <div className="flex justify-center gap-10">
            {['10K+', '99.9%', '150+', '24/7'].map((stat, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xl font-bold" style={{ color }}>
                  {stat}
                </p>
                <p className="text-[10px] text-[#64748B]">Metric</p>
              </div>
            ))}
          </div>
        </div>
      )

    case 'FAQ':
      return (
        <div className="py-12 px-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-[#F1F5F9] mb-4 text-center">
            {section.content.title || 'FAQ'}
          </h2>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="py-3 border-b border-white/[0.06] flex items-center justify-between"
            >
              <span className="text-xs text-[#94A3B8]">
                Question {i}?
              </span>
              <span className="text-xs" style={{ color }}>
                +
              </span>
            </div>
          ))}
        </div>
      )

    case 'Gallery':
      return (
        <div className="py-12 px-8">
          <h2 className="text-lg font-bold text-[#F1F5F9] mb-4 text-center">
            {section.content.title || 'Gallery'}
          </h2>
          <div className="grid grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-lg"
                style={{ backgroundColor: `${color}12` }}
              />
            ))}
          </div>
        </div>
      )

    case 'Testimonials':
      return (
        <div className="py-12 px-8">
          <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <p className="text-xs text-[#94A3B8] italic mb-3">
                  &ldquo;Testimonial quote goes here...&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: `${color}20` }}
                  />
                  <span className="text-[10px] text-[#64748B]">
                    Customer {i}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return (
        <div className="py-10 px-8 text-center">
          <p className="text-sm text-[#64748B]">
            {section.type} Section
          </p>
          <p className="text-xs text-[#64748B]/60 mt-1">
            {section.content.title || section.content.description || 'Custom section content'}
          </p>
        </div>
      )
  }
}

export function PagePreview({ page, open, onClose }: PagePreviewProps) {
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const sections = [...page.sections].sort((a, b) => a.order - b.order)

  const viewportButtons: { key: Viewport; icon: React.ElementType; label: string }[] = [
    { key: 'desktop', icon: Monitor, label: 'Desktop' },
    { key: 'tablet', icon: Tablet, label: 'Tablet' },
    { key: 'mobile', icon: Smartphone, label: 'Mobile' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#060918]/95 flex flex-col"
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.08] bg-[#060918]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#F1F5F9]">
                Preview: {page.name}
              </span>
              <span className="text-xs text-[#64748B]">{page.slug}</span>
            </div>

            {/* Viewport toggle */}
            <div className="flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
              {viewportButtons.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setViewport(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewport === key
                      ? 'bg-[#3B82F6]/15 text-[#3B82F6]'
                      : 'text-[#64748B] hover:text-[#94A3B8]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview canvas */}
          <div className="flex-1 overflow-auto flex justify-center py-6 px-4">
            <motion.div
              layout
              className={`${VIEWPORT_WIDTHS[viewport]} max-w-full bg-[#0a0f1e] rounded-xl border border-white/[0.08] overflow-hidden`}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {sections.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-sm text-[#64748B]">
                    No sections to preview
                  </p>
                </div>
              ) : (
                sections.map((section) => (
                  <div
                    key={section.id}
                    className="border-b border-white/[0.04] last:border-b-0"
                  >
                    <PreviewSection section={section} />
                  </div>
                ))
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
