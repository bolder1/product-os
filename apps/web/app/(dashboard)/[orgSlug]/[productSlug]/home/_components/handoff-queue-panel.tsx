'use client'

import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { ArrowDownToLine, ExternalLink, Loader2, FileStack, CheckCircle2 } from 'lucide-react'
import { trpc } from '../../../../../lib/trpc'

interface Props { productId: string }

export function HandoffQueuePanel({ productId }: Props) {
  const router = useRouter()
  const params = useParams<{ orgSlug: string; productSlug: string }>()

  const { data, isLoading } = trpc.handoff.list.useQuery(
    { productId },
    { staleTime: 30_000, enabled: !!productId },
  )

  // handoff.list returns graphNodes rows: { id, label, kind, data, ... }
  type HandoffNode = { id: string; label: string; data: Record<string, unknown> | null }
  const items: HandoffNode[] = (data ?? []) as HandoffNode[]
  // All returned rows are handoff_item nodes — show them all (no top-level status field)
  const pending = items

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowDownToLine size={13} className="text-[#F59E0B]" />
          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Handoff Queue</span>
          {pending.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] font-bold">
              {items.length}
            </span>
          )}
        </div>
        <button
          onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/handoff`)}
          className="text-[9px] text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-0.5 transition-colors"
        >
          Open <ExternalLink size={8} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center gap-2 text-[#475569]">
          <Loader2 size={13} className="animate-spin" />
          <span className="text-[11px]">Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-4">
          <CheckCircle2 size={20} className="text-[#10B981]" />
          <p className="text-[11px] text-[#475569]">No pending handoffs.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-1 overflow-y-auto pr-0.5">
          {items.slice(0, 6).map((h, i) => {
            const itemType = (h.data?.type as string | undefined) ?? 'item'
            return (
              <motion.button
                key={h.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => router.push(`/${params.orgSlug}/${params.productSlug}/handoff`)}
                className="w-full flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0 group text-left"
              >
                <FileStack size={10} className="text-[#F59E0B] shrink-0" />
                <span className="flex-1 text-[11px] text-[#E2E8F0] truncate group-hover:text-[#F1F5F9] transition-colors">
                  {h.label}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] font-semibold capitalize shrink-0">
                  {itemType}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
