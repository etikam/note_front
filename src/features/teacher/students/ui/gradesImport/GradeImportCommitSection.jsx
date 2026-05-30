import { useAuth } from '@/features/auth/model/AuthContext'
import { Select } from '@/shared/ui/Field'
import { cn } from '@/shared/lib/cn'

export const ADMIN_VALIDATION_STATUS_OPTIONS = [
  { value: 'study_director', label: 'Directeur des études' },
  { value: 'general_director', label: 'Directeur général' },
]

export function defaultAdminValidationStatus(user) {
  const codes = user?.teacher_role_codes ?? []
  if (codes.includes('general_director')) return 'general_director'
  return 'study_director'
}

const STATUS_LABELS = Object.fromEntries(ADMIN_VALIDATION_STATUS_OPTIONS.map((o) => [o.value, o.label]))

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
 * Récapitulatif + paramètres workflow + bouton commit (étape 4).
 */
export function GradeImportCommitSection({
  courseLabel,
  fileName,
  analysis,
  validationStatus,
  onValidationStatusChange,
  published,
  onPublishedChange,
  disabled = false,
  canCommit = false,
  commitHint = null,
  onCommit,
  committing = false,
}) {
  const { user } = useAuth()
  const rowErrors = Array.isArray(analysis?.errors) ? analysis.errors : []
  const expired = isBatchExpired(analysis)
  const expiresHint = batchExpiryHint(analysis)

  const fieldClass =
    'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)]'

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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-zinc-700 dark:text-zinc-300">
            Niveau de validation après import
          </span>
          <Select
            className={fieldClass}
            value={validationStatus}
            disabled={disabled || committing}
            onChange={(e) => onValidationStatusChange(e.target.value)}
          >
            {ADMIN_VALIDATION_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
            checked={published}
            disabled={disabled || committing}
            onChange={(e) => onPublishedChange(e.target.checked)}
          />
          <span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Publier les notes aux étudiants</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Si coché, les notes seront visibles dans l’espace étudiant.
            </span>
          </span>
        </label>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Validation au statut « {STATUS_LABELS[validationStatus] ?? validationStatus} »
        {published ? ', notes publiées' : ', notes non publiées'} — opération par{' '}
        {user?.full_name ?? 'directeur'}.
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
