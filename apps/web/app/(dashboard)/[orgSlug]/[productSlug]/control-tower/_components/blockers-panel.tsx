'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { AlertTriangle, AlertCircle, Info, ExternalLink, CheckCircle2, ShieldAlert, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { trpc } from '../../../../../lib/trpc'

interface Props {
  productId: string
}

type Severity = 'error' | 'warning' | 'info'

const SEVERITY_CONFIG: Record<Severity, { icon: React.ReactNode; color: string; label: string }> = {
  error:   { icon: <AlertCircle size={11} />,   color: '#F43F5E', label: 'Error'   },
  warning: { icon: <AlertTriangle size={11} />, color: '#F59E0B', label: 'Warning' },
  info:    { icon: <Info size={11} />,          color: '#3B82F6', label: 'Info'    },
}

export function BlockersPanel({ productId }: Props) {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const router = useRouter()
  const [expanded, setExpanded] = useState<Severity | null>('error')

  const { data, isLoading, refetch } = trpc.controlTower.getHealthSummary.useQuery(
    { productId },
    { staleTime: 30_000, enabled: !!productId },
  )

  const blockers = data?.blockers ?? []
  const errors   = blockers.filter((b) => b.severity === 'error')
  const warnings = blockers.filter((b) => b.severity === 'warning')
  const infos    = blockers.filter((b) => b.severity === 'info')

  const groups: Array<{ severity: Severity; items: typeof blockers }> = (
    [
      { severity: 'error' as Severity,   items: errors   },
      { severity: 'warning' as Severity, items: warnings },
      { severity: 'info' as Severity,    items: infos    },
    ] as Array<{ severity: Severity; items: typeof blockers }>
  ).filter((g) => g.items.length > 0)

  const isEmpty = data?.isEmpty ?? false
  const allClear = !isLoading && !isEmpty && blockers.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-[#F43F5E]" />
          <span className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">Blockers</span>
          {!isLoading && blockers.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F43F5E]/15 text-[#F43F5E] font-bold">
              {blockers.length}
            </span>
          )}
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
          <span className="text-[11px]">Scanning for blockers…</span>
        </div>
      ) : isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-4">
          <AlertTriangle size={22} className="text-[#334155]" />
          <p className="text-[11px] text-[#475569]">No product graph yet — apply a template to get started.</p>
        </div>
      ) : allClear ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-4">
          <div className="w-10 h-10 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-[#10B981]" />
          </div>
          <p className="text-[12px] font-semibold text-[#F1F5F9]">No blockers!</p>
          <p className="text-[10px] text-[#64748B]">Your product graph is complete across all studios.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
          {groups.map(({ severity, items }) => {
            const cfg   = SEVERITY_CONFIG[severity]
            const isOpen = expanded === severity

            return (
              <div key={severity} className="rounded-xl border overflow-hidden" style={{ borderColor: `${cfg.color}25` }}>
                {/* Group header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : severity)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left transition-colors hover:bg-white/[0.02]"
                  style={{ background: `${cfg.color}08` }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: cfg.color }}>{cfg.icon}</span>
                    <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>{cfg.label}s</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                      {items.length}
                    </span>
                  </div>
                  {isOpen ? <ChevronUp size={11} className="text-[#475569]" /> : <ChevronDown size={11} className="text-[#475569]" />}
                </button>

                {/* Items */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-white/[0.04]">
                        {items.map((blocker, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-2.5 px-3 py-2 group hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="w-1 h-1 rounded-full shrink-0" style={{ background: cfg.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-[#E2E8F0] leading-snug truncate">{blocker.title}</p>
                              <p className="text-[9px] text-[#475569] mt-0.5">{blocker.studio}</p>
                            </div>
                            <button
                              onClick={() =>
                                router.push(`/${params.orgSlug}/${params.productSlug}/${blocker.route}`)
                              }
                              className="shrink-0 flex items-center gap-0.5 text-[9px] text-[#475569] hover:text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-all"
                            >
                              Fix <ExternalLink size={8} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      {!isLoading && !isEmpty && blockers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center gap-3 text-[10px] text-[#64748B]">
          {errors.length > 0   && <span className="text-[#F43F5E]">{errors.length} error{errors.length > 1 ? 's' : ''}</span>}
          {warnings.length > 0 && <span className="text-[#F59E0B]">{warnings.length} warning{warnings.length > 1 ? 's' : ''}</span>}
          {infos.length > 0    && <span className="text-[#3B82F6]">{infos.length} info</span>}
        </div>
      )}
    </motion.div>
  )
}
