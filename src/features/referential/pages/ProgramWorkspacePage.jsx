import { useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  History,
  LayoutDashboard,
  Layers,
  ListChecks,
  Pencil,
  Scale,
  Settings2,
  Trash2,
  Users,
  UsersRound,
  Award,
} from 'lucide-react'

import { apiErrorMessage } from '@/features/access/api/accessApi'
import { useAccess } from '@/features/access/model/useAccess'
import { CoursesTab } from '@/features/curriculum/ui/CoursesTab'
import { refPaths, useReferential } from '@/features/referential/model/ReferentialContext'
import { ChecksList, CurriculumActionDialog, CurriculumStatusPill, plural, SemesterChip } from '@/features/referential/ui/curriculumBits'
import { MandatesCard } from '@/features/referential/ui/MandateTools'
import { NotInYear } from '@/features/referential/ui/NotInYear'
import { GraduatesBoard } from '@/features/referential/ui/GraduatesBoard'
import { CurriculumBoard } from '@/features/referential/ui/program/CurriculumBoard'
import { ProgramCohorts } from '@/features/referential/ui/program/ProgramCohorts'
import { ProgramHistory } from '@/features/referential/ui/program/ProgramHistory'
import { ProgramStudents } from '@/features/referential/ui/program/ProgramStudents'
import { deleteProgram } from '@/features/structure/api/structureApi'
import { EntityFormDialog } from '@/features/structure/ui/EntityFormDialog'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { SectionCard } from '@/shared/ui/SectionCard'

function Tile({ icon: Icon, label, value, tone, to }) {
  const body = (
    <>
      <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', tone === 'warning' ? 'bg-secondary-50 text-secondary-700 dark:bg-secondary-500/10 dark:text-secondary-200' : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200')}>
        <Icon size={17} aria-hidden />
      </span>
      <span>
        <span className="block font-heading text-[20px] font-semibold leading-none tabular-nums">{value}</span>
        <span className="mt-1 block text-[11.5px] text-[var(--app-muted)]">{label}</span>
      </span>
    </>
  )
  const cls = 'flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4'
  return to ? <Link to={to} className={cn(cls, 'transition-colors hover:border-brand-400/60')}>{body}</Link> : <div className={cls}>{body}</div>
}

