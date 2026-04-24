'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Save, CheckCircle2, Loader2, Globe, Lock } from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'

type Category = 'saas' | 'mobile' | 'ecommerce' | 'marketing' | 'design_system' | 'internal_ops' | 'custom'

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'saas',          label: 'SaaS'          },
  { key: 'mobile',        label: 'Mobile'        },
  { key: 'ecommerce',     label: 'E-Commerce'    },
  { key: 'marketing',     label: 'Marketing'     },
  { key: 'design_system', label: 'Design System' },
  { key: 'internal_ops',  label: 'Internal Ops'  },
  { key: 'custom',        label: 'Custom'        },
]

interface Props {
  productId: string
  nodeCount: number
  onClose: () => void
  onSaved: (name: string) => void
}

export function SaveAsTemplateModal({ productId, nodeCount, onClose, onSaved }: Props) {
  const [name, setName]             = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]     = useState<Category>('custom')
  const [tags, setTags]             = useState('')
  const [isPublic, setIsPublic]     = useState(false)
  const [done, setDone]             = useState(false)

  const saveMutation = trpc.template.saveAsBundle.useMutation({
    onSuccess: () => {
      setDone(true)
    },
  })

  const handleSave = () => {
    if (!name.trim()) return
    saveMutation.mutate({
      productId,
      name: name.trim(),
      description: description.trim(),
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      isPublic,
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !saveMutation.isPending) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#0B1120] border border-white/[0.1] rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <Save size={14} className="text-[var(--accent-text)]" />
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">Save as Template</span>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            <X size={14} />
          </button>
        </div>

        {done ? (
          /* Success state */
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="w-14 h-14 rounded-full bg-[var(--color-success)]/15 border border-[var(--color-success)]/30 flex items-center justify-center"
            >
              <CheckCircle2 size={24} className="text-[var(--color-success)]" />
            </motion.div>
            <div>
              <p className="text-[14px] font-bold text-[var(--text-primary)]">"{name}" saved!</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                Your template is now available in My Templates.
              </p>
            </div>
            <button
              onClick={() => { onSaved(name); onClose() }}
              className="px-5 py-2 rounded-xl bg-[var(--color-success)] text-white text-[11px] font-medium hover:bg-[var(--color-success)] transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <div className="p-5 space-y-4">
            <p className="text-[11px] text-[var(--text-tertiary)]">
              This will capture all {nodeCount} nodes and their edges from your current product graph into a reusable template.
            </p>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">Template name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. My SaaS Blueprint"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40 placeholder:text-[var(--border-default)]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this template cover?"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40 placeholder:text-[var(--border-default)] resize-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                      category === cat.key
                        ? 'border-[var(--accent)]/50 bg-[var(--accent)]/10 text-[var(--accent-text)]'
                        : 'border-white/[0.08] text-[var(--text-tertiary)] hover:border-white/[0.15] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">Tags <span className="normal-case text-[var(--text-tertiary)]">(comma separated)</span></label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="auth, billing, dashboard"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/40 placeholder:text-[var(--border-default)]"
              />
            </div>

            {/* Visibility */}
            <button
              onClick={() => setIsPublic((p) => !p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                isPublic
                  ? 'border-[var(--accent)]/30 bg-[var(--accent)]/8'
                  : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              {isPublic ? (
                <Globe size={14} className="text-[var(--accent-text)] shrink-0" />
              ) : (
                <Lock size={14} className="text-[var(--text-tertiary)] shrink-0" />
              )}
              <div className="text-left">
                <p className={`text-[11px] font-medium ${isPublic ? 'text-[var(--accent-text)]' : 'text-[var(--text-secondary)]'}`}>
                  {isPublic ? 'Public — visible to all orgs' : 'Private — only your org'}
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">Click to toggle visibility</p>
              </div>
            </button>

            {saveMutation.isError && (
              <p className="text-[10px] text-red-400">{saveMutation.error.message}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-white/[0.08] text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:border-white/[0.15] transition-all">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || saveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--accent)] text-white text-[11px] font-medium hover:bg-[var(--accent-hover)] disabled:opacity-40 transition-all"
              >
                {saveMutation.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Save size={12} />
                )}
                Save Template
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
