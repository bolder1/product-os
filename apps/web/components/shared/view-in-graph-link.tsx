'use client'

import { useParams, useRouter } from 'next/navigation'
import { Share2 } from 'lucide-react'

interface Props {
  nodeId: string
  className?: string
}

/**
 * A small pill/button that deep-links back to Graph Explorer
 * with the given node focused via ?focus=nodeId.
 */
export function ViewInGraphLink({ nodeId, className = '' }: Props) {
  const params = useParams<{ orgSlug: string; productSlug: string }>()
  const router = useRouter()

  const href = `/${params.orgSlug}/${params.productSlug}/graph-explorer?focus=${encodeURIComponent(nodeId)}`

  return (
    <button
      onClick={() => router.push(href)}
      title="View in Graph Explorer"
      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--accent-text)] hover:bg-[var(--accent-bg)] border border-[var(--border-default)] transition-all ${className}`}
    >
      <Share2 size={9} />
      Graph
    </button>
  )
}
