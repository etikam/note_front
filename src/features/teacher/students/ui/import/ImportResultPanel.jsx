import { AlertTriangle, CheckCircle2, FileSpreadsheet, ListOrdered, XCircle } from 'lucide-react'

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
  const errorTotal = result.error_count ?? 0
  const errorRows = result.errors ?? []
  const skippedRows = result.skipped ?? []
  const hasDetail = errorRows.length > 0 || skippedRows.length > 0
  const detailTruncated =
    errorTotal > errorRows.length || skipped > skippedRows.length
  const clean = errorTotal === 0 && skipped === 0

  return (
    <div className="flex flex-col gap-5">
      {!clean ? (
        <div
          className={cn(
            'flex gap-3 rounded-xl border px-4 py-3',
            errorTotal > 0
              ? 'border-orange-200 bg-orange-50/80 dark:border-orange-900/50 dark:bg-orange-950/30'
              : 'border-zinc-200 bg-zinc-50/80 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]',
          )}
          role="status"
        >
          <AlertTriangle
            className={cn(
              'mt-0.5 shrink-0',
              errorTotal > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500 dark:text-zinc-400',
            )}
            size={20}
            aria-hidden
          />
          <div className="min-w-0 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {errorTotal > 0 && created === 0 ? (
              <p className="font-medium text-orange-950 dark:text-orange-100">
                Import refusé — {errorTotal} ligne{errorTotal > 1 ? 's' : ''} en erreur, aucun étudiant créé.
              </p>
            ) : errorTotal > 0 ? (
              <p className="font-medium text-orange-950 dark:text-orange-100">
                Import partiel — {created} créé{created > 1 ? 's' : ''}, {errorTotal} erreur
                {errorTotal > 1 ? 's' : ''}.
              </p>
            ) : skipped > 0 ? (
              <p className="font-medium">
                Import terminé — {created} créé{created > 1 ? 's' : ''}, {skipped} ligne
                {skipped > 1 ? 's' : ''} ignorée{skipped > 1 ? 's' : ''} (doublons).
              </p>
            ) : null}
            {errorTotal > 0 && !hasDetail ? (
              <p className="mt-1 text-orange-900/90 dark:text-orange-200/90">
                Le détail ligne par ligne n&apos;a pas été renvoyé par le serveur. Vérifiez le format du fichier
                (UTF-8, séparateur virgule ou point-virgule) et les colonnes obligatoires.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
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
            <div className="font-heading text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{errorTotal}</div>
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
          <div className="border-b border-zinc-200 bg-zinc-50/80 px-4 py-2.5 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Détail par ligne</p>
          </div>
          <div className="overflow-x-auto">
            <table className={importTableClassName}>
              <thead>
                <tr>
                  <th>Ligne</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {errorRows.map((row, i) => (
                  <tr key={`e-${i}`}>
                    <td className="whitespace-nowrap font-mono text-xs">{row.row}</td>
                    <td>{row.message}</td>
                  </tr>
                ))}
                {skippedRows.map((row, i) => (
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
          {detailTruncated ? (
            <p className="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-600 dark:border-[var(--app-border)] dark:text-zinc-400">
              Affichage limité aux {errorRows.length + skippedRows.length} premiers messages — corrigez le fichier
              puis relancez l&apos;import.
            </p>
          ) : null}
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
