'use client'

import { motion, useMotionValue, animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Heart, ArrowRight, Loader2 } from 'lucide-react'
import { useProduct } from '../../layout'
import { trpc } from '../../../../../lib/trpc'

function getScoreColor(score: number) {
  if (score >= 70) return '#10B981'
  if (score >= 40) return '#F59E0B'
  return '#F43F5E'
}

function AnimatedScore({ target }: { target: number }) {
  const [display, setDisplay] = useState(0)
  const mv = useMotionValue(0)
  useEffect(() => {
    const ctrl = animate(mv, target, { duration: 1.4, ease: 'easeOut', onUpdate: (v) => setDisplay(Math.round(v)) })
    return ctrl.stop
  }, [mv, target])
  return <span className="text-4xl font-bold text-[var(--text-primary)]">{display}</span>
}

const FALLBACK_STUDIOS = [
  { studio: 'plan',       label: 'Plan',       route: 'planner',    score: 0, nodeCount: 0 },
  { studio: 'brand',      label: 'Brand',      route: 'brand',      score: 0, nodeCount: 0 },
  { studio: 'components', label: 'Components', route: 'components', score: 0, nodeCount: 0 },
  { studio: 'design',     label: 'Design',     route: 'design',     score: 0, nodeCount: 0 },
  { studio: 'workflows',  label: 'Workflows',  route: 'workflows',  score: 0, nodeCount: 0 },
  { studio: 'pages',      label: 'Pages',      route: 'pages',      score: 0, nodeCount: 0 },
  { studio: 'code',       label: 'Code',       route: 'code',       score: 0, nodeCount: 0 },
  { studio: 'testing',    label: 'Testing',    route: 'testing',    score: 0, nodeCount: 0 },
  { studio: 'analytics',  label: 'Analytics',  route: 'analytics',  score: 0, nodeCount: 0 },
]

export function HealthScore() {
  const params  = useParams<{ orgSlug: string; productSlug: string }>()
  const router  = useRouter()
  const product = useProduct()
  const productId = product?.id ?? ''

  const { data, isLoading } = trpc.controlTower.getHealthSummary.useQuery(
    { productId },
    { staleTime: 30_000, enabled: !!productId },
  )

  const overall = data?.overall ?? 0
  const studios = (data?.studioScores?.length ?? 0) > 0 ? data!.studioScores : FALLBACK_STUDIOS
  const isEmpty = data?.isEmpty ?? false

  const radius       = 70
  const circumference = 2 * Math.PI * radius
  const color        = getScoreColor(overall)

  const strokeOffset = useMotionValue(circumference)
  useEffect(() => {
    animate(strokeOffset, circumference * (1 - overall / 100), { duration: 1.5, ease: 'easeOut' })
  }, [strokeOffset, overall, circumference])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 flex flex-col items-center gap-4 h-full"
    >
      {/* Title */}
      <div className="flex items-center gap-2 self-start">
        <Heart className="w-4 h-4 text-[var(--accent)]" />
        <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Product Health</span>
        {isLoading && <Loader2 size={11} className="animate-spin text-[var(--text-tertiary)]" />}
      </div>

      {/* Gauge */}
      <div className="relative flex items-center justify-center">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
          <motion.circle
            cx="90" cy="90" r={radius}
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: strokeOffset }}
            transform="rotate(-90 90 90)"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          {isLoading ? (
            <Loader2 size={24} className="animate-spin text-[var(--text-tertiary)]" />
          ) : (
            <>
              <AnimatedScore target={overall} />
              <span className="text-xs text-[var(--text-tertiary)]">/ 100</span>
              {isEmpty && <span className="text-[9px] text-[var(--text-tertiary)] mt-0.5">no data yet</span>}
            </>
          )}
        </div>
      </div>

      {/* Per-studio bars — clickable, navigate to studio */}
      <div className="w-full grid grid-cols-2 gap-2">
        {studios.map((s, i) => {
          const sc = getScoreColor(s.score)
          return (
            <motion.button
              key={s.studio}
              onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${s.route}`)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + i * 0.05, duration: 0.3 }}
              className="flex flex-col gap-1 text-left group hover:bg-white/[0.03] rounded-lg p-1 -mx-1 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)] group-hover:text-[#F1F5F9] transition-colors flex items-center gap-0.5">
                  {s.label}
                  <ArrowRight size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="text-[10px] font-semibold" style={{ color: sc }}>{s.score}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: sc }}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.score}%` }}
                  transition={{ delay: 0.55 + i * 0.05, duration: 0.7, ease: 'easeOut' }}
                />
              </div>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
