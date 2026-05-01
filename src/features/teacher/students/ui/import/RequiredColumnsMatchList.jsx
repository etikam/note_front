import { getRequiredColumnMatchState } from '@/features/teacher/students/ui/import/columnMatchUtils'
import { cn } from '@/shared/lib/cn'

/**
 * Liste des colonnes obligatoires : vert si présente dans le CSV, rouge sinon.
 * @param {{ headers: string[] }} props
 */
export function RequiredColumnsMatchList({ headers }) {
  const { items, matchedCount, missingCount } = getRequiredColumnMatchState(headers)

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        Colonnes obligatoires vs fichier
      </p>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-green-700 dark:text-green-400">{matchedCount} reconnue(s)</span>
        {' · '}
        <span className="font-medium text-red-700 dark:text-red-400">{missingCount} manquante(s)</span>
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Détail par colonne attendue">
        {items.map(({ key, label, matched }) => (
          <li key={key}>
            <span
              className={cn(
                'inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium',
                matched
                  ? 'bg-green-100 text-green-900 ring-1 ring-green-200/80 dark:bg-green-950/45 dark:text-green-100 dark:ring-green-800/60'
                  : 'bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/45 dark:text-red-100 dark:ring-red-800/60',
              )}
            >
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
