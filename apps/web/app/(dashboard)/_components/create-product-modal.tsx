'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import {
  X,
  Sparkles,
  FileText,
  Layout,
  Rocket,
  Package,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useProductStore } from '../../lib/product-store'

/* ── Slugify ── */
function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/* ── Templates ── */
const templates = [
  {
    id: 'saas',
    name: 'SaaS Product',
    description: 'Complete SaaS setup with auth, billing, and dashboard',
    icon: '🚀',
    color: '#3B82F6',
  },
  {
    id: 'mobile',
    name: 'Mobile App',
    description: 'Native mobile app with onboarding and core screens',
    icon: '📱',
    color: '#8B5CF6',
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Storefront, cart, checkout, and order management',
    icon: '🛒',
    color: '#10B981',
  },
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    description: 'Data visualization with charts and real-time metrics',
    icon: '📊',
    color: '#F59E0B',
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Two-sided marketplace with listings and messaging',
    icon: '🏪',
    color: '#EC4899',
  },
  {
    id: 'internal',
    name: 'Internal Tool',
    description: 'Admin panel, workflows, and team collaboration',
    icon: '🛠️',
    color: '#06B6D4',
  },
]

/* ── Overlay animations ── */
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const panelVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
}

type Mode = 'choose' | 'scratch' | 'template'

