import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, BookOpen, Building2, CalendarRange, CopyPlus, GitCompareArrows, GraduationCap, Plus, UserRound, Users } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { fetchModules } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { CurriculumDiffDrawer } from '@/features/curriculum/ui/CurriculumDiffDrawer'
import { ReconductionDialog } from '@/features/curriculum/ui/ReconductionDialog'
import { refPaths, useReferential } from '@/features/referential/model/ReferentialContext'
import { plural, ReadinessRing } from '@/features/referential/ui/curriculumBits'
import { EntityFormDialog } from '@/features/structure/ui/EntityFormDialog'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { SectionCard } from '@/shared/ui/SectionCard'

function sum(list, key) {
  return list.reduce((s, e) => s + (e.counts?.[key] ?? 0), 0)
}

function Holders({ holders, vacantLabel = 'Poste vacant' }) {
  if (!holders?.length) {
    return <span className="text-amber-700 dark:text-amber-300">{vacantLabel}</span>
  }
  return <span className="truncate">{holders.map((h) => h.teacher_name).join(', ')}</span>
}

/** Frise des années : l'état de chaque année d'un coup d'œil, bascule sans quitter la page. */
function YearRail() {
  const { academicYears, academicYearId, setAcademicYearId } = useAcademicYear()
  const years = useMemo(() => [...(academicYears ?? [])].sort((a, b) => String(a.start_date).localeCompare(String(b.start_date))), [academicYears])
  if (years.length < 2) return null
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Années académiques">
      {years.map((y, i) => {
        const active = String(y.id) === String(academicYearId)
        return (
          <li key={y.id} className="flex items-center">
            {i > 0 ? <span className={cn('mx-1 h-px w-5', y.has_structure ? 'bg-brand-400/60' : 'bg-[var(--app-border)]')} aria-hidden /> : null}
            <button
              type="button"
              onClick={() => setAcademicYearId(y.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'group flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-all',
                active
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 dark:bg-brand-500'
                  : 'bg-[var(--app-elevated)] text-[var(--app-fg-soft)] ring-1 ring-[var(--app-border)] hover:ring-brand-400',
              )}
            >
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  active ? 'bg-white' : y.has_structure ? 'bg-brand-500' : 'border border-dashed border-[var(--app-muted)]',
                )}
                aria-hidden
              />
              {y.year}
              {y.is_current ? (
                <span className={cn('rounded-full px-1.5 text-[10px] font-semibold uppercase', active ? 'bg-white/20' : 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200')}>
                  en cours
                </span>
              ) : null}
              {!y.has_structure ? <span className={cn('text-[10.5px]', active ? 'text-white/80' : 'text-[var(--app-muted)]')}>à préparer</span> : null}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function Metric({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          tone === 'warning'
            ? 'bg-secondary-50 text-secondary-700 dark:bg-secondary-500/10 dark:text-secondary-200'
            : 'bg-white/70 text-brand-700 ring-1 ring-brand-600/10 dark:bg-white/5 dark:text-brand-200',
        )}
      >
        <Icon size={18} aria-hidden />
      </span>
      <div>
        <div className="font-heading text-[22px] font-semibold leading-none tabular-nums">{value}</div>
        <div className="mt-1 text-[11.5px] text-[var(--app-muted)]">{label}</div>
      </div>
    </div>
  )
}

function DepartmentCard({ dept }) {
  const { readiness, counts } = dept
  return (
    <Link
      to={refPaths.department(dept)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 transition-all hover:-translate-y-0.5 hover:border-brand-400/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
    >
      <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 transition-transform duration-500 group-hover:scale-150" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono text-[12px] font-bold text-brand-800 ring-1 ring-inset ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-200">
            {dept.code}
          </span>
          <h3 className="mt-2.5 font-heading text-[16px] font-semibold leading-snug">{dept.name}</h3>
        </div>
        {readiness.total ? <ReadinessRing validated={readiness.validated} total={readiness.total} size={52} /> : null}
      </div>
      <p className="relative mt-3 flex items-center gap-1.5 text-[12.5px] text-[var(--app-fg-soft)]">
        <UserRound size={14} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
        <span className="text-[var(--app-muted)]">Chef :</span>
        <Holders holders={dept.holders} vacantLabel="vacant" />
      </p>
      <dl className="relative mt-4 grid grid-cols-3 gap-2 border-t border-[var(--app-border)] pt-3 text-center">
        {[
          ['Programmes', dept.programs.length],
          ['Étudiants', counts.students],
          ['Cours', counts.courses],
        ].map(([label, v]) => (
          <div key={label}>
            <dd className="font-heading text-[17px] font-semibold tabular-nums">{v}</dd>
            <dt className="text-[10.5px] uppercase tracking-wider text-[var(--app-muted)]">{label}</dt>
          </div>
        ))}
      </dl>
      {counts.unassigned_courses || readiness.errors ? (
        <p className="relative mt-3 flex items-center gap-1.5 text-[11.5px] text-secondary-800 dark:text-secondary-200">
          <AlertTriangle size={13} aria-hidden />
          {[
            counts.unassigned_courses ? plural(counts.unassigned_courses, 'cours', 'cours') + ' sans enseignant' : null,
            readiness.errors ? plural(readiness.errors, 'erreur') + ' de maquette' : null,
          ].filter(Boolean).join(' · ')}
        </p>
      ) : null}
      <ArrowUpRight size={16} className="absolute bottom-4 right-4 text-[var(--app-muted)] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
    </Link>
  )
}

/** Niveau établissement : la faculté, ses responsables et ses départements pour l'année consultée. */
export default function FacultyHomePage() {
  const ref = useReferential()
  const [form, setForm] = useState(false)
  const [reconduct, setReconduct] = useState(false)
  const [diff, setDiff] = useState(false)
  const faculty = ref.faculties[0]
  const facultyParents = ref.faculties.filter((f) => f.can?.manage_structure)
  const deptNodes = ref.departments
  const totals = {
    programs: ref.programs.length,
    students: sum(deptNodes, 'students'),
    courses: sum(deptNodes, 'courses'),
    unassigned: sum(deptNodes, 'unassigned_courses'),
  }
  const readiness = ref.curricula?.readiness
  const vacantDepts = deptNodes.filter((d) => !d.holders?.length).length
  const vacantPrograms = ref.programs.filter((p) => !p.holders?.length).length
  const empty = deptNodes.length === 0
  const access = useAccess()
  const canCalendar = access.canGlobal('calendar.manage')
  const [modules, setModules] = useState(null)
  useEffect(() => {
    if (!ref.yearId) return
    fetchModules(ref.yearId, { skipErrorToast: true }).then(setModules).catch(() => setModules(null))
  }, [ref.yearId])
  const missingModules = modules ? [1, 2].filter((n) => !modules.some((m) => m.number === n)) : []

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--app-border)] bg-gradient-to-br from-brand-50 via-[var(--app-elevated)] to-secondary-50/40 p-6 dark:from-brand-500/10 dark:via-[var(--app-elevated)] dark:to-secondary-500/5 sm:p-8">
        <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">
              {faculty?.code ?? 'Établissement'} · {ref.yearLabel ?? 'année'}
            </p>
            <h1 className="mt-2 font-heading text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px]">{faculty?.name ?? 'Référentiel'}</h1>
            <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--app-fg-soft)]">
              <span><span className="text-[var(--app-muted)]">Direction générale : </span><Holders holders={ref.institution?.holders} /></span>
              {faculty ? <span><span className="text-[var(--app-muted)]">Direction des études : </span><Holders holders={faculty.holders} /></span> : null}
            </p>
          </div>
          {readiness?.total ? (
            <div className="flex items-center gap-3 rounded-2xl bg-white/60 p-3 pr-4 ring-1 ring-[var(--app-border)] backdrop-blur dark:bg-white/5">
              <ReadinessRing validated={readiness.validated} total={readiness.total} />
              <div>
                <p className="text-[13px] font-semibold">Maquettes validées</p>
                <p className="text-[11.5px] text-[var(--app-muted)]">
                  {readiness.validated === readiness.total ? 'L’année est prête.' : `${readiness.total - readiness.validated} à valider`}
                </p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-5 sm:grid-cols-4">
          <Metric icon={Building2} label="Départements" value={deptNodes.length} />
          <Metric icon={GraduationCap} label="Programmes" value={totals.programs} />
          <Metric icon={Users} label="Étudiants" value={totals.students} />
          <Metric icon={BookOpen} label={totals.unassigned ? `Cours · ${totals.unassigned} sans enseignant` : 'Cours'} value={totals.courses} tone={totals.unassigned ? 'warning' : undefined} />
        </div>
        <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)]/70 pt-4">
          <YearRail />
          <div className="flex flex-wrap gap-2">
            {!empty && access.canManage('students.view') ? (
              <Button size="sm" variant="ghost" as={Link} to={`/referentiel/passage?parity=${ref.year?.active_semester_parity === 'even' ? 'odd' : 'even'}`}>
                <CalendarRange size={14} aria-hidden /> Passage de semestre
                {ref.year?.active_semester_parity ? (
                  <span className="ml-1 rounded-full bg-[var(--app-subtle)] px-1.5 text-[10.5px] font-semibold">
                    bloc {ref.year.active_semester_parity === 'even' ? 'pair' : 'impair'} ouvert
                  </span>
                ) : null}
              </Button>
            ) : null}
            {ref.previousYear && !empty ? (
              <Button variant="ghost" size="sm" onClick={() => setDiff(true)}>
                <GitCompareArrows size={14} aria-hidden /> Comparer avec {ref.previousYear.label}
              </Button>
            ) : null}
            {ref.canReconduct && !empty ? (
              <Button variant="ghost" size="sm" onClick={() => setReconduct(true)}>
                <CopyPlus size={14} aria-hidden /> Reconduire des programmes
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {missingModules.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
          <AlertTriangle size={15} aria-hidden />
          {missingModules.map((n) => `M${n}`).join(' et ')} {missingModules.length > 1 ? 'ne sont pas créés' : 'n’est pas créé'} pour {ref.yearLabel} :
          les cours de ce module ne peuvent pas être offerts.
          {canCalendar ? (
            <Link to="/settings/calendar" className="ml-auto font-semibold underline-offset-2 hover:underline">Créer les modules</Link>
          ) : (
            <span className="ml-auto">À faire par la direction (Paramètres → Calendrier).</span>
          )}
        </div>
      ) : null}

      {vacantDepts || vacantPrograms ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <AlertTriangle size={15} aria-hidden />
          {[vacantDepts ? `${plural(vacantDepts, 'département')} sans chef` : null, vacantPrograms ? `${plural(vacantPrograms, 'programme')} sans directeur` : null]
            .filter(Boolean)
            .join(' · ')}
          {ref.canAssign ? <Link to="/settings/nominations" className="ml-auto font-semibold underline-offset-2 hover:underline">Nommer</Link> : null}
        </div>
      ) : null}

      {empty ? (
        <SectionCard>
          <EmptyState
            icon={CopyPlus}
            title={`${ref.yearLabel ?? 'Cette année'} n’a pas encore de structure`}
            description={
              ref.canReconduct && ref.previousYear
                ? `Reconduisez ${ref.previousYear.label} : départements, programmes, niveaux, UE et cours sont recopiés en brouillon, puis vous ajustez.`
                : 'Créez les départements de l’année pour commencer.'
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {ref.canReconduct ? <Button onClick={() => setReconduct(true)}><CopyPlus size={15} aria-hidden /> Préparer l’année</Button> : null}
                {facultyParents.length ? <Button variant="ghost" onClick={() => setForm(true)}><Plus size={15} aria-hidden /> Nouveau département</Button> : null}
              </div>
            }
          />
        </SectionCard>
      ) : (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-heading text-[16px] font-semibold">Départements</h2>
            <p className="text-[12px] text-[var(--app-muted)]">Ouvrez un département pour voir ses programmes.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {deptNodes.map((d) => <DepartmentCard key={d.id} dept={d} />)}
            {facultyParents.length ? (
              <button
                type="button"
                onClick={() => setForm(true)}
                className="flex min-h-[13rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--app-border)] text-[var(--app-muted)] transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700 dark:hover:bg-brand-500/5 dark:hover:text-brand-200"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--app-subtle)]"><Plus size={20} aria-hidden /></span>
                <span className="text-[13px] font-semibold">Nouveau département</span>
                <span className="text-[11.5px]">pour {ref.yearLabel}</span>
              </button>
            ) : null}
          </div>
        </section>
      )}

      <EntityFormDialog
        kind="department"
        open={form}
        onClose={() => setForm(false)}
        entity={null}
        parents={facultyParents}
        onSaved={async (saved) => {
          dispatchToast({ type: 'success', message: `Département « ${saved.code} » créé pour ${ref.yearLabel}.` })
          await ref.reload({ silent: true })
        }}
      />
      <ReconductionDialog open={reconduct} yearId={ref.yearId} yearLabel={ref.yearLabel} onClose={() => setReconduct(false)} onDone={() => ref.reload({ silent: true })} />
      <CurriculumDiffDrawer open={diff} onClose={() => setDiff(false)} />
    </div>
  )
}
