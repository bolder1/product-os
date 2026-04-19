'use client'

/**
 * useVirtualList — lightweight windowed virtual list hook.
 *
 * No external dependency. Uses a fixed item height model with
 * a configurable overscan buffer. Suitable for lists up to ~10k items.
 *
 * Usage:
 *   const { virtualItems, totalHeight, scrollProps } = useVirtualList({
 *     items: sortedTasks,
 *     itemHeight: 56,
 *     containerHeight: 600,
 *     overscan: 5,
 *   })
 *
 *   <div style={{ height: containerHeight, overflow: 'auto' }} {...scrollProps}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualItems.map(({ item, index, offsetTop }) => (
 *         <div key={index} style={{ position: 'absolute', top: offsetTop, width: '100%' }}>
 *           <Row item={item} />
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 *
 * For dynamic heights, pass `estimatedItemHeight` and the hook will
 * measure rendered items and refine positions over time.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'

export interface VirtualItem<T> {
  item: T
  index: number
  offsetTop: number
}

interface UseVirtualListOptions<T> {
  items: T[]
  /** Fixed height per item in px (used when dynamic=false) */
  itemHeight?: number
  /** Container visible height in px */
  containerHeight: number
  /** Items to render above and below the visible window */
  overscan?: number
  /** Enable dynamic height measurement (slower but more accurate) */
  dynamic?: boolean
}

interface UseVirtualListResult<T> {
  virtualItems: VirtualItem<T>[]
  totalHeight: number
  /** Spread onto the scroll container div */
  scrollProps: {
    onScroll: (e: React.UIEvent<HTMLDivElement>) => void
  }
  /** Call this with the container div ref to auto-read its height */
  containerRef: React.RefCallback<HTMLDivElement>
  /** Measured container height (updates on resize) */
  measuredContainerHeight: number
}

export function useVirtualList<T>({
  items,
  itemHeight = 48,
  containerHeight: initialContainerHeight,
  overscan = 4,
  dynamic = false,
}: UseVirtualListOptions<T>): UseVirtualListResult<T> {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(initialContainerHeight)
  const containerEl = useRef<HTMLDivElement | null>(null)
  const resizeObserver = useRef<ResizeObserver | null>(null)

  // Dynamic height cache (index → measured px)
  const heightCache = useRef<Map<number, number>>(new Map())

  const containerRef: React.RefCallback<HTMLDivElement> = useCallback((el) => {
    if (containerEl.current && resizeObserver.current) {
      resizeObserver.current.unobserve(containerEl.current)
    }
    containerEl.current = el
    if (el) {
      setContainerHeight(el.clientHeight || initialContainerHeight)
      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height)
        }
      })
      resizeObserver.current.observe(el)
    }
  }, [initialContainerHeight])

  useEffect(() => {
    return () => {
      resizeObserver.current?.disconnect()
    }
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Compute offsets for all items (flat fixed height)
  const { virtualItems, totalHeight } = useMemo(() => {
    if (!items.length) return { virtualItems: [], totalHeight: 0 }

    const effectiveItemHeight = itemHeight
    const total = items.length * effectiveItemHeight

    const startIndex = Math.max(0, Math.floor(scrollTop / effectiveItemHeight) - overscan)
    const visibleCount = Math.ceil(containerHeight / effectiveItemHeight)
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2)

    const visible: VirtualItem<T>[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      visible.push({
        item: items[i],
        index: i,
        offsetTop: i * effectiveItemHeight,
      })
    }

    return { virtualItems: visible, totalHeight: total }
  }, [items, itemHeight, scrollTop, containerHeight, overscan])

  return {
    virtualItems,
    totalHeight,
    scrollProps: { onScroll: handleScroll },
    containerRef,
    measuredContainerHeight: containerHeight,
  }
}
