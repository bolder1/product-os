'use client'

/**
 * ActivityFeed — unified activity timeline usable in any workspace.
 *
 * Reads from useActivityStore and filters by productId + optional studio.
 *
 * Usage:
 *   <ActivityFeed productId={productId} />
 *   <ActivityFeed productId={productId} studio="design" maxItems={20} />
 */

import { useMemo } from 'react'
import { useActivityStore } from '../../lib/activity-store'
import { useVirtualList } from '../../lib/use-virtual-list'
import { Clock } from 'lucide-react'

const ITEM_HEIGHT = 56
const VIRTUAL_THRESHOLD = 30

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return 'just now'
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const TYPE_COLORS: Record<string, string> = {
  brand_updated:      'bg-purple-500/20 text-purple-400',
  component_created:  'bg-cyan-500/20 text-cyan-400',
  workflow_updated:   'bg-orange-500/20 text-orange-400',
  approval_decided:   'bg-green-500/20 text-green-400',
  task_completed:     'bg-emerald-500/20 text-emerald-400',
  page_published:     'bg-blue-500/20 text-blue-400',
  spec_approved:      'bg-indigo-500/20 text-indigo-400',
}

interface ActivityFeedProps {
  productId: string
  studio?: string
  maxItems?: number
  /** Compact = minimal padding, used inside sidebars */
  compact?: boolean
}

function ActivityRow({ item, compact }: { item: ReturnType<typeof useActivityStore.getState>['activities'][0]; compact?: boolean }) {
  const colorClass = TYPE_COLORS[item.type] ?? 'bg-[var(--bg-overlay)] text-[var(--text-secondary)]'
  return (
    <div
      className={`flex items-start gap-2.5 ${compact ? 'px-3 py-2' : 'px-4 py-3'} hover:bg-[var(--surface-hover)] transition-colors`}
    >
      <div
        className={`shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-semibold mt-0.5 ${colorClass}`}
        aria-hidden="true"
      >
        {item.actor?.initials ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[var(--text-primary)] leading-snug line-clamp-2">{item.title}</p>
        {item.description && (
          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 line-clamp-1">{item.description}</p>
        )}
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
          <time dateTime={item.timestamp}>{timeAgo(item.timestamp)}</time>
        </p>
      </div>
    </div>
  )
}

export function ActivityFeed({ productId, studio, maxItems = 50, compact }: ActivityFeedProps) {
  const allActivities = useActivityStore((s) => s.activities)

  const items = useMemo(() => {
    return allActivities
      .filter((a) => a.productId === productId && (!studio || a.studio === studio))
      .slice(0, maxItems)
  }, [allActivities, productId, studio, maxItems])

  const shouldVirtualize = items.length > VIRTUAL_THRESHOLD

  const { virtualItems, totalHeight, scrollProps, containerRef } = useVirtualList({
    items,
    itemHeight: ITEM_HEIGHT,
    containerHeight: 400,
    overscan: 4,
  })

  if (items.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 text-[var(--text-tertiary)] ${compact ? 'py-6' : 'py-12'}`}>
        <Clock size={16} className="opacity-40" aria-hidden="true" />
        <span className="text-[11px]">No activity yet</span>
      </div>
    )
  }

  if (shouldVirtualize) {
    return (
      <div
        ref={containerRef}
        className="overflow-y-auto"
        style={{ height: 400 }}
        role="feed"
        aria-label="Activity feed"
        aria-busy={false}
        {...scrollProps}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {virtualItems.map(({ item, offsetTop }) => (
            <div key={item.id} style={{ position: 'absolute', top: offsetTop, width: '100%', height: ITEM_HEIGHT }}>
              <ActivityRow item={item} compact={compact} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-0' : 'gap-px'}`} role="feed" aria-label="Activity feed">
      {items.map((item) => (
        <ActivityRow key={item.id} item={item} compact={compact} />
      ))}
    </div>
  )
}
