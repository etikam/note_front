import { Activity, CheckCircle2, FileStack, Gauge, Loader2, ShieldAlert } from 'lucide-react'

import { getRequiredColumnMatchState } from '@/features/teacher/students/ui/import/columnMatchUtils'
import { cn } from '@/shared/lib/cn'
import { Card } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`
}

/**
 * @param {{
 *   pendingFile: File | null
 *   preview: { headers: string[]; totalDataRows: number; headerIssues: string[]; rowValidation?: { totalIssueCount?: number } } | null
 *   busy: boolean
 *   uploadProgress: number | null
 *   result: {
 *     created_count?: number
 *     skipped_count?: number
 *     error_count?: number
 *     errors?: unknown[]
 *     skipped?: unknown[]
 *   } | null
 *   globalError: string | null
 *   requiredColumnKeys?: string[]
 *   columnLabels?: Record<string, string>
 * }} props
 */
export function ImportSidebar({
  pendingFile,
  preview,
  busy,
  uploadProgress,
  result,
  globalError,
  requiredColumnKeys,
  columnLabels,
}) {
  const hasFile = Boolean(pendingFile)
  const statsReady = Boolean(pendingFile && preview)
  const headersOk = statsReady && preview.headerIssues.length === 0
  const rowDataIssues = preview?.rowValidation?.totalIssueCount ?? 0
  const canImportRow =
    statsReady && headersOk && preview.totalDataRows > 0 && rowDataIssues === 0
  const columnMatch = statsReady
    ? getRequiredColumnMatchState(preview.headers, { requiredKeys: requiredColumnKeys, labels: columnLabels })
    : null

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-[var(--app-border)]">
          <FileStack className="text-brand-600 dark:text-brand-400" size={18} aria-hidden />
          <h3 className="font-heading text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fichier</h3>
        </div>
        {!hasFile ? (
          <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Sélectionnez un CSV pour afficher taille, colonnes et nombre de lignes détectées.
          </p>
        ) : !statsReady ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
            Analyse du fichier…
          </p>
        ) : (
          <dl className="mt-3 space-y-2.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">Nom</dt>
              <dd className="min-w-0 truncate text-right font-medium text-zinc-800 dark:text-zinc-200" title={pendingFile.name}>
                {pendingFile.name}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Taille</dt>
              <dd className="tabular-nums text-zinc-800 dark:text-zinc-200">{formatFileSize(pendingFile.size)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Colonnes (fichier)</dt>
              <dd className="tabular-nums text-zinc-800 dark:text-zinc-200">{preview.headers.length}</dd>
            </div>
            {columnMatch ? (
              <>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Requises reconnues</dt>
                  <dd className="tabular-nums font-medium text-green-700 dark:text-green-400">
                    {columnMatch.matchedCount} / {columnMatch.totalRequired}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">Requises manquantes</dt>
                  <dd
                    className={cn(
                      'tabular-nums font-medium',
                      columnMatch.missingCount > 0
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-zinc-800 dark:text-zinc-200',
                    )}
                  >
                    {columnMatch.missingCount}
                  </dd>
                </div>
              </>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt className="text-zinc-500 dark:text-zinc-400">Lignes données</dt>
              <dd className="tabular-nums font-medium text-zinc-800 dark:text-zinc-200">{preview.totalDataRows}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <dt className="text-zinc-500 dark:text-zinc-400">En-têtes</dt>
              <dd>
                {headersOk ? (
                  <Badge tone="success">Conformes</Badge>
                ) : (
                  <Badge tone="warning">{preview.headerIssues.length} problème(s)</Badge>
                )}
              </dd>
            </div>
            {headersOk && rowDataIssues > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <dt className="text-zinc-500 dark:text-zinc-400">Données lignes</dt>
                <dd>
                  <Badge tone="warning">{rowDataIssues} erreur(s)</Badge>
                </dd>
              </div>
            ) : null}
          </dl>
        )}
      </Card>

      <Card className="p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-[var(--app-border)]">
          <Activity className="text-brand-600 dark:text-brand-400" size={18} aria-hidden />
          <h3 className="font-heading text-sm font-semibold text-zinc-900 dark:text-zinc-50">Statut import</h3>
        </div>

        {globalError && !busy ? (
          <div className="mt-3 flex gap-2 text-xs text-orange-900 dark:text-orange-100" role="status">
            <ShieldAlert className="mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" size={16} aria-hidden />
            <p className="leading-relaxed">{globalError}</p>
          </div>
        ) : null}

        {busy ? (
          <div className="mt-3 space-y-2" aria-live="polite">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-200">
              <Loader2 className="size-4 shrink-0 animate-spin text-brand-600 dark:text-brand-400" aria-hidden />
              Envoi en cours…
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={uploadProgress ?? undefined}
            >
              {uploadProgress != null ? (
                <div className="h-full bg-brand-500 dark:bg-brand-400" style={{ width: `${uploadProgress}%` }} />
              ) : (
                <div className="h-full w-1/3 animate-pulse bg-brand-400/80" />
              )}
            </div>
          </div>
        ) : null}

        {!busy && !globalError && !result && statsReady ? (
          <div className="mt-3 space-y-2 text-xs">
            <p className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <Gauge size={14} className="shrink-0 text-zinc-400" aria-hidden />
              {canImportRow
                ? 'Prêt à lancer l’import serveur.'
                : headersOk && preview.totalDataRows > 0 && rowDataIssues > 0
                  ? 'Corrigez les erreurs du rapport (lignes de données) avant l’import.'
                  : 'Corrigez le fichier ou les en-têtes avant import.'}
            </p>
            {canImportRow ? <Badge tone="info">En attente</Badge> : <Badge tone="neutral">Bloqué</Badge>}
          </div>
        ) : null}

        {!busy && result ? (
          <div className="mt-3 space-y-3 text-xs">
            <dl className="space-y-2">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500 dark:text-zinc-400">Créés</dt>
                <dd className="font-heading text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {result.created_count ?? 0}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500 dark:text-zinc-400">Ignorés</dt>
                <dd className="font-heading text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {result.skipped_count ?? 0}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500 dark:text-zinc-400">Erreurs</dt>
                <dd className="font-heading text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {result.error_count ?? 0}
                </dd>
              </div>
            </dl>
            {(result.errors?.length ?? 0) > 0 || (result.skipped?.length ?? 0) > 0 ? (
              <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-orange-200/80 bg-orange-50/50 px-2.5 py-2 dark:border-orange-900/40 dark:bg-orange-950/20">
                {(result.errors ?? []).slice(0, 8).map((row, i) => (
                  <li key={`err-${i}`} className="leading-snug text-orange-950 dark:text-orange-100">
                    <span className="font-mono text-[10px] text-orange-800/80 dark:text-orange-300/80">L.{row.row}</span>{' '}
                    {row.message}
                  </li>
                ))}
                {(result.skipped ?? []).slice(0, Math.max(0, 8 - (result.errors?.length ?? 0))).map((row, i) => (
                  <li key={`skip-${i}`} className="leading-snug text-zinc-700 dark:text-zinc-300">
                    <span className="font-mono text-[10px] text-zinc-500">L.{row.row}</span> Ignoré ({row.matricule}) —{' '}
                    {row.reason}
                  </li>
                ))}
              </ul>
            ) : (result.error_count ?? 0) > 0 ? (
              <p className="leading-relaxed text-orange-900 dark:text-orange-200">
                Consultez le détail complet dans l&apos;étape « Résultat » ci-dessous.
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {(result.error_count ?? 0) > 0 ? (
                <Badge tone="warning">Terminé avec erreurs</Badge>
              ) : (result.skipped_count ?? 0) > 0 ? (
                <Badge tone="neutral">Terminé — partiel</Badge>
              ) : (
                <Badge tone="success" className="inline-flex items-center gap-1">
                  <CheckCircle2 size={12} aria-hidden />
                  Terminé
                </Badge>
              )}
            </div>
          </div>
        ) : null}

        {!busy && !globalError && !result && !hasFile ? (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Le résumé d’exécution s’affichera ici après l’import.</p>
        ) : null}
      </Card>
    </div>
  )
}
