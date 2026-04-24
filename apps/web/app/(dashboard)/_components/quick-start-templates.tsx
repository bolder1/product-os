'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Loader2, Store } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useProductStore } from '../../lib/product-store'
import { TemplateMarketplace } from '../../components/shared/template-marketplace'

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

const QUICK_TEMPLATES = [
  { id: 'saas', name: 'SaaS Product', description: 'Auth, billing, dashboard, onboarding', icon: '🚀', color: '#3B82F6' },
  { id: 'mobile', name: 'Mobile App', description: 'Native mobile with onboarding and core screens', icon: '📱', color: '#8B5CF6' },
  { id: 'ecommerce', name: 'E-Commerce', description: 'Storefront, cart, checkout, orders', icon: '🛒', color: '#10B981' },
  { id: 'dashboard', name: 'Analytics Dashboard', description: 'Charts, metrics, real-time data', icon: '📊', color: '#F59E0B' },
  { id: 'marketplace', name: 'Marketplace', description: 'Two-sided marketplace with listings', icon: '🏪', color: '#EC4899' },
  { id: 'internal', name: 'Internal Tool', description: 'Admin panel, workflows, collaboration', icon: '🛠️', color: '#06B6D4' },
] as const

export default function QuickStartTemplates() {
  const router = useRouter()
  const { user } = useAuth()
  const createProduct = useProductStore((s) => s.createProduct)
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)

  const orgSlug =
    user?.orgSlug ||
    user?.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') ||
    'my-org'

  const handlePick = async (tpl: typeof QUICK_TEMPLATES[number]) => {
    if (creatingId) return
    setCreatingId(tpl.id)
    try {
      const product = await createProduct({
        name: tpl.name,
        description: tpl.description,
        slug: slugify(tpl.name) + '-' + Math.random().toString(36).slice(2, 6),
        orgSlug,
        icon: tpl.icon,
        color: tpl.color,
        status: 'draft',
      })
      router.push(`/${orgSlug}/${product.slug}/planner`)
    } catch {
      setCreatingId(null)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Quick Start Templates</h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">Pick a template to kickstart your first draft product</p>
        </div>
        <button
          onClick={() => setMarketplaceOpen(true)}
          className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent)] transition"
        >
          <Store className="w-3.5 h-3.5" />
          Browse 100+ templates
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {QUICK_TEMPLATES.map((tpl, i) => (
          <motion.button
            key={tpl.id}
            onClick={() => handlePick(tpl)}
            disabled={creatingId !== null}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group relative p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: `radial-gradient(circle at 90% 10%, ${tpl.color}10, transparent 60%)` }}
            />
            <div className="relative flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${tpl.color}15` }}
              >
                {tpl.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[var(--text-primary)]">{tpl.name}</h3>
                  {creatingId === tpl.id && <Loader2 className="w-3 h-3 animate-spin text-[var(--text-tertiary)]" />}
                </div>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed line-clamp-2">{tpl.description}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[var(--accent)]">
                  <Sparkles className="w-3 h-3" />
                  <span>Saves as draft</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}

        <motion.button
          onClick={() => setMarketplaceOpen(true)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: QUICK_TEMPLATES.length * 0.04 }}
          className="group p-4 rounded-xl border border-dashed border-white/[0.1] bg-transparent hover:bg-white/[0.02] hover:border-[var(--accent)]/40 transition-all text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-[var(--text-primary)]">See all 100+ templates</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">
                Responsive web apps, mobile, dashboards, and more
              </p>
              <div className="flex items-center gap-1 mt-2 text-[10px] text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                Open marketplace <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </motion.button>
      </div>

      <TemplateMarketplace open={marketplaceOpen} onClose={() => setMarketplaceOpen(false)} />
    </>
  )
}
