import { Check, X } from 'lucide-react'

import { getRequiredColumnMatchState } from '@/features/teacher/students/ui/import/columnMatchUtils'
import { cn } from '@/shared/lib/cn'

/**
 * Colonnes obligatoires reconnues dans le fichier : jauge et pastille par colonne.
 * @param {{ headers: string[]; requiredKeys?: string[]; labels?: Record<string, string> }} props
 */
export function RequiredColumnsMatchList({ headers, requiredKeys, labels }) {
  const { items, matchedCount, totalRequired } = getRequiredColumnMatchState(headers, { requiredKeys, labels })
  const complete = matchedCount === totalRequired
  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] font-semibold text-[var(--app-fg)]">Colonnes obligatoires</p>
        <span className={cn('text-[12px] font-semibold tabular-nums', complete ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
          {matchedCount}/{totalRequired} reconnues
        </span>
      </div>
      <span className="mt-2 flex h-1.5 gap-[2px] overflow-hidden rounded-full" aria-hidden>
        {items.map((i) => (
          <span key={i.key} className={cn('h-full flex-1', i.matched ? 'bg-green-500' : 'bg-red-400 dark:bg-red-500/70')} />
        ))}
      </span>
      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Détail par colonne attendue">
        {items.map(({ key, label, matched }) => (
          <li key={key}>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-medium ring-1 ring-inset',
                matched ? 'bg-green-50 text-green-800 ring-green-600/20 dark:bg-green-500/10 dark:text-green-200' : 'bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-500/10 dark:text-red-200',
              )}
            >
              {matched ? <Check size={11} strokeWidth={3} aria-hidden /> : <X size={11} strokeWidth={3} aria-hidden />}
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
