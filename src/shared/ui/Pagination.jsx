import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

function pageWindow(page, totalPages, size = 5) {
  let start = Math.max(1, page - Math.floor(size / 2))
  const end = Math.min(totalPages, start + size - 1)
  start = Math.max(1, end - size + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * Pied de table paginée côté serveur : « 21–40 sur 163 », taille de page, pages.
 * ``onPageSizeChange`` est optionnel.
 */
export function Pagination({ page, pageSize, count, onPageChange, pageSizeOptions = [20, 50, 100], onPageSizeChange, className }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)
  const btn =
    'flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[12.5px] tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]'
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] px-4 py-2.5 text-[12.5px] text-[var(--app-muted)]', className)}>
      <div className="flex items-center gap-3">
        <span className="tabular-nums">
          {from}–{to} sur <span className="font-medium text-[var(--app-fg)]">{count}</span>
        </span>
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5">
            <span className="sr-only sm:not-sr-only">Lignes</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-[var(--app-border)] bg-[var(--app-elevated)] px-1.5 text-[12.5px] text-[var(--app-fg)]"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      {totalPages > 1 ? (
        <nav className="flex items-center gap-0.5" aria-label="Pagination">
          <button type="button" className={cn(btn, 'hover:bg-[var(--app-hover)]')} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Page précédente">
            <ChevronLeft size={15} aria-hidden />
          </button>
          {pageWindow(page, totalPages).map((n) => (
            <button
              key={n}
              type="button"
              aria-current={n === page ? 'page' : undefined}
              onClick={() => onPageChange(n)}
              className={cn(btn, n === page ? 'bg-[var(--app-fg)] font-semibold text-[var(--app-canvas)]' : 'text-[var(--app-fg-soft)] hover:bg-[var(--app-hover)]')}
            >
              {n}
            </button>
          ))}
          <button type="button" className={cn(btn, 'hover:bg-[var(--app-hover)]')} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Page suivante">
            <ChevronRight size={15} aria-hidden />
          </button>
        </nav>
      ) : null}
    </div>
  )
}
