import { DECISION_LABEL, DECISION_ORDER, fmtNote, NOTE_LABELS, ratio } from '@/features/notes/model/notesModel'
import { cn } from '@/shared/lib/cn'

/** Jauge horizontale d'une moyenne sur le barème, repère au seuil de validation. */
export function ScoreGauge({ value, scale = 10, pass = 5, className }) {
  const below = value != null && Number(value) < Number(pass)
  return (
    <span className={cn('relative block h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-subtle)] ring-1 ring-inset ring-[var(--app-border)]', className)} aria-hidden>
      <span
        className={cn('absolute inset-y-0 left-0 rounded-full', below ? 'bg-red-500 dark:bg-red-400' : 'bg-brand-600 dark:bg-brand-400')}
        style={{ width: `${ratio(value, scale) * 100}%` }}
      />
      <span className="absolute inset-y-[-2px] w-px bg-[var(--app-fg)] opacity-40" style={{ left: `${ratio(pass, scale) * 100}%` }} />
    </span>
  )
}

/** Les quatre notes d'un cours (N1, N2, N3, rattrapage) en pastilles compactes. */
export function NoteChips({ notes = [], pass = 5, compact = false }) {
  return (
    <span className="inline-flex items-center gap-1">
      {NOTE_LABELS.map((label, i) => {
        const v = notes[i]
        if (i === 3 && v == null) return null
        return (
          <span
            key={label}
            title={`${i === 3 ? 'Rattrapage' : `Note ${i + 1}`} : ${v == null ? 'non saisie' : fmtNote(v)}`}
            className={cn(
              'inline-flex items-baseline gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] tabular-nums ring-1 ring-inset',
              i === 3 ? 'bg-secondary-50 ring-secondary-600/20 dark:bg-secondary-500/10 dark:ring-secondary-400/25' : 'bg-[var(--app-subtle)] ring-[var(--app-border)]',
              v != null && Number(v) < Number(pass) ? 'text-red-700 dark:text-red-300' : 'text-[var(--app-fg-soft)]',
            )}
          >
            {!compact ? <span className="text-[9.5px] font-semibold text-[var(--app-muted)]">{label}</span> : null}
            {v == null ? '—' : fmtNote(v)}
          </span>
        )
      })}
    </span>
  )
}

const DECISION_FILL = {
  admitted: 'bg-green-500 dark:bg-green-400',
  admitted_debt: 'bg-secondary-400 dark:bg-secondary-400',
  makeup: 'bg-orange-600 dark:bg-orange-500',
  repeat: 'bg-red-600 dark:bg-red-500',
  pending: 'bg-zinc-300 dark:bg-white/20',
}

/** Répartition des décisions (barre empilée + légende chiffrée). */
export function DecisionBar({ decisions = {}, total }) {
  const sum = total ?? DECISION_ORDER.reduce((n, k) => n + (decisions[k] || 0), 0)
  if (!sum) return null
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Répartition des décisions">
        {DECISION_ORDER.map((k) =>
          decisions[k] ? (
            <span key={k} className={cn('h-full first:rounded-l-full last:rounded-r-full', DECISION_FILL[k])} style={{ width: `${(100 * decisions[k]) / sum}%` }} title={`${DECISION_LABEL[k]} : ${decisions[k]}`} />
          ) : null,
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--app-fg-soft)]">
        {DECISION_ORDER.map((k) =>
          decisions[k] ? (
            <li key={k} className="inline-flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', DECISION_FILL[k])} aria-hidden />
              {DECISION_LABEL[k]} <span className="font-semibold tabular-nums text-[var(--app-fg)]">{decisions[k]}</span>
            </li>
          ) : null,
        )}
      </ul>
    </div>
  )
}

/** Histogramme des moyennes par dixième du barème ; repère pointillé au seuil. */
export function Histogram({ bins = [], scale = 10, pass = 5, height = 120 }) {
  const max = Math.max(1, ...bins)
  const total = bins.reduce((a, b) => a + b, 0)
  const step = scale / bins.length
  return (
    <figure className="flex flex-col gap-1.5">
      <div className="relative flex items-end gap-[2px] border-b border-[var(--app-border-strong)]" style={{ height }} role="img" aria-label={`Distribution de ${total} moyennes`}>
        {bins.map((n, i) => {
          const from = i * step
          const below = from + step <= pass
          return (
            <span key={i} className="group relative flex h-full flex-1 items-end justify-center" title={`${fmtNote(from)} – ${fmtNote(from + step)} : ${n} étudiant${n > 1 ? 's' : ''}`}>
              <span
                className={cn('w-full max-w-[34px] rounded-t-[4px] transition-opacity group-hover:opacity-80', below ? 'bg-zinc-300 dark:bg-white/20' : 'bg-brand-600 dark:bg-brand-400')}
                style={{ height: n ? `${Math.max(4, (100 * n) / max)}%` : 0 }}
              />
              {n ? <span className="absolute -translate-y-1 text-[10.5px] font-semibold tabular-nums text-[var(--app-fg-soft)]" style={{ bottom: `${(100 * n) / max}%` }}>{n}</span> : null}
            </span>
          )
        })}
        <span className="pointer-events-none absolute inset-y-0 border-l border-dashed border-red-500/70" style={{ left: `${ratio(pass, scale) * 100}%` }}>
          <span className="absolute -top-0.5 left-1 whitespace-nowrap text-[10px] font-medium text-red-700 dark:text-red-300">seuil {fmtNote(pass)}</span>
        </span>
      </div>
      <div className="flex justify-between text-[10.5px] tabular-nums text-[var(--app-muted)]">
        <span>0</span>
        <span>{fmtNote(scale / 2)}</span>
        <span>{scale}</span>
      </div>
    </figure>
  )
}

/** Indicateur chiffré compact pour les bandeaux de synthèse. */
export function Metric({ label, value, hint, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="truncate text-[11.5px] font-medium text-[var(--app-muted)]">{label}</p>
      <p className="font-heading text-[20px] font-semibold leading-tight tabular-nums text-[var(--app-fg)]">{value}</p>
      {hint ? <p className="truncate text-[11.5px] text-[var(--app-muted)]">{hint}</p> : null}
    </div>
  )
}
