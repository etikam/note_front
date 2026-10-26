import { useEffect, useState } from 'react'
import { BookOpen, FileSpreadsheet, Grid3x3, Users } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { fetchExplorerCourses, fetchLevelGrades } from '@/features/notes/api/notesApi'
import { useNotesFilters } from '@/features/notes/model/useNotesFilters'
import { flatCourses, fmtNote, fmtPct, fullName } from '@/features/notes/model/notesModel'
import { CoursesView } from '@/features/notes/ui/CoursesView'
import { DecisionBar, Metric } from '@/features/notes/ui/GradeVisuals'
import { GridView } from '@/features/notes/ui/GridView'
import { NotesFilterBar, ViewSwitch } from '@/features/notes/ui/NotesFilterBar'
import { StudentsView } from '@/features/notes/ui/StudentsView'
import { downloadCsv } from '@/features/reports/model/reportExport'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { PageHeader } from '@/shared/ui/PageHeader'
import { SectionCard } from '@/shared/ui/SectionCard'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

const VIEWS = [
  { id: 'students', label: 'Par étudiant', icon: Users },
  { id: 'courses', label: 'Par cours', icon: BookOpen },
  { id: 'grid', label: 'Grille', icon: Grid3x3 },
]

function useLevelData(f, enabled, yearId) {
  const [state, setState] = useState({ data: null, loading: false, error: '' })
  useEffect(() => {
    if (!enabled || !f.levelId) {
      setState({ data: null, loading: false, error: '' })
      return undefined
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: '' }))
    fetchLevelGrades({ level: f.levelId, semester: f.semester, publishedOnly: f.publishedOnly }, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((err) => !controller.signal.aborted && setState({ data: null, loading: false, error: err?.message || 'Chargement impossible.' }))
    return () => controller.abort()
  }, [enabled, f.levelId, f.semester, f.publishedOnly, yearId])
  return state
}

