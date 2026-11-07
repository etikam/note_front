import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Award, CheckCircle2, Download, FileWarning, GraduationCap, Hourglass, Wallet } from 'lucide-react'

import { apiErrorMessage } from '@/features/curriculum/api/curriculaApi'
import { downloadGraduatesCsv, fetchGraduates } from '@/features/referential/api/referentialApi'
import { refPaths } from '@/features/referential/model/ReferentialContext'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { Skeleton } from '@/shared/ui/Skeleton'

export const GRADUATE_STATES = {
  graduable: { label: 'Diplômable', Icon: CheckCircle2, tone: 'bg-green-50 text-green-800 ring-green-600/20 dark:bg-green-500/10 dark:text-green-200', bar: 'bg-green-500' },
  debts: { label: 'Dettes à solder', Icon: Wallet, tone: 'bg-secondary-50 text-secondary-800 ring-secondary-600/20 dark:bg-secondary-500/10 dark:text-secondary-200', bar: 'bg-secondary-500' },
  incomplete: { label: 'Résultats incomplets', Icon: Hourglass, tone: 'bg-red-50 text-red-800 ring-red-600/20 dark:bg-red-500/10 dark:text-red-200', bar: 'bg-red-400' },
  graduated: { label: 'Diplômé', Icon: Award, tone: 'bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-200', bar: 'bg-violet-500' },
}

const SHEET = { draft: 'en saisie', review: 'en validation', unlocked: 'rouverte' }

function StatePill({ state }) {
  const s = GRADUATE_STATES[state]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset', s.tone)}>
      <s.Icon size={12} aria-hidden /> {s.label}
    </span>
  )
}

function StatesBar({ states, total }) {
  if (!total) return <span className="text-[11.5px] text-[var(--app-muted)]">—</span>
  return (
    <span className="flex h-2 w-full overflow-hidden rounded-full bg-[var(--app-subtle)]" aria-hidden>
      {Object.entries(GRADUATE_STATES).map(([k, s]) => (states[k] ? <span key={k} className={s.bar} style={{ width: `${(states[k] / total) * 100}%` }} /> : null))}
    </span>
  )
}

/** Alerte de clôture du dernier semestre : fiches de notes non publiées. */
export function ClosureBanner({ data, compact = false }) {
  const pending = data.totals.courses - data.totals.courses_published
  if (!data.totals.finalists && !data.totals.courses) return null
  if (data.closed) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-[12.5px] text-green-900 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100">
        <CheckCircle2 size={15} aria-hidden /> Dernier semestre bouclé : toutes les fiches de notes sont publiées.
      </div>
    )
  }
  const notClosed = data.programs.filter((p) => !p.closed && p.courses.total)
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <p className="flex flex-wrap items-center gap-2 font-medium">
        <FileWarning size={15} aria-hidden />
        Année non bouclée : {pending} cours du dernier semestre sur {data.totals.courses} ne sont pas publiés
        {data.totals.incomplete ? ` · ${data.totals.incomplete} finissant${data.totals.incomplete > 1 ? 's' : ''} en attente de résultats` : ''}.
      </p>
      {!compact && notClosed.length > 1 ? (
        <p className="mt-1 text-[12px] opacity-90">
          {notClosed.map((p) => `${p.code} : ${p.courses.total - p.courses.published}`).join(' · ')}
        </p>
      ) : null}
    </div>
  )
}

