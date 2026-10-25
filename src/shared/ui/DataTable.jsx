import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }
const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' })

function compare(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return collator.compare(String(a), String(b))
}

/**
 * Table de données dense.
 *
 * ``columns`` : ``[{ key, header, cell?(row), sortValue?(row), align?, className?, headerClassName? }]``
 * — une colonne est triable si elle fournit ``sortValue``.
 * ``empty`` : ``{ title, description?, action? }`` ; ``error`` : ``{ message, onRetry? }``.
 */
export function DataTable({
  columns,
  rows,
  getRowId = (row) => row.id,
  loading = false,
  error = null,
  empty,
  onRowClick,
  initialSort = null,
  rowClassName,
  caption,
  className,
  maxHeight,
}) {
  const [sort, setSort] = useState(initialSort)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const out = [...rows].sort((r1, r2) => compare(col.sortValue(r1), col.sortValue(r2)))
    return sort.dir === 'desc' ? out.reverse() : out
  }, [rows, sort, columns])

  function toggleSort(key) {
    setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))
  }

  const body = (() => {
    if (loading) {
      return Array.from({ length: 6 }, (_, i) => (
        <tr key={`sk-${i}`} className="border-b border-[var(--app-border)] last:border-0">
          {columns.map((c) => (
            <td key={c.key} className="px-4 py-3">
              <Skeleton className={cn('h-3.5', i % 2 ? 'w-3/5' : 'w-4/5')} />
            </td>
          ))}
        </tr>
      ))
    }
    if (error || !sorted.length) {
      return (
        <tr>
          <td colSpan={columns.length}>
            {error ? (
              <EmptyState tone="error" compact title="Chargement impossible" description={error.message} onRetry={error.onRetry} />
            ) : (
              <EmptyState compact title={empty?.title ?? 'Aucun élément'} description={empty?.description} action={empty?.action} />
            )}
          </td>
        </tr>
      )
    }
    return sorted.map((row) => (
      <tr
        key={getRowId(row)}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        onKeyDown={
          onRowClick
            ? (e) => {
                if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(row)
              }
            : undefined
        }
        tabIndex={onRowClick ? 0 : undefined}
        className={cn(
          'border-b border-[var(--app-border)] last:border-0 transition-colors',
          onRowClick && 'cursor-pointer hover:bg-[var(--app-hover)] focus-visible:bg-[var(--app-hover)] focus-visible:outline-none',
          rowClassName?.(row),
        )}
      >
        {columns.map((c) => (
          <td key={c.key} className={cn('px-4 py-2.5 align-middle text-[13px] text-[var(--app-fg)]', ALIGN[c.align ?? 'left'], c.className)}>
            {c.cell ? c.cell(row) : row[c.key]}
          </td>
        ))}
      </tr>
    ))
  })()

  return (
    <div
      className={cn('overflow-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]', className)}
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="w-full min-w-[640px] border-collapse">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="sticky top-0 z-[1] bg-[var(--app-subtle)]">
          <tr className="border-b border-[var(--app-border)]">
            {columns.map((c) => {
              const sortable = Boolean(c.sortValue)
              const active = sort?.key === c.key
              const SortIcon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--app-muted)]',
                    ALIGN[c.align ?? 'left'],
                    c.headerClassName,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded uppercase tracking-[0.06em] hover:text-[var(--app-fg)]',
                        active && 'text-[var(--app-fg)]',
                      )}
                    >
                      {c.header}
                      <SortIcon size={12} className={active ? '' : 'opacity-50'} aria-hidden />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  )
}
