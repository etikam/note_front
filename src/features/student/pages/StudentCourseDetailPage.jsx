import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { fetchCourseArchives, fetchCourseDetail } from '@/features/student/api/studentApi'
import { useStudentGrades } from '@/features/student/hooks/useStudentResources'
import { ENROLLMENT_STATUS_UI, STUDENT_BADGE } from '@/features/student/student.constants'
import { StudentEmptyState } from '@/features/student/ui/StudentEmptyState'
import {
  NotationGradeStatusBadge,
  NotationPublicationBadges,
  NotationWorkflowBadge,
} from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationStatusBadges'
import { StudentPageHeader } from '@/features/student/ui/StudentPageHeader'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Spinner } from '@/shared/ui/Spinner'

const TABS = [
  { id: 'overview', label: 'Aperçu' },
  { id: 'grade', label: 'Ma note' },
  { id: 'archives', label: 'Supports' },
]

export function StudentCourseDetailPage() {
  const { courseId } = useParams()
  const tabsId = useId()
  const [tab, setTab] = useState('overview')
  const [course, setCourse] = useState(null)
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { data: gradesData } = useStudentGrades({ page_size: 200 })
  const myGrade = useMemo(
    () => (gradesData?.results ?? []).find((g) => String(g.course_id) === String(courseId)),
    [gradesData, courseId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [courseRes, archivesRes] = await Promise.all([
        fetchCourseDetail(courseId),
        fetchCourseArchives(courseId),
      ])
      setCourse(courseRes)
      setArchives(Array.isArray(archivesRes) ? archivesRes : archivesRes?.results ?? [])
    } catch (err) {
      setError(err)
      dispatchToast({ type: 'error', message: err?.message ?? 'Cours inaccessible.' })
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Chargement du cours" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <StudentEmptyState
        title="Cours introuvable"
        description="Vous n'êtes peut-être pas inscrit à ce cours ou il n'existe pas."
      />
    )
  }

  const enrollmentStatus = course.enrollment_status ?? course.my_enrollment_status
  const statusUi = ENROLLMENT_STATUS_UI[enrollmentStatus] ?? ENROLLMENT_STATUS_UI.pending

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <Link
        to="/student/courses"
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-200"
      >
        <ArrowLeft size={18} aria-hidden />
        Retour aux cours
      </Link>

      <StudentPageHeader
        title={`${course.code} — ${course.name}`}
        description={course.teaching_unit_name ?? course.teaching_unit?.name}
      />

      <div
        role="tablist"
        aria-label="Sections du cours"
        className="flex flex-nowrap gap-2 overflow-x-auto border-b border-[var(--app-border)] pb-2"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`${tabsId}-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`${tabsId}-panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.id
                ? 'bg-brand-500/10 text-brand-800 dark:text-brand-200'
                : 'text-[var(--app-muted)] hover:text-[var(--app-fg)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <section
          id={`${tabsId}-panel-overview`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-overview`}
          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-6 space-y-3 text-sm"
        >
          <p>
            <span className="text-[var(--app-muted)]">UE :</span> {course.teaching_unit_code ?? '—'}
          </p>
          <p>
            <span className="text-[var(--app-muted)]">Crédits :</span> {course.credits ?? '—'}
          </p>
          <p>
            <span className="text-[var(--app-muted)]">Enseignant :</span>{' '}
            {course.teacher_name ?? course.teacher?.full_name ?? '—'}
          </p>
          <p className="flex items-center gap-2">
            <span className="text-[var(--app-muted)]">Inscription :</span>
            <span className={cn(STUDENT_BADGE, statusUi.className)}>{statusUi.label}</span>
          </p>
        </section>
      ) : null}

      {tab === 'grade' ? (
        <section id={`${tabsId}-panel-grade`} role="tabpanel" aria-labelledby={`${tabsId}-grade`}>
          {myGrade ? (
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-6">
              <div className="mb-3 flex flex-wrap gap-2">
                <NotationGradeStatusBadge grade={myGrade} />
                <NotationWorkflowBadge grade={myGrade} />
                <NotationPublicationBadges grade={myGrade} />
              </div>
              <p className="text-sm text-[var(--app-muted)]">Moyenne</p>
              <p className="mt-2 font-heading text-4xl font-bold tabular-nums">{myGrade.average ?? '—'}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {['note1', 'note2', 'note3', 'note4'].map((key) =>
                  myGrade[key] != null ? (
                    <div key={key}>
                      <dt className="text-[10px] font-bold uppercase text-[var(--app-muted)]">{key}</dt>
                      <dd className="font-semibold tabular-nums">{myGrade[key]}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </div>
          ) : (
            <StudentEmptyState title="Pas encore de note" description="Aucune note saisie pour ce cours." />
          )}
        </section>
      ) : null}

      {tab === 'archives' ? (
        <section id={`${tabsId}-panel-archives`} role="tabpanel" aria-labelledby={`${tabsId}-archives`}>
          {archives.length === 0 ? (
            <StudentEmptyState title="Aucun support" description="Aucun document publié pour ce cours." />
          ) : (
            <ul className="space-y-3">
              {archives.map((file) => (
                <li
                  key={file.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{file.title ?? file.original_name ?? 'Document'}</p>
                    <p className="text-xs text-[var(--app-muted)]">{file.status === 'published' ? 'Publié' : file.status}</p>
                  </div>
                  {file.file_url || file.url ? (
                    <a
                      href={file.file_url || file.url}
                      download
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                      <Download size={16} aria-hidden />
                      Télécharger
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}
