import { useEffect, useState } from 'react'
import { ArrowRight, CopyPlus, Lock, LockOpen } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { apiErrorMessage } from '@/features/curriculum/api/curriculaApi'
import { fetchProgramHistory } from '@/features/referential/api/referentialApi'
import { formatDate } from '@/features/referential/ui/curriculumBits'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const EVENT_ICON = { validate: Lock, reopen: LockOpen, reconduct: CopyPlus }

function Delta({ value, previous }) {
  if (previous == null || value === previous) return null
  const up = value > previous
  return <span className={cn('ml-1 text-[10.5px] font-semibold', up ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>{up ? '+' : ''}{value - previous}</span>
}

/** Frise du programme : une version par année, avec ses chiffres et les événements de sa maquette. */
export function ProgramHistory({ program }) {
  const { academicYearId, setAcademicYearId } = useAcademicYear()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProgramHistory(program.identity, { skipErrorToast: true })
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err)))
  }, [program.identity])

  if (error) return <SectionCard><EmptyState tone="error" title="Historique indisponible" description={error} /></SectionCard>
  if (!data) return <Skeleton className="h-64 rounded-2xl" />

  const versions = [...data.versions].reverse()
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <SectionCard title="D’une année à l’autre" description="Chaque année a sa propre version du programme ; les précédentes ne changent jamais.">
        <ol className="relative space-y-4 border-l-2 border-[var(--app-border)] pl-6">
          {versions.map((v, i) => {
            const prev = versions[i + 1]
            const renamed = prev && (prev.name !== v.name || prev.code !== v.code)
            const moved = prev && prev.department.code !== v.department.code
            const current = String(v.year.id) === String(academicYearId)
            return (
              <li key={v.id} className="relative">
                <span className={cn('absolute -left-[33px] top-1 h-4 w-4 rounded-full border-4 border-[var(--app-elevated)]', current ? 'bg-brand-600' : 'bg-[var(--app-border-strong)]')} aria-hidden />
                <button
                  type="button"
                  onClick={() => setAcademicYearId(v.year.id)}
                  className={cn('w-full rounded-xl border p-4 text-left transition-colors hover:border-brand-400/60', current ? 'border-brand-400/60 bg-brand-50/50 dark:bg-brand-500/5' : 'border-[var(--app-border)]')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-heading text-[15px] font-semibold">{v.year.label}{current ? <span className="ml-2 text-[11px] font-medium text-brand-700 dark:text-brand-300">année consultée</span> : null}</p>
                    <StatusPill tone={v.status === 'validated' ? 'success' : 'warning'} dot={false}>{v.status === 'validated' ? 'Validée' : 'Brouillon'}</StatusPill>
                  </div>
                  <p className="mt-1 text-[12.5px] text-[var(--app-fg-soft)]">
                    <span className="font-mono font-semibold">{v.code}</span> {v.name} · {v.department.code}
                  </p>
                  {renamed || moved ? (
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-[11.5px] text-secondary-800 dark:text-secondary-200">
                      {renamed ? <>{prev.code} {prev.name} <ArrowRight size={11} aria-hidden /> {v.code} {v.name}</> : null}
                      {moved ? <span className="ml-2">{prev.department.code} <ArrowRight size={11} className="inline" aria-hidden /> {v.department.code}</span> : null}
                    </p>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-5 gap-2 text-center">
                    {[['Niveaux', 'levels'], ['UE', 'units'], ['Crédits', 'credits'], ['Cours', 'courses'], ['Étudiants', 'students']].map(([label, key]) => (
                      <div key={key}>
                        <dd className="font-heading text-[15px] font-semibold tabular-nums">{v[key]}<Delta value={v[key]} previous={prev?.[key]} /></dd>
                        <dt className="text-[10.5px] text-[var(--app-muted)]">{label}</dt>
                      </div>
                    ))}
                  </dl>
                  {v.validated_at ? <p className="mt-2 text-[11px] text-[var(--app-muted)]">Validée le {formatDate(v.validated_at)}{v.validated_by ? ` par ${v.validated_by}` : ''}</p> : null}
                </button>
              </li>
            )
          })}
        </ol>
      </SectionCard>
      <SectionCard title="Journal de la maquette">
        {data.events.length ? (
          <ul className="space-y-3">
            {data.events.map((e, i) => {
              const Icon = EVENT_ICON[e.action] ?? CopyPlus
              return (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--app-subtle)]"><Icon size={13} aria-hidden /></span>
                  <div className="min-w-0 text-[12.5px]">
                    <p className="font-medium">{e.label} <span className="font-normal text-[var(--app-muted)]">· {e.year}</span></p>
                    <p className="text-[11.5px] text-[var(--app-muted)]">{formatDate(e.at)}{e.actor ? ` · ${e.actor}` : ''}</p>
                    {e.note ? <p className="mt-0.5 text-[12px] italic text-[var(--app-fg-soft)]">« {e.note} »</p> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-[12.5px] text-[var(--app-muted)]">Aucun événement pour l’instant.</p>
        )}
      </SectionCard>
    </div>
  )
}
