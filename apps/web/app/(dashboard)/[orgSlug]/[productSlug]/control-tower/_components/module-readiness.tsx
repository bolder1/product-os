'use client'

import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { Layers, AlertTriangle, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'

interface Props {
  productId: string
}

function ReadinessBar({ value, animate: doAnimate = true }: { value: number; animate?: boolean }) {
  const color = value >= 70 ? '#10B981' : value >= 35 ? '#F59E0B' : '#F43F5E'
  return (
    <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  )
}

function getReadinessLabel(score: number) {
  if (score >= 70) return { label: 'Ready',       color: '#10B981' }
  if (score >= 35) return { label: 'In progress', color: '#F59E0B' }
  return              { label: 'Blocked',       color: '#F43F5E' }
}

export function ModuleReadiness({ productId }: Props) {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const router = useRouter()

  const { data, isLoading, refetch } = trpc.controlTower.getHealthSummary.useQuery(
    { productId },
    { staleTime: 30_000, enabled: !!productId },
  )

  const modules = data?.modules ?? []
  const isEmpty = data?.isEmpty ?? false

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">Module Readiness</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="text-[#475569] hover:text-[#94A3B8] transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-[#475569]">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-[11px]">Computing readiness…</span>
        </div>
      ) : isEmpty || modules.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-4">
          <Layers size={22} className="text-[#334155]" />
          <p className="text-[11px] text-[#475569]">No modules yet. Apply a template or use the Planner to scaffold modules.</p>
          <button
            onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/planner`)}
            className="text-[10px] text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 transition-colors"
          >
            Open Planner <ArrowRight size={10} />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-0.5">
          {modules.map((mod, i) => {
            const { label: statusLabel, color } = getReadinessLabel(mod.readiness)
            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
                onClick={() =>
                  router.push(`/${params.orgSlug}/${params.productSlug}/graph-explorer?focus=${mod.id}`)
                }
              >
                {/* Module name + status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-medium text-[#F1F5F9] truncate flex-1">{mod.label}</span>
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ background: `${color}18`, color }}
                  >
                    {statusLabel}
                  </span>
                </div>

                {/* Readiness bar */}
                <ReadinessBar value={mod.readiness} />

                {/* Node kind counts */}
                <div className="flex items-center gap-3 mt-2 text-[9px] text-[#64748B]">
                  <span>{mod.featureCount} features</span>
                  <span>{mod.pageCount} pages</span>
                  <span>{mod.entityCount} entities</span>
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#3B82F6] flex items-center gap-0.5">
                    Graph <ArrowRight size={8} />
                  </span>
                </div>

                {/* Blockers */}
                {mod.blockers.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {mod.blockers.slice(0, 3).map((b) => (
                      <span
                        key={b}
                        className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      >
                        <AlertTriangle size={8} />
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Footer — overall score summary */}
      {data && !isEmpty && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-[#64748B]">
          <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            {modules.filter((m) => m.readiness >= 70).length > 0 && (
              <>
                <CheckCircle2 size={10} className="text-[#10B981]" />
                {modules.filter((m) => m.readiness >= 70).length} ready
              </>
            )}
          </span>
        </div>
      )}
    </motion.div>
  )
}
