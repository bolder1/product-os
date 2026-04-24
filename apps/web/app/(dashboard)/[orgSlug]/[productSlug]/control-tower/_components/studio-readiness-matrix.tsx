'use client'

import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { LayoutGrid, CheckCircle2, XCircle, Minus, ArrowRight, Loader2, RefreshCw } from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'

// Studios shown as rows
const STUDIOS = [
  { key: 'planner',    label: 'Planner',    route: 'planner'    },
  { key: 'brand',      label: 'Brand',      route: 'brand'      },
  { key: 'components', label: 'Components', route: 'components' },
  { key: 'design',     label: 'Design',     route: 'design'     },
  { key: 'pages',      label: 'Pages',      route: 'pages'      },
  { key: 'code',       label: 'Code',       route: 'code'       },
  { key: 'workflows',  label: 'Workflows',  route: 'workflows'  },
  { key: 'testing',    label: 'Testing',    route: 'testing'    },
  { key: 'releases',   label: 'Releases',   route: 'releases'   },
  { key: 'analytics',  label: 'Analytics',  route: 'analytics'  },
]

// Completeness dimensions shown as columns
const DIMENSIONS = [
  { key: 'setup',      label: 'Setup'   },
  { key: 'content',    label: 'Content' },
  { key: 'reviewed',   label: 'Reviewed'},
  { key: 'linked',     label: 'Linked'  },
  { key: 'tested',     label: 'Tested'  },
]

type CellState = 'done' | 'partial' | 'missing' | 'na'

interface MatrixRow {
  studio: string
  dimensions: Record<string, CellState>
  score: number
}

/**
 * Derives a mock matrix from studio score data.
 * A real implementation would pull section-level completeness from the graph.
 */
function deriveMatrix(studioScores: Array<{ studio: string; score: number }>): MatrixRow[] {
  return STUDIOS.map((s) => {
    const score = studioScores.find((ss) => ss.studio === s.key)?.score ?? 0
    const dims: Record<string, CellState> = {}
    DIMENSIONS.forEach((d, i) => {
      const threshold = (i + 1) * 20 // 20, 40, 60, 80, 100
      dims[d.key] = score >= threshold ? 'done' : score >= threshold - 15 ? 'partial' : 'missing'
    })
    return { studio: s.key, dimensions: dims, score }
  })
}

function CellIcon({ state }: { state: CellState }) {
  if (state === 'done')    return <CheckCircle2 size={12} className="text-[var(--color-success)]" />
  if (state === 'partial') return <div className="w-2.5 h-2.5 rounded-sm bg-[var(--color-warning)]/40 border border-[var(--color-warning)]/60" />
  if (state === 'missing') return <XCircle size={12} className="text-[var(--color-error)]/60" />
  return <Minus size={10} className="text-[var(--border-default)]" />
}

export function StudioReadinessMatrix({ productId }: { productId: string }) {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const router = useRouter()

  const { data, isLoading, refetch } = trpc.controlTower.getHealthSummary.useQuery(
    { productId },
    { staleTime: 30_000, enabled: !!productId },
  )

  const studioScores = data?.studioScores ?? []
  const matrix = deriveMatrix(studioScores)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Studio Readiness Matrix</span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[var(--text-tertiary)]">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-[11px]">Computing readiness…</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="text-left text-[var(--text-tertiary)] font-medium pb-2 pr-3 w-[100px]">Studio</th>
                {DIMENSIONS.map((d) => (
                  <th key={d.key} className="text-center text-[var(--text-tertiary)] font-medium pb-2 px-2">{d.label}</th>
                ))}
                <th className="text-right text-[var(--text-tertiary)] font-medium pb-2 pl-3 w-[48px]">Score</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, ri) => {
                const studio = STUDIOS[ri]!
                const scoreColor = row.score >= 70 ? '#10B981' : row.score >= 35 ? '#F59E0B' : '#F43F5E'
                return (
                  <motion.tr
                    key={row.studio}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ri * 0.04, duration: 0.25 }}
                    className="group border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/${studio.route}`)}
                  >
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--text-secondary)] group-hover:text-[#F1F5F9] transition-colors font-medium">{studio.label}</span>
                        <ArrowRight size={8} className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] transition-opacity" />
                      </div>
                    </td>
                    {DIMENSIONS.map((d) => (
                      <td key={d.key} className="text-center py-2 px-2">
                        <div className="flex items-center justify-center">
                          <CellIcon state={row.dimensions[d.key] ?? 'na'} />
                        </div>
                      </td>
                    ))}
                    <td className="text-right py-2 pl-3">
                      <span className="font-semibold tabular-nums" style={{ color: scoreColor }}>{row.score}%</span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.06] text-[9px] text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1"><CheckCircle2 size={9} className="text-[var(--color-success)]" /> Done</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[var(--color-warning)]/40 border border-[var(--color-warning)]/60" /> Partial</span>
        <span className="flex items-center gap-1"><XCircle size={9} className="text-[var(--color-error)]/60" /> Missing</span>
      </div>
    </motion.div>
  )
}
