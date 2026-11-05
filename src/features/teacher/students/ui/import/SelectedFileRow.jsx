import { FileSpreadsheet, RefreshCw, X } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} Mo`
}

/**
 * Fichier choisi : nom, taille, lignes détectées ; retirer (et donc en choisir un autre).
 *
 * @param {{
 *   file: File
 *   dataRowCount?: number | null
 *   busy: boolean
 *   onClear: () => void
 * }} props
 */
export function SelectedFileRow({ file, dataRowCount, busy, onClear }) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <span
        className={cn(
          'relative flex h-12 w-11 shrink-0 items-end justify-center rounded-lg pb-1.5 text-white shadow-sm',
          ext === 'csv' ? 'bg-gradient-to-b from-brand-500 to-brand-700' : 'bg-gradient-to-b from-green-500 to-green-700',
        )}
        aria-hidden
      >
        <FileSpreadsheet size={16} className="absolute top-2" />
        <span className="font-mono text-[9px] font-bold uppercase tracking-wide">{ext}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-[var(--app-fg)]" title={file.name}>
          {file.name}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-2 text-[12px] text-[var(--app-muted)]">
          <span className="tabular-nums">{formatFileSize(file.size)}</span>
          {dataRowCount != null ? (
            <span className="tabular-nums">
              · <span className="font-medium text-[var(--app-fg-soft)]">{dataRowCount}</span> ligne{dataRowCount > 1 ? 's' : ''} de données
            </span>
          ) : null}
          {file.lastModified ? <span>· modifié le {new Date(file.lastModified).toLocaleDateString('fr-FR')}</span> : null}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        disabled={busy}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-[var(--app-fg-soft)] hover:bg-[var(--app-hover)] disabled:opacity-50"
        title="Choisir un autre fichier"
      >
        <RefreshCw size={13} aria-hidden /> Changer
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={busy}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-500/10"
        aria-label="Retirer le fichier"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  )
}
