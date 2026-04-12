'use client'

import * as React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DataTableColumn<T> {
  key: string
  header: string
  /** Render a custom cell; defaults to `row[key]` */
  render?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  /** Unique key accessor for each row */
  rowKey: (row: T) => string | number
  selectable?: boolean
  selectedKeys?: Set<string | number>
  onSelectionChange?: (keys: Set<string | number>) => void
  /** Page size (0 = no pagination) */
  pageSize?: number
  className?: string
  emptyMessage?: string
}

type SortDir = 'asc' | 'desc' | null

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedKeys,
  onSelectionChange,
  pageSize = 0,
  className,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDir, setSortDir] = React.useState<SortDir>(null)
  const [page, setPage] = React.useState(0)

  // Internal selection when uncontrolled
  const [internalSelected, setInternalSelected] = React.useState<Set<string | number>>(new Set())
  const selected = selectedKeys ?? internalSelected
  const setSelected = onSelectionChange ?? setInternalSelected

  /* Sorting */
  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null || bv == null) return 0
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  /* Pagination */
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const paginated = pageSize > 0 ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted

  React.useEffect(() => {
    setPage(0)
  }, [data.length, sortKey, sortDir])

  const toggleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir(null)
    }
  }

  const toggleRow = (key: string | number) => {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map(rowKey)))
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3.5 w-3.5 text-[#64748B]" />
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-indigo-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-indigo-400" />
    )
  }

  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/[0.08]">
            {selectable && (
              <th className="w-10 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && selected.size === paginated.length}
                  onChange={toggleAll}
                  className="accent-indigo-600"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2.5 text-left font-medium text-[#94A3B8] whitespace-nowrap',
                  col.sortable && 'cursor-pointer select-none hover:text-[#F1F5F9] transition-colors',
                  col.className
                )}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <span className="inline-flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && <SortIcon col={col.key} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-3 py-12 text-center text-[#64748B]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginated.map((row, i) => {
              const key = rowKey(row)
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-b border-white/[0.04] transition-colors',
                    'hover:bg-white/[0.02]',
                    selected.has(key) && 'bg-indigo-500/5'
                  )}
                >
                  {selectable && (
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggleRow(key)}
                        className="accent-indigo-600"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-3 py-2.5 text-[#F1F5F9]', col.className)}
                    >
                      {col.render ? col.render(row, i) : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {pageSize > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.08] px-3 py-2.5">
          <span className="text-xs text-[#64748B]">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md p-1 text-[#94A3B8] hover:bg-white/[0.05] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md p-1 text-[#94A3B8] hover:bg-white/[0.05] disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { DataTable }
