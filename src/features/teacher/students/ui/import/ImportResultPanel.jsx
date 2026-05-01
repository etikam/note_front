import { CheckCircle2, FileSpreadsheet, ListOrdered, XCircle } from 'lucide-react'

import { importTableClassName } from '@/features/teacher/students/ui/import/import.constants'
import { cn } from '@/shared/lib/cn'

/**
 * @param {{ result: {
 *   created_count?: number
 *   skipped_count?: number
 *   error_count?: number
 *   errors?: { row: number; message: string }[]
 *   skipped?: { row: number; matricule: string; reason: string }[]
 * }}} props
 */
export function ImportResultPanel({ result }) {
  const created = result.created_count ?? 0
  const skipped = result.skipped_count ?? 0
  const errors = result.error_count ?? 0
  const hasDetail = (result.errors?.length ?? 0) > 0 || (result.skipped?.length ?? 0) > 0
  const clean = !hasDetail && errors === 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2 text-zinc-800 dark:text-zinc-100">
        <FileSpreadsheet className="text-brand-600 dark:text-brand-400" size={20} aria-hidden />
        <span className="text-sm font-medium">Synthèse</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3',
            'border-brand-200/80 bg-brand-50/80 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]',
          )}
        >
          <CheckCircle2 className="shrink-0 text-brand-600 dark:text-brand-400" size={20} aria-hidden />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-800/80 dark:text-brand-300/90">
              Créés
            </div>
            <div className="font-heading text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{created}</div>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3',
            'border-zinc-200 bg-zinc-50/90 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]',
          )}
        >
          <ListOrdered className="shrink-0 text-zinc-500 dark:text-zinc-400" size={20} aria-hidden />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Ignorés
            </div>
            <div className="font-heading text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{skipped}</div>
          </div>
        </div>
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3',
            'border-orange-200 bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/30',
          )}
        >
          <XCircle className="shrink-0 text-orange-600 dark:text-orange-400" size={20} aria-hidden />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-orange-800/90 dark:text-orange-300/90">
              Erreurs
            </div>
            <div className="font-heading text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{errors}</div>
          </div>
        </div>
      </div>

      {clean ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-700 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)] dark:text-zinc-300">
          Import terminé — aucune ligne en erreur ni ignorée à signaler dans le détail.
        </p>
      ) : null}

      {hasDetail ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-[var(--app-border)]">
          <div className="overflow-x-auto">
            <table className={importTableClassName}>
              <thead>
                <tr>
                  <th>Ligne</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {(result.errors ?? []).map((row, i) => (
                  <tr key={`e-${i}`}>
                    <td className="whitespace-nowrap font-mono text-xs">{row.row}</td>
                    <td>{row.message}</td>
                  </tr>
                ))}
                {(result.skipped ?? []).map((row, i) => (
                  <tr key={`s-${i}`}>
                    <td className="whitespace-nowrap font-mono text-xs">{row.row}</td>
                    <td>
                      Ignoré ({row.matricule}) — {row.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Message d’aide lorsque le bouton « Lancer l’import » est désactivé.
 * @param {{ headerIssues: string[]; totalDataRows: number } | null | undefined} preview
 */
export function getImportDisabledHint(preview) {
  if (!preview) return null
  if (preview.headerIssues.length > 0) return 'Corrigez les en-têtes du fichier pour continuer.'
  if (preview.totalDataRows === 0) return 'Aucune ligne de données détectée.'
  return null
}