function Overview({ program }) {
  const c = program.curriculum
  const [pending, setPending] = useState(null)
  const ref = useReferential()
  const byLevel = new Map()
  for (const s of c?.semesters ?? []) {
    if (!byLevel.has(s.level_name)) byLevel.set(s.level_name, [])
    byLevel.get(s.level_name).push(s)
  }
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Tile icon={Users} label="Étudiants" value={program.counts.students} to={refPaths.program(program, 'etudiants')} />
          <Tile icon={Layers} label="UE" value={c?.units ?? '—'} to={refPaths.program(program, 'maquette')} />
          <Tile icon={BookOpen} label="Cours" value={program.counts.courses} to={refPaths.program(program, 'cours')} />
          <Tile icon={ClipboardList} label="Sans enseignant" value={program.counts.unassigned_courses} tone={program.counts.unassigned_courses ? 'warning' : undefined} to={refPaths.program(program, 'cours')} />
        </div>
        {c ? (
          <SectionCard
            title="Maquette de l’année"
            description={`${plural(c.levels, 'niveau')} · ${c.units} UE · ${c.credits} crédits`}
            actions={
              <div className="flex items-center gap-2">
                <CurriculumStatusPill curriculum={c} />
                <Button size="sm" variant="ghost" as={Link} to={refPaths.program(program, 'maquette')}>Ouvrir <ArrowRight size={13} aria-hidden /></Button>
              </div>
            }
          >
            {byLevel.size ? (
              <dl className="mb-4 grid gap-2 sm:grid-cols-3">
                {[...byLevel.entries()].map(([level, slots]) => (
                  <div key={level} className="rounded-xl bg-[var(--app-subtle)]/70 px-3 py-2">
                    <dt className="text-[12px] font-semibold">{level}</dt>
                    <dd className="mt-1 flex gap-1">{slots.map((s) => <SemesterChip key={s.semester} slot={s} />)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <ChecksList checks={c.checks} defaultOpen />
            {c.can?.validate && c.status !== 'validated' ? (
              <div className="mt-4 flex justify-end">
                <Button size="sm" disabled={c.errors > 0} onClick={() => setPending({ program, action: 'validate' })}>Valider la maquette</Button>
              </div>
            ) : null}
          </SectionCard>
        ) : null}
      </div>
      <div className="flex flex-col gap-5">
        {program.counts.unassigned_courses ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12.5px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              {plural(program.counts.unassigned_courses, 'cours', 'cours')} sans enseignant.{' '}
              <Link to={`/teacher/faculty/course-assignments?program=${program.id}`} className="font-semibold underline-offset-2 hover:underline">Affecter</Link>
            </span>
          </div>
        ) : null}
        <MandatesCard entity={program} title="Direction du programme" />
      </div>
      <CurriculumActionDialog pending={pending} onClose={() => setPending(null)} onDone={() => { setPending(null); void ref.reload({ silent: true }) }} />
    </div>
  )
}

function Results({ program }) {
  const links = [
    { to: `/teacher/reports?report=deliberation&program=${program.id}`, icon: FileCheck2, title: 'PV de délibération', text: 'Moyennes d’UE, crédits et décisions du jury, par niveau.' },
    { to: `/teacher/reports?report=levels&program=${program.id}`, icon: BarChart3, title: 'Statistiques par niveau', text: 'Effectifs, réussite et moyennes, filles et garçons.' },
    { to: `/teacher/reports?report=courses&program=${program.id}`, icon: ListChecks, title: 'Résultats par cours', text: 'Moyennes, rattrapages et dettes de chaque cours.' },
    { to: `/grades?program=${program.id}`, icon: GraduationCap, title: 'Notes des étudiants', text: 'Par étudiant et UE, par cours ou en grille.' },
    { to: `/grades/transcripts?program=${program.id}`, icon: FileCheck2, title: 'Relevés de notes', text: 'Aperçu, délivrance et registre des relevés.' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {links.map((l) => (
        <Link key={l.to} to={l.to} className="group flex items-start gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 transition-colors hover:border-brand-400/60 hover:bg-[var(--app-hover)]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200"><l.icon size={18} aria-hidden /></span>
          <span>
            <span className="flex items-center gap-1 text-[13.5px] font-semibold">{l.title}<ArrowRight size={13} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden /></span>
            <span className="mt-0.5 block text-[12px] text-[var(--app-muted)]">{l.text}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}

function Settings({ program }) {
  const ref = useReferential()
  const navigate = useNavigate()
  const [edit, setEdit] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const canManage = program.can?.manage_structure
  const empty = !program.counts.levels && !program.counts.courses && !program.counts.students
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <SectionCard title="Identité du programme" actions={canManage ? <Button size="sm" variant="ghost" onClick={() => setEdit(true)}><Pencil size={14} aria-hidden /> Modifier</Button> : null}>
        <dl className="space-y-2 text-[13px]">
          {[['Code', program.code], ['Intitulé', program.name], ['Département', `${program.department.code} — ${program.department.name}`], ['Année', ref.yearLabel]].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-[var(--app-border)] pb-2 last:border-0">
              <dt className="text-[var(--app-muted)]">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {program.description ? <p className="mt-3 text-[12.5px] text-[var(--app-fg-soft)]">{program.description}</p> : null}
        <p className="mt-3 text-[11.5px] text-[var(--app-muted)]">Une modification ne concerne que {ref.yearLabel} : les années précédentes gardent leur version.</p>
      </SectionCard>
      <div className="flex flex-col gap-5">
        <MandatesCard entity={program} title="Direction du programme" />
        <Link to="/settings/regulation" className="flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 hover:border-brand-400/60">
          <Scale size={18} className="text-brand-600" aria-hidden />
          <span className="text-[13px]"><span className="font-semibold">Exceptions au règlement</span><span className="block text-[12px] text-[var(--app-muted)]">Règles de notation et de délibération propres à ce programme.</span></span>
        </Link>
        {canManage && empty ? (
          <Button variant="ghost" className="self-end text-red-700 dark:text-red-300" onClick={() => setConfirm(true)}>
            <Trash2 size={14} aria-hidden /> Retirer le programme de {ref.yearLabel}
          </Button>
        ) : null}
      </div>
      <EntityFormDialog
        kind="program"
        open={edit}
        onClose={() => setEdit(false)}
        entity={program}
        parents={ref.departments.filter((d) => d.can?.manage_structure)}
        onSaved={async (saved) => {
          dispatchToast({ type: 'success', message: `Programme « ${saved.code} » enregistré.` })
          await ref.reload({ silent: true })
        }}
      />
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Retirer « ${program.code} » de ${ref.yearLabel} ?`}
        message="Le programme disparaît de cette année seulement ; son historique est conservé."
        confirmLabel="Retirer"
        onConfirm={async () => {
          try {
            await deleteProgram(program.id)
            dispatchToast({ type: 'success', message: `« ${program.code} » retiré de ${ref.yearLabel}.` })
            navigate(refPaths.department({ identity: ref.departmentById.get(program.department.id)?.identity }))
            await ref.reload({ silent: true })
          } catch (err) {
            dispatchToast({ type: 'error', message: apiErrorMessage(err, 'Suppression impossible.') })
            throw err
          }
        }}
      />
    </div>
  )
}

const TABS = [
  { id: '', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { id: 'maquette', label: 'Maquette', icon: Layers, perm: 'curriculum' },
  { id: 'etudiants', label: 'Étudiants', icon: Users, perm: 'students.view' },
  { id: 'promotions', label: 'Promotions', icon: UsersRound, perm: 'students.view' },
  { id: 'sortants', label: 'Sortants', icon: Award, perm: 'students.view' },
  { id: 'cours', label: 'Cours & enseignants', icon: BookOpen, perm: 'courses.view' },
  { id: 'resultats', label: 'Résultats', icon: BarChart3, perm: 'reports.view' },
  { id: 'historique', label: 'Historique', icon: History },
  { id: 'reglages', label: 'Réglages', icon: Settings2 },
]

/** Espace de travail d'un programme pour l'année : maquette, étudiants, cours, résultats, historique. */
export default function ProgramWorkspacePage() {
  const { identity, tab = '' } = useParams()
  const ref = useReferential()
  const access = useAccess()
  const program = ref.programByIdentity.get(identity)
  if (!program) return <NotInYear kind="program" />

  const covers = (perm) => access.covers(perm, { programId: program.id, departmentId: program.department.id })
  const tabs = TABS.filter((t) => !t.perm || (t.perm === 'curriculum' ? Boolean(program.curriculum) || covers('curriculum.manage') : covers(t.perm)))
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  const dept = ref.departmentById.get(program.department.id)

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-6 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <GraduationCap size={26} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-muted)]">
                Programme · {dept ? <Link to={refPaths.department(dept)} className="hover:text-brand-700 hover:underline">{dept.code}</Link> : program.department.code} · {ref.yearLabel}
              </p>
              <h1 className="mt-1 font-heading text-[24px] font-semibold leading-tight tracking-tight">
                <span className="mr-2 font-mono text-[18px] text-brand-700 dark:text-brand-300">{program.code}</span>
                {program.name}
              </h1>
              <p className="mt-1.5 text-[12.5px] text-[var(--app-fg-soft)]">
                <span className="text-[var(--app-muted)]">Direction : </span>
                {program.holders?.length ? program.holders.map((h) => h.teacher_name).join(', ') : <span className="text-amber-700 dark:text-amber-300">vacante</span>}
              </p>
            </div>
          </div>
          <CurriculumStatusPill curriculum={program.curriculum} />
        </div>
        <nav aria-label="Sections du programme" className="-mb-px mt-5 flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.id || 'overview'}
              to={refPaths.program(program, t.id || undefined)}
              end
              className={() =>
                cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors',
                  current.id === t.id ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-200' : 'border-transparent text-[var(--app-muted)] hover:text-[var(--app-fg)]',
                )
              }
            >
              <t.icon size={15} aria-hidden /> {t.label}
            </NavLink>
          ))}
        </nav>
      </section>

      <div key={current.id} className="ds-fade-in">
        {current.id === 'maquette' ? (
          <CurriculumBoard program={program} />
        ) : current.id === 'etudiants' ? (
          <ProgramStudents program={program} />
        ) : current.id === 'sortants' ? (
          <GraduatesBoard program={program} yearLabel={ref.yearLabel} />
        ) : current.id === 'promotions' ? (
          <ProgramCohorts program={program} />
        ) : current.id === 'cours' ? (
          <CoursesTab academicYearId={ref.yearId} programId={String(program.id)} />
        ) : current.id === 'resultats' ? (
          <Results program={program} />
        ) : current.id === 'historique' ? (
          <ProgramHistory program={program} />
        ) : current.id === 'reglages' ? (
          <Settings program={program} />
        ) : (
          <Overview program={program} />
        )}
      </div>
    </div>
  )
}
