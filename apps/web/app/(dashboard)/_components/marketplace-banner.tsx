'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Store, Zap } from 'lucide-react'
import { BlueprintIllustration } from '../../components/shared/blueprint-illustration'

interface MarketplaceBannerProps {
  onOpen: () => void
}

/**
 * Microsoft-style hero banner for the Blueprint Marketplace.
 * Wide, gradient-washed, split into copy (left 55%) + animated illustration (right 45%).
 *
 * Per R20: the hero gradient + per-category preview gradients are signature
 * marketplace brand art. Gradient pairs are the *payload* BlueprintIllustration
 * consumes, so they need to stay literal. Chrome (sparkles, buttons) rides
 * tokens wherever possible.
 */
export default function MarketplaceBanner({ onOpen }: MarketplaceBannerProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-white/10 mb-8"
      style={{
        background:
          // eslint-disable-next-line no-hardcoded-hex -- signature marketplace hero gradient
          'linear-gradient(115deg, #0B1220 0%, #10192E 38%, #1A1340 72%, #2A1055 100%)',
      }}
    >
      {/* Ambient gradient orbs */}
      <motion.div
        className="absolute -top-32 -left-16 w-[420px] h-[420px] rounded-full opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35), transparent 60%)' }}
        animate={{ x: [0, 20, 0], y: [0, 12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full opacity-50 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4), transparent 60%)' }}
        animate={{ x: [0, -24, 0], y: [0, -8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/4 -right-24 w-[400px] h-[400px] rounded-full opacity-55 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3), transparent 60%)' }}
        animate={{ x: [0, -16, 0], y: [0, 20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 items-center gap-8 px-8 md:px-10 py-10 md:py-12">
        {/* Copy side */}
        <div className="lg:col-span-7 relative">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/80 px-2.5 py-1 rounded-full border border-white/15 bg-white/5 backdrop-blur">
              <Sparkles className="w-3 h-3" />
              Featured · New
            </span>
            <span className="text-[10px] font-medium text-white/50">109 blueprints live</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-white leading-[1.1] tracking-tight mb-3">
            Ship faster with{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  // eslint-disable-next-line no-hardcoded-hex -- signature gradient text
                  'linear-gradient(90deg, #60A5FA 0%, #A78BFA 45%, #F472B6 100%)',
              }}
            >
              Blueprint Marketplace
            </span>
          </h2>

          <p className="text-sm md:text-base text-white/75 leading-relaxed max-w-xl mb-6">
            100+ multi-studio bundles. Each blueprint deploys Pages, Entities, Workflows, Components,
            Tokens, AI Skills, and Connectors — all wired into your Product Graph in one install.
          </p>

          {/* Benefit chips */}
          <div className="flex flex-wrap items-center gap-2 mb-7">
            {[
              { icon: Zap, label: 'One-click deploy' },
              { icon: Sparkles, label: 'AI remix' },
              { icon: Store, label: 'Use-case organized' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/85 px-2.5 py-1 rounded-full bg-white/5 border border-white/10"
              >
                <Icon className="w-3 h-3 text-white/70" />
                {label}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpen}
              // eslint-disable-next-line no-hardcoded-hex -- matches hero bg deep-navy
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#0B1220] text-sm font-semibold hover:bg-white/90 transition-all shadow-[0_8px_24px_rgba(255,255,255,0.12)]"
            >
              Browse marketplace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all backdrop-blur"
            >
              See what's new
            </button>
          </div>
        </div>

        {/* Illustration side */}
        <div className="lg:col-span-5 relative h-[200px] md:h-[260px] lg:h-[280px] hidden md:block">
          {/* Primary illustration card — elevated */}
          <motion.div
            className="absolute right-0 top-4 w-[78%] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            initial={{ opacity: 0, y: 20, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ rotate: 0, y: -4 }}
          >
            <BlueprintIllustration
              category="saas-app"
              // eslint-disable-next-line no-hardcoded-hex -- brand category gradient pair
              gradient={['#3B82F6', '#8B5CF6']}
              size="lg"
            />
            {/* eslint-disable-next-line no-hardcoded-hex -- matches hero bg deep-navy */}
            <div className="px-3 py-2 bg-[#0B1220]/85 backdrop-blur border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-white leading-tight">SaaS Starter Kit</p>
                <p className="text-[9px] text-white/55">14 studios · 67 artifacts</p>
              </div>
              <div className="flex -space-x-1">
                {/* eslint-disable-next-line no-hardcoded-hex -- category gradient dot */}
                <div className="w-4 h-4 rounded-full bg-[#3B82F6] border border-white/10" />
                {/* eslint-disable-next-line no-hardcoded-hex -- category gradient dot */}
                <div className="w-4 h-4 rounded-full bg-[#8B5CF6] border border-white/10" />
                {/* eslint-disable-next-line no-hardcoded-hex -- category gradient dot */}
                <div className="w-4 h-4 rounded-full bg-[#EC4899] border border-white/10" />
              </div>
            </div>
          </motion.div>

          {/* Back card — peek-through */}
          <motion.div
            className="absolute right-12 top-0 w-[68%] rounded-2xl overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.35)] opacity-75"
            initial={{ opacity: 0, y: 20, rotate: 4 }}
            animate={{ opacity: 0.75, y: 0, rotate: 4 }}
            transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <BlueprintIllustration
              category="crm"
              // eslint-disable-next-line no-hardcoded-hex -- brand category gradient pair
              gradient={['#EC4899', '#F59E0B']}
              size="md"
              reduceMotion
            />
          </motion.div>

          {/* Floating small card */}
          <motion.div
            className="absolute -left-2 bottom-2 w-[50%] rounded-xl overflow-hidden border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
            initial={{ opacity: 0, y: 18, rotate: -6 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ rotate: -2, y: -4 }}
          >
            <BlueprintIllustration
              category="ai-app"
              // eslint-disable-next-line no-hardcoded-hex -- brand category gradient pair
              gradient={['#06B6D4', '#8B5CF6']}
              size="md"
              reduceMotion
            />
          </motion.div>

          {/* Sparkle decorations */}
          <motion.div
            className="absolute top-2 right-[10%] w-1.5 h-1.5 rounded-full bg-white"
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.4, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-10 right-[40%] w-1 h-1 rounded-full bg-[var(--accent-text)]"
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.6, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}
          />
          <motion.div
            className="absolute top-12 left-8 w-1 h-1 rounded-full bg-[var(--accent)]"
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.5, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 1.2 }}
          />
        </div>
      </div>
    </motion.section>
  )
}