function useCourseList(f, enabled, yearId) {
  const [state, setState] = useState({ data: null, loading: false, error: '' })
  useEffect(() => {
    if (!enabled || !f.programId) {
      setState({ data: null, loading: false, error: '' })
      return undefined
    }
    const controller = new AbortController()
    setState((s) => ({ ...s, loading: true, error: '' }))
    fetchExplorerCourses({ program: f.programId, level: f.levelId, semester: f.semester, publishedOnly: f.publishedOnly }, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((err) => !controller.signal.aborted && setState({ data: null, loading: false, error: err?.message || 'Chargement impossible.' }))
    return () => controller.abort()
  }, [enabled, f.programId, f.levelId, f.semester, f.publishedOnly, yearId])
  return state
}

function exportLevelCsv(data) {
  const courses = flatCourses(data.structure)
  downloadCsv(
    `notes_${data.program.code}_${data.level.name}${data.semester ? `_S${data.semester}` : ''}.csv`,
    ['Rang', 'Matricule', 'Nom', 'Prénom', ...courses.map((c) => c.code), 'Moyenne', 'Crédits acquis', 'Décision', 'Mention'],
    data.students.map((s) => [
      s.rank ?? '',
      s.matricule,
      s.last_name,
      s.first_name,
      ...courses.map((c) => (s.cells[c.id]?.state === 'graded' ? s.cells[c.id].average : '')),
      s.average ?? '',
      s.credits_earned ?? '',
      s.decision_label,
      s.mention ?? '',
    ]),
  )
}

/** Synthèse de la promotion : effectif, moyennes, réussite, décisions, podium. */
function LevelSummary({ data }) {
  const { summary } = data
  const podium = [...data.students].filter((s) => s.rank && s.rank <= 3).sort((a, b) => a.rank - b.rank)
  const scale = data.grading?.scale_max ?? 10
  return (
    <div className="grid gap-4 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric label="Étudiants" value={summary.students} hint={`${data.courses_published}/${data.courses_total} fiches publiées`} />
          <Metric label="Moyenne de la promotion" value={fmtNote(summary.averages.mean)} hint={`médiane ${fmtNote(summary.averages.median)} / ${scale}`} />
          <Metric label="Réussite" value={fmtPct(summary.success_rate)} hint="admis, avec ou sans dette" />
          <Metric label="Écart" value={`${fmtNote(summary.averages.min)} – ${fmtNote(summary.averages.max)}`} hint={`écart-type ${fmtNote(summary.averages.stdev)}`} />
        </div>
        <DecisionBar decisions={summary.decisions} total={summary.students} />
      </div>
      <div className="border-t border-[var(--app-border)] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <p className="text-[11.5px] font-medium text-[var(--app-muted)]">Meilleures moyennes</p>
        {podium.length ? (
          <ol className="mt-2 flex flex-col gap-1.5">
            {podium.map((s) => (
              <li key={s.id} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className={
                    s.rank === 1
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-secondary-400 text-[11px] font-bold text-white'
                      : 'flex h-6 w-6 items-center justify-center rounded-full bg-[var(--app-subtle)] text-[11px] font-bold text-[var(--app-fg-soft)] ring-1 ring-inset ring-[var(--app-border)]'
                  }
                >
                  {s.rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-[var(--app-fg)]">{fullName(s)}</span>
                <span className="font-semibold tabular-nums">{fmtNote(s.average)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-[12.5px] text-[var(--app-muted)]">Pas encore de moyenne.</p>
        )}
      </div>
    </div>
  )
}

/** Espace « Notes » : consultation des notes du périmètre par étudiant, par cours ou en grille. */
export default function GradesExplorerPage() {
  const { academicYearLabel, academicYearId } = useAcademicYear()
  const f = useNotesFilters('grades.view')
  const view = VIEWS.some((v) => v.id === f.params.get('view')) ? f.params.get('view') : 'students'
  const level = useLevelData(f, view !== 'courses', academicYearId)
  const courseList = useCourseList(f, view === 'courses', academicYearId)

  const data = level.data
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[{ label: 'Notes' }, { label: 'Consultation' }]}
        title="Notes"
        description="Les notes des étudiants de votre périmètre, par UE et par cours, avec moyennes, rangs et décisions selon le règlement des études."
        meta={
          <>
            {academicYearLabel ? <StatusPill tone="info" dot={false}>Année {academicYearLabel}</StatusPill> : null}
            {data?.provisional && !f.publishedOnly ? <StatusPill tone="warning">Inclut des notes provisoires</StatusPill> : null}
          </>
        }
        actions={
          data && view !== 'courses' ? (
            <Button size="sm" variant="ghost" onClick={() => exportLevelCsv(data)}>
              <FileSpreadsheet size={14} aria-hidden /> Exporter (CSV)
            </Button>
          ) : null
        }
      />

      <NotesFilterBar filters={f} requireLevel={view !== 'courses'}>
        <ViewSwitch options={VIEWS} value={view} onChange={(v) => f.update({ view: v === 'students' ? '' : v })} />
      </NotesFilterBar>

      {!f.programId ? (
        <SectionCard>
          <EmptyState title="Choisissez un programme" description="Puis un niveau : les notes de ses étudiants s’affichent par UE, par cours ou en grille." />
        </SectionCard>
      ) : view === 'courses' ? (
        <CoursesView
          courses={courseList.data}
          loading={courseList.loading}
          error={courseList.error}
          selectedId={f.params.get('course')}
          onSelect={(id) => f.update({ course: id })}
        />
      ) : level.error ? (
        <SectionCard>
          <EmptyState tone="error" title="Chargement impossible" description={level.error} />
        </SectionCard>
      ) : !data ? (
        <SectionCard>
          {f.levelId || f.levelsLoading ? <SkeletonLines lines={10} /> : <EmptyState title="Aucun niveau" description="Ce programme n’a pas encore de niveau." />}
        </SectionCard>
      ) : !data.courses_total ? (
        <SectionCard>
          <EmptyState title="Aucun cours" description="Aucun cours de ce niveau pour l’année et la période choisies." />
        </SectionCard>
      ) : (
        <div className={level.loading ? 'pointer-events-none opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="flex flex-col gap-4">
            <LevelSummary data={data} />
            {view === 'grid' ? (
              <GridView data={data} />
            ) : (
              <StudentsView data={data} selectedId={f.params.get('student')} onSelect={(id) => f.update({ student: id })} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
