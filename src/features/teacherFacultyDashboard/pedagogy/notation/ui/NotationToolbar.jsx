import { useRef } from 'react'

import { FileDown, FileSpreadsheet, FileText, Search, Upload } from 'lucide-react'

import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

const LABEL = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'

/**
 * @param {{
 *   q: string
 *   onQChange: (v: string) => void
 *   total: number
 *   filtered: number
 *   canEditGrades?: boolean
 *   importBusy?: boolean
 *   onDownloadTemplate?: () => void
 *   onExportXlsx?: () => void
 *   onExportPdf?: () => void
 *   onImportFileSelected?: (file: File) => void
 * }} props
 */
export function NotationToolbar({
  q,
  onQChange,
  total,
  filtered,
  canEditGrades = false,
  importBusy = false,
  onDownloadTemplate,
  onExportXlsx,
  onExportPdf,
  onImportFileSelected,
}) {
  const fileRef = useRef(null)

  return (
    <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 dark:border-[var(--app-border)] sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <label htmlFor="notation-search" className={LABEL}>
          Recherche
        </label>
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            id="notation-search"
            type="search"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Matricule, nom…"
            className={cn(
              'h-10 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm',
              'placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50',
              'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_95%,black)]',
            )}
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        {canEditGrades ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImportFileSelected?.(f)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              disabled={importBusy}
              onClick={() => onDownloadTemplate?.()}
            >
              <FileDown size={14} className="shrink-0" aria-hidden />
              Modèle Excel
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              disabled={importBusy}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} className="shrink-0" aria-hidden />
              Importer
            </Button>
            <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={() => onExportXlsx?.()}>
              <FileSpreadsheet size={14} className="shrink-0" aria-hidden />
              Excel
            </Button>
            <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={() => onExportPdf?.()}>
              <FileText size={14} className="shrink-0" aria-hidden />
              PDF
            </Button>
          </div>
        ) : null}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {filtered === total ? (
            <span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{total}</span> inscrit
              {total === 1 ? '' : 's'} approuvé{total === 1 ? '' : 's'}
            </span>
          ) : (
            <span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{filtered}</span> sur {total}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
