import { Check, CircleDashed, Loader2, ShieldAlert, X } from 'lucide-react'

import { getRequiredColumnMatchState } from '@/features/teacher/students/ui/import/columnMatchUtils'
import { cn } from '@/shared/lib/cn'

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} Mo`
}

const ICON = {
  done: { Icon: Check, cls: 'bg-green-600 text-white dark:bg-green-500' },
  error: { Icon: X, cls: 'bg-red-600 text-white dark:bg-red-500' },
  busy: { Icon: Loader2, cls: 'bg-brand-600 text-white dark:bg-brand-500', spin: true },
  todo: { Icon: CircleDashed, cls: 'bg-[var(--app-subtle)] text-[var(--app-muted)] ring-1 ring-inset ring-[var(--app-border)]' },
}

function CheckItem({ state, title, detail, last }) {
  const { Icon, cls, spin } = ICON[state] ?? ICON.todo
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last ? <span className={cn('absolute left-[11px] top-6 h-[calc(100%-1rem)] w-px', state === 'done' ? 'bg-green-500/50' : 'bg-[var(--app-border)]')} aria-hidden /> : null}
      <span className={cn('relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full', cls)}>
        <Icon size={13} strokeWidth={state === 'todo' ? 2 : 3} className={spin ? 'animate-spin' : undefined} aria-hidden />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className={cn('text-[12.5px] font-semibold', state === 'todo' ? 'text-[var(--app-muted)]' : 'text-[var(--app-fg)]')}>{title}</p>
        {detail ? <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--app-muted)]">{detail}</p> : null}
      </div>
    </li>
  )
}

/** Liste de contrôle d'un parcours d'import : ``steps`` = ``[{ state, title, detail? }]``. */
export function ImportChecklist({ steps, title = 'Suivi de l’import' }) {
  return (
    <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">{title}</h3>
      <ol>
        {steps.map((s, i) => (
          <CheckItem key={s.title} {...s} last={i === steps.length - 1} />
        ))}
      </ol>
    </section>
  )
}

/**
 * Suivi de l'import : liste de contrôle en direct (fichier, colonnes, données, import) et
 * résumé du résultat.
 *
 * @param {{
 *   pendingFile: File | null
 *   preview: { headers: string[]; totalDataRows: number; headerIssues: string[]; rowValidation?: { totalIssueCount?: number } } | null
 *   busy: boolean
 *   uploadProgress: number | null
 *   result: { created_count?: number; skipped_count?: number; error_count?: number; errors?: unknown[]; skipped?: unknown[] } | null
 *   globalError: string | null
 *   requiredColumnKeys?: string[]
 *   columnLabels?: Record<string, string>
 * }} props
 */
export function ImportSidebar({ pendingFile, preview, busy, uploadProgress, result, globalError, requiredColumnKeys, columnLabels }) {
  const statsReady = Boolean(pendingFile && preview)
  const columnMatch = statsReady ? getRequiredColumnMatchState(preview.headers, { requiredKeys: requiredColumnKeys, labels: columnLabels }) : null
  const headersOk = statsReady && preview.headerIssues.length === 0 && columnMatch.missingCount === 0
  const rowIssues = preview?.rowValidation?.totalIssueCount ?? 0
  const rowsOk = headersOk && preview.totalDataRows > 0 && rowIssues === 0

  const steps = [
    {
      state: pendingFile ? (statsReady ? 'done' : 'busy') : 'todo',
      title: pendingFile ? 'Fichier chargé' : 'Choisir un fichier',
      detail: pendingFile ? `${pendingFile.name} · ${formatFileSize(pendingFile.size)}` : 'Déposez le fichier rempli à partir du modèle.',
    },
    {
      state: !statsReady ? 'todo' : headersOk ? 'done' : 'error',
      title: 'Colonnes reconnues',
      detail: columnMatch ? `${columnMatch.matchedCount}/${columnMatch.totalRequired} obligatoires · ${preview.headers.length} colonnes au total` : 'Contrôle des en-têtes du fichier.',
    },
    {
      state: !headersOk ? 'todo' : rowsOk ? 'done' : 'error',
      title: 'Données contrôlées',
      detail: statsReady
        ? preview.totalDataRows === 0
          ? 'Aucune ligne de données.'
          : rowIssues
            ? `${rowIssues} erreur${rowIssues > 1 ? 's' : ''} à corriger sur ${preview.totalDataRows} lignes.`
            : `${preview.totalDataRows} ligne${preview.totalDataRows > 1 ? 's' : ''} valide${preview.totalDataRows > 1 ? 's' : ''}.`
        : 'Chaque ligne est vérifiée avant l’envoi.',
    },
    {
      state: busy ? 'busy' : result ? ((result.error_count ?? 0) > 0 ? 'error' : 'done') : 'todo',
      title: busy ? `Import en cours${uploadProgress != null ? ` · ${uploadProgress} %` : '…'}` : result ? 'Import terminé' : 'Import',
      detail: result ? null : rowsOk ? 'Prêt : lancez l’import.' : 'Disponible une fois le fichier valide.',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <ImportChecklist steps={steps} />

      {globalError && !busy ? (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100" role="status">
          <ShieldAlert className="mt-0.5 shrink-0" size={15} aria-hidden />
          <p className="leading-relaxed">{globalError}</p>
        </div>
      ) : null}

      {!busy && result ? (
        <section className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Résultat</h3>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Créés', result.created_count ?? 0, 'text-green-700 dark:text-green-300'],
              ['Ignorés', result.skipped_count ?? 0, 'text-[var(--app-fg)]'],
              ['Erreurs', result.error_count ?? 0, (result.error_count ?? 0) ? 'text-red-700 dark:text-red-300' : 'text-[var(--app-fg)]'],
            ].map(([label, value, cls]) => (
              <div key={label} className="rounded-lg bg-[var(--app-subtle)] px-2 py-2">
                <dd className={cn('font-heading text-[19px] font-semibold tabular-nums', cls)}>{value}</dd>
                <dt className="text-[11px] text-[var(--app-muted)]">{label}</dt>
              </div>
            ))}
          </dl>
          {(result.errors?.length ?? 0) > 0 || (result.skipped?.length ?? 0) > 0 ? (
            <ul className="mt-3 max-h-44 space-y-1.5 overflow-y-auto text-[11.5px]">
              {(result.errors ?? []).slice(0, 8).map((row, i) => (
                <li key={`err-${i}`} className="flex gap-1.5 leading-snug text-red-900 dark:text-red-100">
                  <span className="shrink-0 rounded bg-red-100 px-1 font-mono text-[10px] dark:bg-red-500/20">L.{row.row}</span>
                  {row.message}
                </li>
              ))}
              {(result.skipped ?? []).slice(0, Math.max(0, 8 - (result.errors?.length ?? 0))).map((row, i) => (
                <li key={`skip-${i}`} className="flex gap-1.5 leading-snug text-[var(--app-fg-soft)]">
                  <span className="shrink-0 rounded bg-[var(--app-subtle)] px-1 font-mono text-[10px]">L.{row.row}</span>
                  Ignoré ({row.matricule}) — {row.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
