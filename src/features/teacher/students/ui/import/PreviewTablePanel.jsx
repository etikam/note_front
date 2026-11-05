import { Eye } from 'lucide-react'

import { PREVIEW_ROW_CAP } from '@/features/teacher/students/ui/import/import.constants'
import { cn } from '@/shared/lib/cn'

const norm = (h) => String(h).trim().toLowerCase().replace(/\s+/g, '_')

/**
 * Aperçu des premières lignes, façon tableur : n° de ligne, colonnes obligatoires repérées,
 * cellules obligatoires vides signalées.
 *
 * @param {{
 *   headers: string[]
 *   dataRows: string[][]
 *   totalDataRows: number
 *   requiredKeys?: string[]
 * }} props
 */
export function PreviewTablePanel({ headers, dataRows, totalDataRows, requiredKeys = [] }) {
  const required = new Set(requiredKeys.map(norm))
  const isRequired = headers.map((h) => required.has(norm(h)))
  const emptyRequired = dataRows.reduce((n, row) => n + headers.filter((_, ci) => isRequired[ci] && !String(row[ci] ?? '').trim()).length, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--app-border)] bg-[var(--app-subtle)] px-4 py-2.5 text-[12px]">
        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--app-fg-soft)]">
          <Eye size={14} className="text-[var(--app-muted)]" aria-hidden />
          Aperçu · {Math.min(PREVIEW_ROW_CAP, totalDataRows)} première{totalDataRows > 1 ? 's' : ''} ligne{totalDataRows > 1 ? 's' : ''} sur {totalDataRows}
        </span>
        {emptyRequired ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-600/15 dark:bg-red-500/10 dark:text-red-300">
            {emptyRequired} cellule{emptyRequired > 1 ? 's' : ''} obligatoire{emptyRequired > 1 ? 's' : ''} vide{emptyRequired > 1 ? 's' : ''}
          </span>
        ) : null}
      </div>
      <div className="max-h-[min(24rem,55vh)] overflow-auto">
        <table className="w-max min-w-full border-separate border-spacing-0 text-left text-[12.5px]">
          <thead className="sticky top-0 z-[1]">
            <tr>
              <th className="sticky left-0 z-[2] w-10 border-b border-r border-[var(--app-border)] bg-[var(--app-subtle)] px-2 py-2 text-center text-[10.5px] font-normal text-[var(--app-muted)]">#</th>
              {headers.map((h, ci) => (
                <th
                  key={`${h}-${ci}`}
                  className={cn(
                    'whitespace-nowrap border-b border-[var(--app-border)] px-3 py-2 font-mono text-[11.5px] font-semibold',
                    isRequired[ci] ? 'bg-brand-50 text-brand-800 dark:bg-[color-mix(in_srgb,var(--app-subtle)_70%,#2563eb)] dark:text-brand-100' : 'bg-[var(--app-subtle)] text-[var(--app-fg-soft)]',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} className="hover:bg-[var(--app-hover)]">
                <td className="sticky left-0 border-b border-r border-[var(--app-border)] bg-[var(--app-elevated)] px-2 py-1.5 text-center text-[10.5px] tabular-nums text-[var(--app-muted)]">{ri + 2}</td>
                {headers.map((_, ci) => {
                  const value = row[ci] ?? ''
                  const missing = isRequired[ci] && !String(value).trim()
                  return (
                    <td
                      key={ci}
                      className={cn('whitespace-nowrap border-b border-[var(--app-border)] px-3 py-1.5 text-[var(--app-fg)]', missing && 'bg-red-50 dark:bg-red-500/10')}
                      title={missing ? 'Valeur obligatoire manquante' : undefined}
                    >
                      {missing ? <span className="text-[11px] italic text-red-600 dark:text-red-300">vide</span> : value}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalDataRows > PREVIEW_ROW_CAP ? (
        <p className="border-t border-[var(--app-border)] px-4 py-2 text-[11.5px] text-[var(--app-muted)]">
          … et {totalDataRows - PREVIEW_ROW_CAP} autre{totalDataRows - PREVIEW_ROW_CAP > 1 ? 's' : ''} ligne{totalDataRows - PREVIEW_ROW_CAP > 1 ? 's' : ''}, toutes contrôlées.
        </p>
      ) : null}
    </div>
  )
}
