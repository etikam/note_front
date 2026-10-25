import { useAccess } from '@/features/access/model/useAccess'
import { useAuth } from '@/features/auth/model/AuthContext'
import { cn } from '@/shared/lib/cn'

export function isBatchExpired(analysis) {
  const raw = analysis?.expires_at
  if (!raw || typeof raw !== 'string') return false
  const exp = Date.parse(raw)
  if (Number.isNaN(exp)) return false
  return Date.now() >= exp
}

export function batchExpiryHint(analysis) {
  const raw = analysis?.expires_at
  if (!raw || typeof raw !== 'string') return null
  const exp = Date.parse(raw)
  if (Number.isNaN(exp)) return null
  if (Date.now() >= exp) {
    return 'Ce lot d’analyse a expiré. Relancez l’analyse du fichier.'
  }
  const hours = Math.max(1, Math.round((exp - Date.now()) / (1000 * 60 * 60)))
  return `Lot valide encore environ ${hours} h — au-delà, relancez l’analyse.`
}

/**
 * Récapitulatif + publication directe éventuelle + bouton commit (étape 4).
 * Sans publication directe, les notes restent en saisie et la fiche suit le circuit de validation.
 */
export function GradeImportCommitSection({
  courseLabel,
  fileName,
  analysis,
  published,
  onPublishedChange,
  disabled = false,
  canCommit = false,
  commitHint = null,
  onCommit,
  committing = false,
}) {
  const { user } = useAuth()
  const canPublish = useAccess().canManage('grades.publish')
  const rowErrors = Array.isArray(analysis?.errors) ? analysis.errors : []
  const expired = isBatchExpired(analysis)
  const expiresHint = batchExpiryHint(analysis)

  return (
    <div className="space-y-4 border-t border-zinc-100 pt-4 dark:border-[var(--app-border)]">
      <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,transparent)] px-4 py-3 text-sm">
        <p className="font-semibold">Récapitulatif avant validation</p>
        <ul className="mt-2 space-y-1 text-[13px] text-zinc-600 dark:text-zinc-400">
          <li>
            <span className="text-zinc-500">Cours :</span> {courseLabel || '—'}
          </li>
          <li>
            <span className="text-zinc-500">Fichier :</span> {fileName || '—'}
          </li>
          <li>
            <span className="text-zinc-500">À inscrire :</span>{' '}
            <span className="font-mono font-medium">{Number(analysis?.to_enroll_count ?? 0)}</span>
          </li>
          <li>
            <span className="text-zinc-500">Notes sans conflit :</span>{' '}
            <span className="font-mono font-medium">{Number(analysis?.pending_safe_count ?? 0)}</span>
          </li>
          {rowErrors.length ? (
            <li className="text-amber-800 dark:text-amber-200">
              {rowErrors.length} ligne(s) seront ignorées (matricule invalide ou doublon).
            </li>
          ) : null}
        </ul>
        {expiresHint ? (
          <p
            className={cn(
              'mt-2 text-xs',
              expired ? 'font-medium text-red-700 dark:text-red-300' : 'text-zinc-500 dark:text-zinc-400',
            )}
          >
            {expiresHint}
          </p>
        ) : null}
      </div>

      {canPublish ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
            checked={published}
            disabled={disabled || committing}
            onChange={(e) => onPublishedChange(e.target.checked)}
          />
          <span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Publier directement, sans circuit de validation</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              La fiche du cours est publiée et les notes deviennent visibles par les étudiants. Sinon, les notes restent en
              saisie et la fiche suit le circuit habituel.
            </span>
          </span>
        </label>
      ) : null}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {published ? 'Notes publiées dès l’enregistrement' : 'Notes enregistrées en saisie (fiche à soumettre)'} — opération par{' '}
        {user?.full_name ?? 'vous'}. Possible seulement si la fiche du cours est en saisie ou dépubliée.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
            'bg-brand-600 text-white hover:bg-brand-700',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          disabled={!canCommit || disabled || committing || expired}
          onClick={onCommit}
        >
          {committing ? 'Enregistrement…' : 'Valider et enregistrer l’import'}
        </button>
        {commitHint ? <span className="text-sm text-zinc-500 dark:text-zinc-400">{commitHint}</span> : null}
      </div>
    </div>
  )
}