interface CreateProductModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateProductModal({
  open,
  onClose,
}: CreateProductModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const createProduct = useProductStore((s) => s.createProduct)

  const [mode, setMode] = useState<Mode>('choose')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(slugify(name))
    }
  }, [name, slugEdited])

  // Reset state on open
  useEffect(() => {
    if (open) {
      setMode('choose')
      setName('')
      setDescription('')
      setSlug('')
      setSlugEdited(false)
      setSelectedTemplate(null)
      setIsSubmitting(false)
      setError('')
    }
  }, [open])

  const orgSlug = user?.orgSlug ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
    'my-org'

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) {
        setError('Product name is required')
        return
      }
      if (!slug.trim()) {
        setError('Slug is required')
        return
      }

      setIsSubmitting(true)
      setError('')

      try {
        const product = await createProduct({
          name: name.trim(),
          description: description.trim(),
          slug: slug.trim(),
          orgSlug,
          status: 'draft',
        })

        onClose()
        router.push(`/${orgSlug}/${product.slug}/planner`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create product. Please try again.')
        setIsSubmitting(false)
      }
    },
    [name, slug, description, orgSlug, createProduct, onClose, router],
  )

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId)
    if (tmpl) {
      setSelectedTemplate(templateId)
      if (!name) {
        setName(tmpl.name)
        setSlug(slugify(tmpl.name))
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0A0F1E] shadow-2xl"
            variants={panelVariants}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0A0F1E]/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#6366F1]" />
                </div>
                <h2 className="text-lg font-semibold text-[#F1F5F9]">
                  {mode === 'choose'
                    ? 'Create New Product'
                    : mode === 'scratch'
                      ? 'Start from Scratch'
                      : 'Use a Template'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#94A3B8] hover:bg-white/[0.06] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* ── Choose mode ── */}
                {mode === 'choose' && (
                  <motion.div
                    key="choose"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-sm text-[#94A3B8] mb-6">
                      How would you like to begin?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Start from Scratch */}
                      <button
                        onClick={() => setMode('scratch')}
                        className="group relative p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#6366F1]/30 transition-all text-left"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl bg-[#6366F1]/10" />
                        <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center mb-4">
                          <FileText className="w-6 h-6 text-[#6366F1]" />
                        </div>
                        <h3 className="font-medium text-[#F1F5F9] mb-1">
                          Start from Scratch
                        </h3>
                        <p className="text-sm text-[#64748B]">
                          Create a blank product and define everything yourself
                        </p>
                        <ArrowRight className="w-4 h-4 text-[#64748B] mt-3 group-hover:text-[#6366F1] group-hover:translate-x-1 transition-all" />
                      </button>

                      {/* Use Template */}
                      <button
                        onClick={() => setMode('template')}
                        className="group relative p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#6366F1]/30 transition-all text-left"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl bg-[#6366F1]/10" />
                        <div className="w-12 h-12 rounded-xl bg-[#6366F1]/10 flex items-center justify-center mb-4">
                          <Layout className="w-6 h-6 text-[#6366F1]" />
                        </div>
                        <h3 className="font-medium text-[#F1F5F9] mb-1">
                          Use a Template
                        </h3>
                        <p className="text-sm text-[#64748B]">
                          Start with pre-built structure, pages, and workflows
                        </p>
                        <div className="flex items-center gap-1.5 mt-3">
                          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                          <span className="text-xs text-[#F59E0B]">
                            AI-powered templates
                          </span>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ── From scratch form ── */}
                {mode === 'scratch' && (
                  <motion.form
                    key="scratch"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                  >
                    <div className="space-y-5">
                      {/* Product Name */}
                      <div>
                        <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                          Product Name <span className="text-[#F43F5E]">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Mobile Banking App"
                          autoFocus
                          className="w-full px-4 py-3 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#F1F5F9] placeholder:text-[#4A5568] focus:border-[#6366F1]/40 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/20 transition"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description of what this product does..."
                          rows={3}
                          className="w-full px-4 py-3 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#F1F5F9] placeholder:text-[#4A5568] focus:border-[#6366F1]/40 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/20 transition resize-none"
                        />
                      </div>

                      {/* Slug */}
                      <div>
                        <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                          URL Slug
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#4A5568]">
                            /{orgSlug}/
                          </span>
                          <input
                            type="text"
                            value={slug}
                            onChange={(e) => {
                              setSlugEdited(true)
                              setSlug(slugify(e.target.value))
                            }}
                            className="w-full pl-[calc(theme(spacing.4)+var(--slug-offset,5ch))] pr-4 py-3 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#F1F5F9] placeholder:text-[#4A5568] focus:border-[#6366F1]/40 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/20 transition"
                            style={{
                              paddingLeft: `${1 + (orgSlug.length + 2) * 0.55}rem`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Error */}
                      {error && (
                        <p className="text-sm text-[#F43F5E]">{error}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => setMode('choose')}
                        className="text-sm text-[#64748B] hover:text-[#94A3B8] transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !name.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Rocket className="w-4 h-4" />
                            Create Product
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* ── Template selection ── */}
                {mode === 'template' && (
                  <motion.div
                    key="template"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Template grid */}
                    <p className="text-sm text-[#94A3B8] mb-4">
                      Choose a template to start with pre-built structure
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {templates.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          onClick={() => handleTemplateSelect(tmpl.id)}
                          className={`group p-4 rounded-xl border text-left transition-all ${
                            selectedTemplate === tmpl.id
                              ? 'border-[#6366F1]/50 bg-[#6366F1]/10'
                              : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                              style={{ backgroundColor: `${tmpl.color}15` }}
                            >
                              {tmpl.icon}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-medium text-[#F1F5F9] text-sm">
                                {tmpl.name}
                              </h4>
                              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                                {tmpl.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Form fields (name/description/slug) */}
                    <form onSubmit={handleSubmit}>
                      <div className="space-y-4 pt-4 border-t border-white/[0.08]">
                        <div>
                          <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                            Product Name{' '}
                            <span className="text-[#F43F5E]">*</span>
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. My SaaS Product"
                            className="w-full px-4 py-3 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#F1F5F9] placeholder:text-[#4A5568] focus:border-[#6366F1]/40 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/20 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                            Description
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description..."
                            rows={2}
                            className="w-full px-4 py-3 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#F1F5F9] placeholder:text-[#4A5568] focus:border-[#6366F1]/40 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/20 transition resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                            URL Slug
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#4A5568]">
                              /{orgSlug}/
                            </span>
                            <input
                              type="text"
                              value={slug}
                              onChange={(e) => {
                                setSlugEdited(true)
                                setSlug(slugify(e.target.value))
                              }}
                              className="w-full pr-4 py-3 text-sm bg-white/[0.03] border border-white/[0.08] rounded-xl text-[#F1F5F9] placeholder:text-[#4A5568] focus:border-[#6366F1]/40 focus:outline-none focus:ring-1 focus:ring-[#6366F1]/20 transition"
                              style={{
                                paddingLeft: `${1 + (orgSlug.length + 2) * 0.55}rem`,
                              }}
                            />
                          </div>
                        </div>

                        {error && (
                          <p className="text-sm text-[#F43F5E]">{error}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.08]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplate(null)
                            setMode('choose')
                          }}
                          className="text-sm text-[#64748B] hover:text-[#94A3B8] transition"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !name.trim()}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#6366F1] hover:bg-[#6366F1]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Create from Template
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
