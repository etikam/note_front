import { useEffect, useMemo, useState } from 'react'
import { Award, LogOut, Repeat2, Timer, Users } from 'lucide-react'

import { apiErrorMessage } from '@/features/curriculum/api/curriculaApi'
import { fetchProgramCohorts } from '@/features/referential/api/referentialApi'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'

/** Couleur stable par niveau (L1, L2, L3, M1…). */
const LEVEL_TONES = ['bg-brand-300 dark:bg-brand-400/70', 'bg-brand-500', 'bg-brand-700 dark:bg-brand-300', 'bg-violet-500', 'bg-violet-700']

function levelTone(levels, name) {
  const i = levels.indexOf(name)
  return LEVEL_TONES[i % LEVEL_TONES.length]
}

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', tone)}><Icon size={15} aria-hidden /></span>
      <span>
        <span className="block font-heading text-[17px] font-semibold leading-none tabular-nums">{value}</span>
        <span className="text-[11px] text-[var(--app-muted)]">{label}</span>
      </span>
    </div>
  )
}

/** Une promotion : chiffres clés, colonnes annuelles empilées par niveau, parcours les plus fréquents. */
function CohortCard({ journey }) {
  const { summary, years, paths } = journey
  const levels = useMemo(() => [...new Set(years.flatMap((y) => Object.keys(y.levels)))].sort(), [years])
  const max = Math.max(summary.entered, ...years.map((y) => y.registered), 1)

  return (
    <SectionCard
      title={`${journey.cohort.label} · entrée en ${journey.cohort.entry_year}`}
      description={`${summary.entered} étudiant${summary.entered > 1 ? 's' : ''} à l’entrée`}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat icon={Users} label="En cours" value={summary.active} tone="bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200" />
        <Stat icon={Award} label="Diplômés" value={summary.graduated} tone="bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200" />
        <Stat icon={Timer} label="Sans redoubler" value={summary.on_time} tone="bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-200" />
        <Stat icon={Repeat2} label="Ont redoublé" value={summary.repeated} tone="bg-secondary-50 text-secondary-700 dark:bg-secondary-500/10 dark:text-secondary-200" />
        <Stat icon={LogOut} label="Sortis" value={summary.left} tone="bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200" />
      </div>

      {years.length ? (
        <div className="mt-6">
          <div className="flex items-end gap-4 overflow-x-auto pb-1" style={{ minHeight: '11rem' }}>
            {years.map((y) => (
              <figure key={y.year.id} className="flex w-24 shrink-0 flex-col items-center gap-1.5">
                <span className="text-[11px] font-semibold tabular-nums">{y.registered}</span>
                <div className="flex w-12 flex-col-reverse overflow-hidden rounded-lg bg-[var(--app-subtle)]" style={{ height: `${(y.registered / max) * 8}rem` }}>
                  {levels.filter((l) => y.levels[l]).map((l) => (
                    <span
                      key={l}
                      title={`${l} : ${y.levels[l]}`}
                      className={cn('flex items-center justify-center text-[10px] font-bold text-white', levelTone(levels, l))}
                      style={{ height: `${(y.levels[l] / y.registered) * 100}%` }}
                    >
                      {y.levels[l] / y.registered > 0.18 ? l : ''}
                    </span>
                  ))}
                </div>
                <figcaption className={cn('text-center text-[11px]', y.year.is_current ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-[var(--app-muted)]')}>
                  {y.year.label}
                  {y.repeating ? <span className="block text-[10.5px] text-secondary-700 dark:text-secondary-300">{y.repeating} redoubl.</span> : null}
                  {y.withdrawn ? <span className="block text-[10.5px] text-red-700 dark:text-red-300">{y.withdrawn} sortis</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[var(--app-muted)]">
            {levels.map((l) => (
              <span key={l} className="flex items-center gap-1.5"><span className={cn('h-2.5 w-2.5 rounded-sm', levelTone(levels, l))} aria-hidden /> {l}</span>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-[12.5px] text-[var(--app-muted)]">Aucune inscription annuelle pour cette promotion.</p>
      )}

      {paths.length ? (
        <div className="mt-5 border-t border-[var(--app-border)] pt-4">
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Parcours les plus fréquents</h4>
          <ul className="space-y-1.5">
            {paths.map((p) => (
              <li key={p.path} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-40 shrink-0 font-mono text-[12px]">{p.path}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--app-subtle)]">
                  <span className="block h-full rounded-full bg-brand-500" style={{ width: `${(p.students / summary.entered) * 100}%` }} />
                </span>
                <span className="w-16 text-right tabular-nums text-[var(--app-muted)]">{p.students} étud.</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </SectionCard>
  )
}

/** Promotions du programme (toutes années) et leur parcours dans le temps. */
export function ProgramCohorts({ program }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    fetchProgramCohorts(program.identity, { skipErrorToast: true })
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err)))
  }, [program.identity])

  if (error) return <SectionCard><EmptyState tone="error" title="Promotions indisponibles" description={error} /></SectionCard>
  if (!data) return <Skeleton className="h-72 rounded-2xl" />
  if (!data.length) {
    return (
      <SectionCard>
        <EmptyState
          icon={Users}
          title="Aucune promotion"
          description="Les promotions se créent à l’import des étudiants (colonnes promotion et année d’entrée) : elles permettent de suivre chaque entrée d’une année à l’autre."
        />
      </SectionCard>
    )
  }
  return <div className="flex flex-col gap-5">{data.map((j) => <CohortCard key={j.cohort.id} journey={j} />)}</div>
}
