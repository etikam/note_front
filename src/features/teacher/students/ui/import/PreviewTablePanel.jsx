import { ListOrdered } from 'lucide-react'

import { PREVIEW_ROW_CAP, importTableClassName } from '@/features/teacher/students/ui/import/import.constants'
import { cn } from '@/shared/lib/cn'

/**
 * @param {{
 *   headers: string[]
 *   dataRows: string[][]
 *   totalDataRows: number
 * }} props
 */
export function PreviewTablePanel({ headers, dataRows, totalDataRows }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-l-[3px] border-l-orange-500',
        'border-zinc-200/90 bg-white shadow-[0_6px_24px_-12px_rgba(15,23,42,0.1)]',
        'dark:border-[var(--app-border)] dark:border-l-orange-500 dark:bg-[var(--app-elevated)] dark:shadow-[0_12px_34px_-14px_rgba(0,0,0,0.5)]',
        'ring-1 ring-black/[0.02] dark:ring-white/5',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50/90 px-4 py-2.5 text-xs font-medium text-zinc-600 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)] dark:text-zinc-300">
        <span className="inline-flex items-center gap-1.5">
          <ListOrdered size={14} className="text-zinc-400" aria-hidden />
          Aperçu ({PREVIEW_ROW_CAP} premières lignes)
        </span>
        {totalDataRows > PREVIEW_ROW_CAP ? (
          <span className="rounded-full bg-zinc-200/80 px-2 py-0.5 text-[11px] text-zinc-700 dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)] dark:text-zinc-200">
            + {totalDataRows - PREVIEW_ROW_CAP} lignes supplémentaires
          </span>
        ) : null}
      </div>
      <div className="max-h-[min(22rem,50vh)] overflow-auto">
        <table className={importTableClassName}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td key={ci}>{row[ci] ?? ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
