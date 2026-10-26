import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, FileText, Trophy } from 'lucide-react'

import { DECISION_TONE } from '@/features/reports/model/reportLabels'
import {
  cellResult,
  DECISION_LABEL,
  DECISION_ORDER,
  fmtNote,
  fullName,
  ordinal,
  UNIT_STATE,
} from '@/features/notes/model/notesModel'
import { NoteChips, ScoreGauge } from '@/features/notes/ui/GradeVisuals'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SearchInput } from '@/shared/ui/SearchInput'
import { StatusPill } from '@/shared/ui/StatusPill'

const SORTS = [
  { id: 'rank', label: 'Rang' },
  { id: 'name', label: 'Nom' },
]

function normalize(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Liste des étudiants classés + fiche détaillée par UE de l'étudiant sélectionné. */
export function StudentsView({ data, selectedId, onSelect }) {
  const grading = data.grading ?? { scale_max: 10, pass_mark: 5 }
  const [q, setQ] = useState('')
  const [decision, setDecision] = useState('')
  const [sort, setSort] = useState('rank')
  const listRef = useRef(null)

  const rows = useMemo(() => {
    const needle = normalize(q.trim())
    const list = data.students.filter(
      (s) => (!decision || s.decision === decision) && (!needle || normalize(`${s.last_name} ${s.first_name} ${s.matricule}`).includes(needle)),
    )
    return [...list].sort((a, b) =>
      sort === 'name' ? fullName(a).localeCompare(fullName(b), 'fr') : (a.rank ?? 1e9) - (b.rank ?? 1e9) || fullName(a).localeCompare(fullName(b), 'fr'),
    )
  }, [data.students, q, decision, sort])

  const selected = data.students.find((s) => String(s.id) === String(selectedId)) ?? rows[0] ?? null

  // Navigation clavier ↑ ↓ dans la liste.
  function onKeyDown(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const i = rows.findIndex((r) => r.id === selected?.id)
    const next = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]
    if (next) onSelect(next.id)
  }

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [selected?.id])

  const counts = useMemo(() => {
    const c = {}
    for (const s of data.students) c[s.decision] = (c[s.decision] || 0) + 1
    return c
  }, [data.students])

  if (!data.students.length) {
    return <EmptyState title="Aucun étudiant inscrit" description="Aucune inscription approuvée aux cours de ce niveau pour la période choisie." />
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <section aria-label="Étudiants" className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]">
        <div className="flex flex-col gap-2 border-b border-[var(--app-border)] p-2.5">
          <SearchInput value={q} onChange={setQ} placeholder="Nom ou matricule" ariaLabel="Rechercher un étudiant" />
          <div className="flex flex-wrap items-center gap-1">
            <FilterChip active={!decision} onClick={() => setDecision('')}>
              Tous <span className="tabular-nums opacity-70">{data.students.length}</span>
            </FilterChip>
            {DECISION_ORDER.filter((k) => counts[k]).map((k) => (
              <FilterChip key={k} active={decision === k} onClick={() => setDecision(decision === k ? '' : k)}>
                {DECISION_LABEL[k]} <span className="tabular-nums opacity-70">{counts[k]}</span>
              </FilterChip>
            ))}
          </div>
          <div className="flex items-center justify-between text-[11.5px] text-[var(--app-muted)]">
            <span>
              {rows.length} étudiant{rows.length > 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1">
              Trier par
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={cn('rounded px-1.5 py-0.5 font-medium', sort === s.id ? 'bg-[var(--app-subtle)] text-[var(--app-fg)]' : 'hover:text-[var(--app-fg)]')}
                >
                  {s.label}
                </button>
              ))}
            </span>
          </div>
        </div>
        <ul ref={listRef} role="listbox" tabIndex={0} aria-label="Étudiants classés" onKeyDown={onKeyDown} className="min-h-0 flex-1 overflow-y-auto p-1.5 focus:outline-none max-lg:max-h-80">
          {rows.map((s) => {
            const active = s.id === selected?.id
            return (
              <li key={s.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => onSelect(s.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors',
                    active ? 'bg-brand-50 ring-1 ring-inset ring-brand-500/30 dark:bg-white/[0.06] dark:ring-brand-400/30' : 'hover:bg-[var(--app-hover)]',
                  )}
                >
                  <span className={cn('w-7 shrink-0 text-center text-[11.5px] font-semibold tabular-nums', s.rank && s.rank <= 3 ? 'text-secondary-700 dark:text-secondary-300' : 'text-[var(--app-muted)]')}>
                    {s.rank ?? '—'}
                  </span>
                  <Avatar name={fullName(s)} size="xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-[var(--app-fg)]">{fullName(s)}</span>
                    <span className="flex items-center gap-2">
                      <span className="truncate font-mono text-[11px] text-[var(--app-muted)]">{s.matricule}</span>
                      <ScoreGauge value={s.average} scale={grading.scale_max} pass={grading.pass_mark} className="w-12" />
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    <span className="text-[13px] font-semibold tabular-nums text-[var(--app-fg)]">{fmtNote(s.average)}</span>
                    <span className={cn('h-1.5 w-1.5 rounded-full', DOT[s.decision])} title={DECISION_LABEL[s.decision]} />
                  </span>
                </button>
              </li>
            )
          })}
          {!rows.length ? <li className="px-3 py-6 text-center text-[12.5px] text-[var(--app-muted)]">Aucun étudiant ne correspond.</li> : null}
        </ul>
      </section>

      {selected ? <StudentSheet key={selected.id} student={selected} data={data} total={data.students.length} /> : null}
    </div>
  )
}