/** Sortants de l'année (finissants du dernier niveau) : états, clôture du dernier semestre, liste exportable. */
export function GraduatesBoard({ program = null, yearLabel }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [state, setState] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    setData(null)
    fetchGraduates(program?.id, { skipErrorToast: true })
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err)))
  }, [program?.id])

  const students = useMemo(
    () => (data?.students ?? []).filter((s) => (!state || s.state === state) && (!q || `${s.matricule} ${s.name}`.toLowerCase().includes(q.toLowerCase()))),
    [data, state, q],
  )

  if (error) return <SectionCard><EmptyState tone="error" title="Sortants indisponibles" description={error} /></SectionCard>
  if (!data) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
  if (!data.programs.length) {
    return <SectionCard><EmptyState icon={GraduationCap} title="Aucun dernier niveau" description="Aucun programme de l’année n’a encore de niveaux." /></SectionCard>
  }
  const t = data.totals

  return (
    <div className="flex flex-col gap-5">
      <ClosureBanner data={data} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4">
          <div className="font-heading text-[24px] font-semibold tabular-nums">{t.finalists}</div>
          <div className="text-[11.5px] text-[var(--app-muted)]">Finissants {yearLabel}</div>
        </div>
        {Object.keys(GRADUATE_STATES).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setState(state === k ? '' : k)}
            className={cn('rounded-2xl border bg-[var(--app-elevated)] p-4 text-left transition-all hover:shadow-md', state === k ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-[var(--app-border)]')}
          >
            <div className="font-heading text-[24px] font-semibold tabular-nums">{t[k]}</div>
            <StatePill state={k} />
          </button>
        ))}
      </div>

      {!program ? (
        <SectionCard flush title="Par programme" description="Dernier niveau de chaque programme et état de son dernier semestre.">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="text-left text-[11px] uppercase tracking-wider text-[var(--app-muted)]">
                <tr className="border-b border-[var(--app-border)]">
                  <th className="px-4 py-2 font-semibold">Programme</th>
                  <th className="px-4 py-2 font-semibold">Dernier niveau</th>
                  <th className="px-4 py-2 text-right font-semibold">Finissants</th>
                  <th className="w-48 px-4 py-2 font-semibold">États</th>
                  <th className="px-4 py-2 font-semibold">Dernier semestre</th>
                </tr>
              </thead>
              <tbody>
                {data.programs.map((p) => (
                  <tr key={p.id} className="border-b border-[var(--app-border)] align-top last:border-0">
                    <td className="px-4 py-2.5">
                      <Link to={refPaths.program(p, 'sortants')} className="font-mono text-[12px] font-semibold hover:underline">{p.code}</Link>
                      <span className="block text-[12px] text-[var(--app-muted)]">{p.name}</span>
                    </td>
                    <td className="px-4 py-2.5">{p.final_level}{p.final_semester ? <span className="text-[var(--app-muted)]"> · S{p.final_semester}</span> : null}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{p.finalists}</td>
                    <td className="px-4 py-3"><StatesBar states={p.states} total={p.finalists} /></td>
                    <td className="px-4 py-2.5">
                      {!p.courses.total ? (
                        <span className="text-[12px] text-[var(--app-muted)]">aucun cours</span>
                      ) : p.closed ? (
                        <span className="flex items-center gap-1 text-[12px] font-medium text-green-700 dark:text-green-300"><CheckCircle2 size={13} aria-hidden /> {p.courses.total}/{p.courses.total} publiés</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[12px] font-medium text-amber-700 dark:text-amber-300">
                          <AlertTriangle size={13} aria-hidden /> {p.courses.published}/{p.courses.total} publiés
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : data.programs[0]?.courses.pending.length ? (
        <SectionCard title="Cours du dernier semestre non publiés" description={`${data.programs[0].final_level} · S${data.programs[0].final_semester ?? '—'}`}>
          <ul className="divide-y divide-[var(--app-border)]">
            {data.programs[0].courses.pending.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]">
                <Link to={`/teacher/courses/${c.id}`} className="hover:underline"><span className="font-mono text-[12px] font-semibold">{c.code}</span> {c.name}</Link>
                <span className="flex items-center gap-3 text-[12px] text-[var(--app-muted)]">
                  {c.teacher ?? <span className="text-secondary-700 dark:text-secondary-300">sans enseignant</span>}
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-100">fiche {SHEET[c.status] ?? c.status}</span>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard
        flush
        title={`${students.length} finissant${students.length > 1 ? 's' : ''}`}
        description={state ? GRADUATE_STATES[state].label : 'Tous les états'}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Matricule ou nom" className="max-w-[14rem]" />
            <Button size="sm" variant="ghost" onClick={() => downloadGraduatesCsv(program?.id, `sortants-${yearLabel ?? ''}${program ? `-${program.code}` : ''}.csv`)}>
              <Download size={14} aria-hidden /> CSV
            </Button>
          </div>
        }
      >
        {students.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--app-border)] last:border-0">
                    <td className="w-[15rem] px-4 py-2.5">
                      <Link to={`/teacher/students/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
                      <span className="block font-mono text-[11px] text-[var(--app-muted)]">{s.matricule}</span>
                    </td>
                    {!program ? <td className="px-2 py-2.5 font-mono text-[12px]">{s.program.code}</td> : null}
                    <td className="px-2 py-2.5 text-[12px] text-[var(--app-fg-soft)]">{s.level} · S{s.semester}</td>
                    <td className="px-2 py-2.5"><StatePill state={s.state} /></td>
                    <td className="px-4 py-2.5 text-[12px] text-[var(--app-fg-soft)]">{s.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState compact title="Aucun finissant" description={state || q ? 'Aucun ne correspond au filtre.' : 'Aucun étudiant inscrit au dernier niveau cette année.'} />
        )}
      </SectionCard>

      {data.closed && t.graduable ? (
        <p className="text-[12.5px] text-[var(--app-fg-soft)]">
          Les diplômes se prononcent au passage de la rentrée suivante (bloc impair), qui vérifie à nouveau que tout le cycle est acquis.{' '}
          <Link to="/referentiel/passage?parity=odd" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">Passage de semestre</Link>
        </p>
      ) : null}
    </div>
  )
}
