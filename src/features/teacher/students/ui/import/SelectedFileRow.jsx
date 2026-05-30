import { FileSpreadsheet, X } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

/**
 * @param {{
 *   file: File
 *   dataRowCount?: number | null
 *   busy: boolean
 *   onClear: () => void
 * }} props
 */
export function SelectedFileRow({ file, dataRowCount, busy, onClear }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3',
        'border-zinc-200 bg-white shadow-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <FileSpreadsheet className="shrink-0 text-brand-600 dark:text-brand-400" size={22} aria-hidden />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{file.name}</div>
          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {(file.size / 1024).toFixed(1)} Ko
            {dataRowCount != null ? ` · ${dataRowCount} ligne(s) de données` : ''}
          </div>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 px-2"
        onClick={onClear}
        disabled={busy}
        aria-label="Retirer le fichier"
      >
        <X size={18} aria-hidden />
      </Button>
    </div>
  )
}