const DOT = {
  admitted: 'bg-green-500',
  admitted_debt: 'bg-secondary-400',
  makeup: 'bg-orange-600',
  repeat: 'bg-red-600',
  pending: 'bg-zinc-400',
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset transition-colors',
        active ? 'bg-brand-600 text-white ring-brand-600 dark:bg-brand-500 dark:ring-brand-500' : 'text-[var(--app-fg-soft)] ring-[var(--app-border)] hover:bg-[var(--app-hover)]',
      )}
    >
      {children}
    </button>
  )
}

/** Fiche de l'étudiant : synthèse puis UE → cours avec notes, moyenne et résultat. */
function StudentSheet({ student: s, data, total }) {
  const grading = data.grading ?? { scale_max: 10, pass_mark: 5 }
  const creditsPct = s.credits_attempted ? Math.round((100 * (s.credits_earned ?? 0)) / s.credits_attempted) : 0
  const semesters = data.structure
    .map((sem) => ({ ...sem, units: sem.units.filter((u) => u.courses.some((c) => s.cells[c.id])) }))
    .filter((sem) => sem.units.length)

  return (
    <section aria-label={`Notes de ${fullName(s)}`} className="flex min-w-0 flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
        <div className="flex flex-wrap items-start gap-4 p-4">
          <Avatar name={fullName(s)} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-[18px] font-semibold tracking-tight text-[var(--app-fg)]">{fullName(s)}</h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--app-muted)]">
              <span className="font-mono">{s.matricule}</span> · {data.program.code} · {data.level.name}
              {data.semester ? ` · semestre ${data.semester}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill tone={DECISION_TONE[s.decision]}>{s.decision_label}</StatusPill>
              {s.mention ? <StatusPill tone="info" dot={false}>Mention {s.mention}</StatusPill> : null}
              {s.rank === 1 ? (
                <StatusPill tone="warning" dot={false}>
                  <Trophy size={12} aria-hidden /> Major
                </StatusPill>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to={`/grades/transcripts?student=${s.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 text-[12.5px] font-medium text-[var(--app-fg-soft)] hover:bg-[var(--app-hover)]"
            >
              <FileText size={14} aria-hidden /> Relevé
            </Link>
            <Link
              to={`/teacher/students/${s.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-2.5 text-[12.5px] font-medium text-[var(--app-fg-soft)] hover:bg-[var(--app-hover)]"
            >
              Dossier <ArrowUpRight size={13} aria-hidden />
            </Link>
          </div>
        </div>
        <dl className="grid grid-cols-2 divide-[var(--app-border)] border-t border-[var(--app-border)] bg-[var(--app-subtle)] sm:grid-cols-4 sm:divide-x">
          <div className="px-4 py-3">
            <dt className="text-[11.5px] text-[var(--app-muted)]">Moyenne générale</dt>
            <dd className="font-heading text-[22px] font-semibold leading-tight tabular-nums">
              {fmtNote(s.average)}
              <span className="text-[13px] font-normal text-[var(--app-muted)]"> / {grading.scale_max}</span>
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[11.5px] text-[var(--app-muted)]">Rang</dt>
            <dd className="font-heading text-[22px] font-semibold leading-tight tabular-nums">
              {ordinal(s.rank)}
              <span className="text-[13px] font-normal text-[var(--app-muted)]"> / {total}</span>
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[11.5px] text-[var(--app-muted)]">Crédits acquis</dt>
            <dd className="font-heading text-[22px] font-semibold leading-tight tabular-nums">
              {s.credits_earned ?? 0}
              <span className="text-[13px] font-normal text-[var(--app-muted)]"> / {s.credits_attempted ?? 0}</span>
            </dd>
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[var(--app-border)]">
              <span className="block h-full rounded-full bg-green-500" style={{ width: `${creditsPct}%` }} />
            </span>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[11.5px] text-[var(--app-muted)]">Rattrapages · dettes</dt>
            <dd className="font-heading text-[22px] font-semibold leading-tight tabular-nums">
              <span className={s.makeups ? 'text-orange-700 dark:text-orange-300' : ''}>{s.makeups}</span>
              <span className="text-[13px] font-normal text-[var(--app-muted)]"> · </span>
              <span className={s.debts ? 'text-red-700 dark:text-red-300' : ''}>{s.debts}</span>
            </dd>
          </div>
        </dl>
      </div>

      {semesters.map((sem) => (
        <div key={sem.semester ?? 'x'} className="flex flex-col gap-3">
          {semesters.length > 1 || sem.semester ? (
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">Semestre {sem.semester}</h3>
          ) : null}
          {sem.units.map((u) => (
            <UnitCard key={u.id} unit={u} student={s} grading={grading} />
          ))}
        </div>
      ))}
    </section>
  )
}

function UnitCard({ unit: u, student: s, grading }) {
  const state = UNIT_STATE[s.units_state?.[String(u.id)]] ?? UNIT_STATE.pending
  const avg = s.units?.[String(u.id)]
  return (
    <article className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--app-border)] bg-[var(--app-subtle)] px-4 py-2.5">
        <span className="rounded-md bg-[var(--app-elevated)] px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-[var(--app-fg-soft)] ring-1 ring-inset ring-[var(--app-border)]">{u.code}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold text-[var(--app-fg)]">{u.name}</span>
          <span className="text-[11.5px] text-[var(--app-muted)]">
            {u.credits} crédit{u.credits > 1 ? 's' : ''} · {u.courses.length} cours
          </span>
        </span>
        <StatusPill tone={state.tone}>{state.label}</StatusPill>
        <span className="text-right">
          <span className="block text-[10.5px] uppercase tracking-wide text-[var(--app-muted)]">Moyenne UE</span>
          <span className="font-heading text-[18px] font-semibold tabular-nums text-[var(--app-fg)]">{fmtNote(avg)}</span>
        </span>
      </header>
      <ul className="divide-y divide-[var(--app-border)]">
        {u.courses.map((c) => {
          const cell = s.cells[c.id]
          if (!cell) return null
          const res = cellResult(cell)
          const g = c.grading ?? grading
          return (
            <li key={c.id} className="grid items-center gap-x-4 gap-y-1.5 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto_7.5rem]">
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-[var(--app-fg)]">{c.name}</span>
                <span className="text-[11.5px] text-[var(--app-muted)]">
                  <span className="font-mono">{c.code}</span> · {c.credits ?? 0} cr.{c.teacher_name ? ` · ${c.teacher_name}` : ''}
                </span>
              </span>
              <span>{cell.notes ? <NoteChips notes={cell.notes} pass={g.pass_mark} /> : <span className="text-[12px] text-[var(--app-muted)]">Fiche non publiée</span>}</span>
              <span className="flex flex-col items-end gap-1">
                <span className="flex items-center gap-1.5">
                  {cell.provisional ? (
                    <span className="rounded bg-[var(--app-subtle)] px-1 text-[10px] font-medium text-[var(--app-muted)] ring-1 ring-inset ring-[var(--app-border)]" title="Fiche non publiée : note susceptible d’évoluer">
                      provisoire
                    </span>
                  ) : null}
                  <span className="text-[14px] font-semibold tabular-nums text-[var(--app-fg)]">{cell.state === 'graded' ? fmtNote(cell.average) : '—'}</span>
                </span>
                {res ? <StatusPill tone={res.tone} dot={false}>{res.label}</StatusPill> : <span className="text-[11.5px] text-[var(--app-muted)]">{cell.state === 'pending' ? 'En attente' : 'Incomplet'}</span>}
              </span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
