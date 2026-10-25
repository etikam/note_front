import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Checkbox } from '@/shared/ui/Checkbox'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Skeleton } from '@/shared/ui/Skeleton'

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

function nextOrdering(current, field) {
  if (current === field) return `-${field}`
  if (current === `-${field}`) return null
  return field
}

/**
 * Table dense triée et paginée côté serveur, avec sélection optionnelle.
 * ``columns`` : ``[{ key, header, cell(row), orderingField?, align?, className?, headerClassName? }]``.
 * ``ordering`` : chaîne DRF (``last_name`` / ``-last_name``) ; ``selection`` : ``{ ids: Set, onChange(Set) }``.
 */
export function ServerTable({
  columns,
  rows,
  getRowId = (r) => r.id,
  loading = false,
  error = null,
  empty,
  ordering,
  onOrderingChange,
  onRowClick,
  selection,
  activeRowId,
  footer,
  className,
}) {
  const ids = rows.map(getRowId)
  const selectedOnPage = selection ? ids.filter((id) => selection.ids.has(id)).length : 0
  const allOnPage = ids.length > 0 && selectedOnPage === ids.length
  const colCount = columns.length + (selection ? 1 : 0)

  function togglePage(on) {
    const next = new Set(selection.ids)
    for (const id of ids) {
      if (on) next.add(id)
      else next.delete(id)
    }
    selection.onChange(next)
  }

  function toggleRow(id, on) {
    const next = new Set(selection.ids)
    if (on) next.add(id)
    else next.delete(id)
    selection.onChange(next)
  }

  let body
  if (loading && !rows.length) {
    body = Array.from({ length: 8 }, (_, i) => (
      <tr key={`sk-${i}`} className="border-b border-[var(--app-border)]">
        {Array.from({ length: colCount }, (_, j) => (
          <td key={j} className="px-4 py-3.5">
            <Skeleton className={cn('h-3.5', j === 0 && selection ? 'w-4' : i % 2 ? 'w-3/5' : 'w-4/5')} />
          </td>
        ))}
      </tr>
    ))
  } else if (error || !rows.length) {
    body = (
      <tr>
        <td colSpan={colCount}>
          {error ? (
            <EmptyState tone="error" compact title="Chargement impossible" description={error.message} onRetry={error.onRetry} />
          ) : (
            <EmptyState compact title={empty?.title ?? 'Aucun élément'} description={empty?.description} action={empty?.action} />
          )}
        </td>
      </tr>
    )
  } else {
    body = rows.map((row) => {
      const id = getRowId(row)
      const checked = selection?.ids.has(id)
      return (
        <tr
          key={id}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          onKeyDown={onRowClick ? (e) => e.key === 'Enter' && e.target === e.currentTarget && onRowClick(row) : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          aria-selected={selection ? Boolean(checked) : undefined}
          className={cn(
            'border-b border-[var(--app-border)] last:border-0 transition-colors',
            onRowClick && 'cursor-pointer hover:bg-[var(--app-hover)] focus-visible:bg-[var(--app-hover)] focus-visible:outline-none',
            (checked || activeRowId === id) && 'bg-brand-50/60 dark:bg-white/[0.04]',
            loading && 'opacity-60',
          )}
        >
          {selection ? (
            <td className="w-10 py-2.5 pl-4 pr-0 align-middle" onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={Boolean(checked)} onChange={(on) => toggleRow(id, on)} />
            </td>
          ) : null}
          {columns.map((c) => (
            <td key={c.key} className={cn('px-4 py-2.5 align-middle text-[13px] text-[var(--app-fg)]', ALIGN[c.align ?? 'left'], c.className)}>
              {c.cell(row)}
            </td>
          ))}
        </tr>
      )
    })
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead className="bg-[var(--app-subtle)]">
            <tr className="border-b border-[var(--app-border)]">
              {selection ? (
                <th className="w-10 py-2.5 pl-4 pr-0">
                  <Checkbox checked={allOnPage} indeterminate={selectedOnPage > 0 && !allOnPage} onChange={togglePage} disabled={!rows.length} />
                </th>
              ) : null}
              {columns.map((c) => {
                const field = c.orderingField
                const active = field && (ordering === field || ordering === `-${field}`)
                const desc = ordering === `-${field}`
                const Icon = !active ? ChevronsUpDown : desc ? ArrowDown : ArrowUp
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (desc ? 'descending' : 'ascending') : undefined}
                    className={cn(
                      'whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--app-muted)]',
                      ALIGN[c.align ?? 'left'],
                      c.headerClassName,
                    )}
                  >
                    {field && onOrderingChange ? (
                      <button
                        type="button"
                        onClick={() => onOrderingChange(nextOrdering(ordering, field))}
                        className={cn('inline-flex items-center gap-1 rounded uppercase tracking-[0.06em] hover:text-[var(--app-fg)]', active && 'text-[var(--app-fg)]')}
                      >
                        {c.header}
                        <Icon size={12} className={active ? '' : 'opacity-50'} aria-hidden />
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
      {footer}
    </div>
  )
}
