import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Building2, CalendarClock, CalendarRange, ClipboardCheck, Layers, PencilLine, Users } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { SHEET_STATUS } from '@/features/gradeWorkflow/model/gradeSheetLabels'
import { Metric } from '@/features/notes/ui/GradeVisuals'
import { apiClient } from '@/shared/api/client'
import { API_PREFIX } from '@/shared/api/endpoints'
import { cn } from '@/shared/lib/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SearchInput } from '@/shared/ui/SearchInput'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const fmtDate = (v) => (v ? shortDate.format(new Date(v)) : '—')

const FILTERS = [
  { id: '', label: 'Tous' },
  { id: 'todo', label: 'À saisir' },
  { id: 'review', label: 'En validation' },
  { id: 'published', label: 'Publiées' },
]

function matches(c, filter) {
  if (!filter) return true
  if (filter === 'todo') return c.sheet.status === 'draft' || c.sheet.status === 'unlocked'
  return c.sheet.status === filter
}

/** Avancement de la saisie : notes complètes / inscrits. */
function EntryProgress({ graded, enrolled }) {
  const pct = enrolled ? Math.round((100 * graded) / enrolled) : 0
  const done = enrolled > 0 && graded >= enrolled
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-[11.5px]">
        <span className="text-[var(--app-muted)]">Saisie des notes</span>
        <span className="tabular-nums font-medium text-[var(--app-fg-soft)]">
          {enrolled ? `${graded}/${enrolled}` : 'aucun inscrit'}
        </span>
      </div>
      <span className="block h-1.5 overflow-hidden rounded-full bg-[var(--app-subtle)] ring-1 ring-inset ring-[var(--app-border)]">
        <span className={cn('block h-full rounded-full', done ? 'bg-green-500' : 'bg-brand-600 dark:bg-brand-400')} style={{ width: `${pct}%` }} />
      </span>
    </div>
  )
}

