import { cn } from '@/shared/lib/cn'

/** États des fiches de notes : couleurs d'état, toujours accompagnées du libellé et du nombre. */
export const SHEET_SEGMENTS = [
  { key: 'published', label: 'Publiées', swatch: 'bg-emerald-600 dark:bg-emerald-500' },
  { key: 'review', label: 'En validation', swatch: 'bg-brand-500 dark:bg-brand-400' },
  { key: 'unlocked', label: 'Dépubliées (correction)', swatch: 'bg-amber-500 dark:bg-amber-400' },
  { key: 'draft', label: 'En saisie', swatch: 'bg-zinc-300 dark:bg-zinc-600' },
]

const pct = (part, total) => (total ? Math.round((100 * part) / total) : 0)

/** Barre empilée d'avancement des fiches + légende chiffrée. */
export function SheetProgressBar({ counts }) {
  const total = SHEET_SEGMENTS.reduce((n, s) => n + (counts?.[s.key] ?? 0), 0)
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-[var(--app-subtle)]" role="img" aria-label="Répartition des fiches de notes par état">
        {total
          ? SHEET_SEGMENTS.filter((s) => counts?.[s.key]).map((s) => (
              <span
                key={s.key}
                className={cn('h-full first:rounded-l-full last:rounded-r-full', s.swatch)}
                style={{ width: `${(100 * counts[s.key]) / total}%` }}
                title={`${s.label} : ${counts[s.key]} (${pct(counts[s.key], total)} %)`}
              />
            ))
          : null}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {SHEET_SEGMENTS.map((s) => (
          <div key={s.key} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[11.5px] text-[var(--app-muted)]">
              <span className={cn('h-2 w-2 shrink-0 rounded-sm', s.swatch)} aria-hidden />
              <span className="truncate">{s.label}</span>
            </dt>
            <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-[var(--app-fg)]">
              {counts?.[s.key] ?? 0}
              <span className="ml-1 text-[11.5px] font-normal text-[var(--app-muted)]">{pct(counts?.[s.key] ?? 0, total)} %</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Jauge fine (une valeur sur un total), libellé lisible à côté. */
export function Meter({ value, max = 100, label, className }) {
  const width = max ? Math.min(100, (100 * (value ?? 0)) / max) : 0
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-[var(--app-subtle)]" aria-hidden>
        <span className="block h-full rounded-full bg-brand-500 dark:bg-brand-400" style={{ width: `${width}%` }} />
      </span>
      <span className="tabular-nums">{label}</span>
    </span>
  )
}

/** Barres horizontales d'une seule teinte, valeur au bout (effectifs par niveau). */
export function HorizontalBars({ rows, valueLabel = (v) => v }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,9rem)_1fr] items-center gap-3 text-[12.5px]">
          <span className="truncate text-[var(--app-fg-soft)]" title={r.label}>
            {r.label}
          </span>
          <span className="flex items-center gap-2" title={`${r.label} : ${valueLabel(r.value)}`}>
            <span className="h-2 rounded-r-[4px] bg-brand-500 dark:bg-brand-400" style={{ width: `${Math.max(2, (100 * r.value) / max)}%` }} />
            <span className="shrink-0 tabular-nums text-[var(--app-fg)]">{valueLabel(r.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