function CourseCard({ course: c }) {
  const sheet = SHEET_STATUS[c.sheet.status]
  return (
    <article className="group flex h-full flex-col rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors hover:border-brand-400/50 hover:bg-[var(--app-hover)] dark:hover:border-brand-500/40">
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-brand-800 ring-1 ring-inset ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-100">{c.code}</span>
            <span className="rounded-md bg-[var(--app-subtle)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--app-muted)] ring-1 ring-inset ring-[var(--app-border)]" title={c.teaching_unit.name}>
              {c.teaching_unit.code}
            </span>
          </span>
          {sheet ? (
            <StatusPill tone={sheet.tone} title={c.sheet.step_label ? `Étape : ${c.sheet.step_label}` : 'Fiche de notes'}>
              {sheet.label}
            </StatusPill>
          ) : null}
        </div>

        <div>
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--app-fg)]">{c.name}</h3>
          <p className="mt-0.5 truncate text-[12px] text-[var(--app-muted)]" title={c.teaching_unit.name}>
            {c.teaching_unit.name}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
          <div className="flex items-center gap-1.5 text-[var(--app-fg-soft)]">
            <Layers size={13} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
            <span className="truncate">
              {c.level?.name ?? '—'}
              {c.semester ? ` · S${c.semester}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[var(--app-fg-soft)]">
            <Users size={13} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
            <span className="tabular-nums">
              {c.enrolled} inscrit{c.enrolled > 1 ? 's' : ''} · {c.credits} cr.
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 text-[var(--app-fg-soft)]">
            <CalendarRange size={13} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
            <span>
              Module {c.module.number} · {fmtDate(c.module.start_date)} → {fmtDate(c.module.end_date)}
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <CalendarClock size={13} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
            {c.schedule ? (
              <span className="text-[var(--app-fg-soft)]">{c.schedule.label}</span>
            ) : (
              <span className="text-[var(--app-muted)]">
                Emploi du temps : <span className="italic">pas encore planifié</span>
              </span>
            )}
          </div>
        </dl>

        <div className="mt-auto">
          <EntryProgress graded={c.graded} enrolled={c.enrolled} />
        </div>
      </div>
      <Link
        to={`/teacher/courses/${c.id}?tab=grades`}
        className="flex items-center justify-between gap-2 rounded-b-xl border-t border-[var(--app-border)] px-4 py-2.5 text-[12.5px] font-medium text-brand-700 transition-colors hover:bg-brand-50/60 dark:text-brand-200 dark:hover:bg-white/[0.04]"
      >
        <span className="inline-flex items-center gap-1.5">
          {c.sheet.status === 'published' ? <ClipboardCheck size={14} aria-hidden /> : <PencilLine size={14} aria-hidden />}
          {c.sheet.status === 'published' ? 'Voir les notes publiées' : c.sheet.status === 'review' ? 'Suivre la validation' : 'Saisir les notes'}
        </span>
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </article>
  )
}

/** Mes cours : cours affectés de l'année, groupés par département et programme. */
export function TeacherMyCoursesPage() {
  const { academicYearId, academicYearLabel } = useAcademicYear()
  const [courses, setCourses] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    setCourses(null)
    setError('')
    apiClient
      .get(`${API_PREFIX}/academics/my-courses/`, { skipErrorToast: true })
      .then(({ data }) => !cancelled && setCourses(data.courses ?? []))
      .catch((err) => !cancelled && setError(err?.message || 'Impossible de charger vos cours.'))
    return () => {
      cancelled = true
    }
  }, [academicYearId])

  const list = useMemo(() => courses ?? [], [courses])
  const totals = useMemo(
    () => ({
      courses: list.length,
      students: list.reduce((n, c) => n + c.enrolled, 0),
      missing: list.reduce((n, c) => n + Math.max(0, c.enrolled - c.graded), 0),
      published: list.filter((c) => c.sheet.status === 'published').length,
      todo: list.filter((c) => matches(c, 'todo')).length,
    }),
    [list],
  )

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const map = new Map()
    for (const c of list) {
      if (!matches(c, filter)) continue
      if (needle && ![c.code, c.name, c.teaching_unit.code, c.teaching_unit.name, c.program.name, c.program.code, c.level?.name].join(' ').toLowerCase().includes(needle)) continue
      const key = c.program.id
      if (!map.has(key)) map.set(key, { program: c.program, department: c.department, courses: [] })
      map.get(key).courses.push(c)
    }
    return [...map.values()]
  }, [list, q, filter])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        breadcrumbs={[{ label: 'Mon espace' }, { label: 'Mes cours' }]}
        title="Mes cours"
        description="Les cours qui vous sont affectés cette année, par programme : saisie des notes, état de la fiche, période et emploi du temps."
        meta={academicYearLabel ? <StatusPill tone="info" dot={false}>Année {academicYearLabel}</StatusPill> : null}
      />

      {courses?.length ? (
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 sm:grid-cols-4">
          <Metric label="Cours" value={totals.courses} hint={`${groups.length} programme${groups.length > 1 ? 's' : ''}`} />
          <Metric label="Étudiants inscrits" value={totals.students} />
          <Metric label="Notes à compléter" value={totals.missing} hint={totals.todo ? `${totals.todo} fiche${totals.todo > 1 ? 's' : ''} en saisie` : 'tout est saisi'} />
          <Metric label="Fiches publiées" value={`${totals.published}/${totals.courses}`} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Cours, UE, programme, niveau" className="w-full max-w-xs" ariaLabel="Rechercher un cours" />
        <div role="tablist" aria-label="État de la fiche" className="inline-flex rounded-lg border border-[var(--app-border)] bg-[var(--app-subtle)] p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'h-8 rounded-md px-3 text-[12.5px] font-medium transition-colors',
                filter === f.id ? 'bg-[var(--app-elevated)] text-[var(--app-fg)] shadow-sm' : 'text-[var(--app-muted)] hover:text-[var(--app-fg)]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={error} />
        </SectionCard>
      ) : !courses ? (
        <SectionCard>
          <SkeletonLines lines={6} />
        </SectionCard>
      ) : !groups.length ? (
        <SectionCard>
          <EmptyState
            icon={BookOpen}
            title={courses.length ? 'Aucun cours ne correspond' : 'Aucun cours affecté'}
            description={courses.length ? 'Modifiez la recherche ou le filtre.' : 'Les cours qui vous sont affectés pour l’année sélectionnée apparaîtront ici.'}
          />
        </SectionCard>
      ) : (
        groups.map((g) => (
          <section key={g.program.id} aria-label={g.program.name} className="flex flex-col gap-3">
            <header className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--app-muted)]">
                <Building2 size={13} aria-hidden /> {g.department.name}
              </span>
              <span className="text-[var(--app-border-strong)]">›</span>
              <h2 className="font-heading text-[15px] font-semibold text-[var(--app-fg)]">{g.program.name}</h2>
              <span className="rounded bg-[var(--app-subtle)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--app-muted)] ring-1 ring-inset ring-[var(--app-border)]">{g.program.code}</span>
              <span className="text-[12px] text-[var(--app-muted)]">
                · {g.courses.length} cours
              </span>
            </header>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {g.courses.map((c) => (
                <li key={c.id}>
                  <CourseCard course={c} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
