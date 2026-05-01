import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Download, Trash2, Upload, X } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '@/features/auth/model/AuthContext'
import {
  deleteCourseArchive,
  fetchCourse,
  fetchCourseArchives,
  fetchCourseEnrollments,
  fetchCourseNotationRoster,
  fetchSemesters,
  fetchTeachingUnits,
  patchCourseArchive,
  postCourseArchive,
} from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { CourseNotationSection } from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/CourseNotationSection'
import { CourseEditForm } from '@/features/teacherFacultyDashboard/pedagogy/ui/CourseEditForm'
import { CourseEnrollmentRequestsSection } from '@/features/teacherFacultyDashboard/pedagogy/ui/CourseEnrollmentRequestsSection'
import { CourseEnrollmentsSection } from '@/features/teacherFacultyDashboard/pedagogy/ui/CourseEnrollmentsSection'
import { CourseArchiveFileIcon } from '@/features/teacherFacultyDashboard/pedagogy/ui/CourseArchiveFileIcon'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'

const TABS = [
  {
    id: 'info',
    label: 'Informations',
    description: 'Référentiel, synthèse et modification du cours (code, crédits, rattachements).',
  },
  {
    id: 'enrollments',
    label: 'Inscrits',
    description: 'Effectif validé : étudiants dont l’inscription au cours est approuvée.',
  },
  {
    id: 'enrollment_requests',
    label: 'Demandes d’inscriptions',
    description: 'Accepter ou refuser les demandes d’inscription encore en attente pour ce cours.',
  },
  {
    id: 'grades',
    label: 'Notation',
    description: 'Notation des étudiants inscrits à ce cours (inscription approuvée).',
  },
  {
    id: 'archives',
    label: 'Archives',
    description: 'Dépôt de médias et documents (brouillon puis publication pour les étudiants).',
  },
  {
    id: 'other',
    label: 'Autres',
    description: 'Emplacement pour extensions (imports locaux, pièces jointes, etc.).',
  },
]

function isSimpleTeacherProfile(user) {
  if (!user || user.role !== 'teacher') return false
  const codes = Array.isArray(user.teacher_role_codes) ? user.teacher_role_codes : []
  const elevated = ['department_head', 'study_director', 'program_director', 'general_director']
  return !codes.some((c) => elevated.includes(c))
}

function formatBytes(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—'
  const v = Number(n)
  if (v < 1024) return `${v} o`
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} Ko`
  return `${(v / (1024 * 1024)).toFixed(1)} Mo`
}

const ARCHIVE_STATUS_LABELS = {
  draft: 'Brouillon',
  published: 'Publié',
}

/** Libellé court au-dessus de l’interrupteur : action prochaine au clic (« Dépublier » / « Publier »). */
function archiveSwitchCaption(status) {
  const s = String(status ?? '').trim().toLowerCase()
  if (s === 'published') return 'Dépublier'
  if (s === 'draft') return 'Publier'
  return '—'
}

export function TeacherCourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canStructure = Boolean(user?.capabilities?.can_manage_academic_structure)
  const isSimpleTeacher = isSimpleTeacherProfile(user)
  const visibleTabs = useMemo(() => (isSimpleTeacher ? [TABS[0]] : TABS), [isSimpleTeacher])

  const [tab, setTab] = useState('info')
  const [loadKey, setLoadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [course, setCourse] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [notationRoster, setNotationRoster] = useState([])
  const [courseArchives, setCourseArchives] = useState([])
  const [semesters, setSemesters] = useState([])
  const [teachingUnits, setTeachingUnits] = useState([])
  const [uploadingArchive, setUploadingArchive] = useState(false)
  const [archiveUploadModalOpen, setArchiveUploadModalOpen] = useState(false)
  const [archiveDeleteId, setArchiveDeleteId] = useState(null)
  const [archiveStatusSavingId, setArchiveStatusSavingId] = useState(null)
  const archiveUploadFormRef = useRef(null)
  const archiveUploadModalTitleId = useId()

  const reload = useCallback(() => setLoadKey((k) => k + 1), [])

  const handleNotationGradeSaved = useCallback((studentId, grade) => {
    setNotationRoster((prev) => prev.map((r) => (r.student_id === studentId ? { ...r, grade } : r)))
  }, [])

  const reloadNotationRoster = useCallback(async () => {
    if (!courseId) return
    const roster = await fetchCourseNotationRoster(courseId)
    setNotationRoster(Array.isArray(roster) ? roster : [])
  }, [courseId])

  const closeArchiveUploadModal = useCallback(() => {
    if (!uploadingArchive) setArchiveUploadModalOpen(false)
  }, [uploadingArchive])

  useEffect(() => {
    if (archiveUploadModalOpen) return
    archiveUploadFormRef.current?.reset()
  }, [archiveUploadModalOpen])

  useEffect(() => {
    if (!archiveUploadModalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !uploadingArchive) setArchiveUploadModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [archiveUploadModalOpen, uploadingArchive])

  const handleArchiveSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      const form = e.currentTarget
      const fd = new FormData(form)
      const file = fd.get('file')
      if (!file || typeof file === 'string' || !file.size) {
        dispatchToast({ type: 'error', message: 'Choisissez un fichier.' })
        return
      }
      setUploadingArchive(true)
      try {
        await postCourseArchive(courseId, fd)
        dispatchToast({ type: 'success', message: 'Archive enregistrée.' })
        form.reset()
        setArchiveUploadModalOpen(false)
        reload()
      } finally {
        setUploadingArchive(false)
      }
    },
    [courseId, reload],
  )

  const handleConfirmDeleteArchive = useCallback(async () => {
    if (archiveDeleteId == null) return
    await deleteCourseArchive(courseId, archiveDeleteId)
    dispatchToast({ type: 'success', message: 'Archive supprimée.' })
    reload()
  }, [archiveDeleteId, courseId, reload])

  const handleArchiveStatusChange = useCallback(
    async (archiveId, nextStatus) => {
      setArchiveStatusSavingId(archiveId)
      try {
        await patchCourseArchive(courseId, archiveId, { status: nextStatus })
        dispatchToast({
          type: 'success',
          message: nextStatus === 'published' ? 'Archive publiée (visible côté étudiants).' : 'Archive repassée en brouillon.',
        })
        reload()
      } finally {
        setArchiveStatusSavingId(null)
      }
    },
    [courseId, reload],
  )

  useEffect(() => {
    if (!courseId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const cRow = await fetchCourse(courseId)
        if (cancelled) return
        setCourse(cRow)
        const ayId = cRow.academic_year_id
        const [sem, tu, en, roster, ca] = await Promise.all([
          ayId ? fetchSemesters(ayId) : Promise.resolve([]),
          fetchTeachingUnits(),
          fetchCourseEnrollments(courseId),
          fetchCourseNotationRoster(courseId),
          fetchCourseArchives(courseId),
        ])
        if (cancelled) return
        setSemesters(Array.isArray(sem) ? sem : [])
        setTeachingUnits(Array.isArray(tu) ? tu : [])
        setEnrollments(Array.isArray(en) ? en : [])
        setNotationRoster(Array.isArray(roster) ? roster : [])
        setCourseArchives(Array.isArray(ca) ? ca : [])
      } catch (e) {
        if (!cancelled) {
          setError(e?.message ?? 'Cours introuvable ou accès refusé.')
          setCourse(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [courseId, loadKey])

  const pageTitle = useMemo(() => {
    if (!course) return 'Cours'
    return `${course.code} — ${course.name}`
  }, [course])

  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) setTab(visibleTabs[0]?.id ?? 'info')
  }, [visibleTabs, tab])

  const tabMeta = visibleTabs.find((t) => t.id === tab) ?? visibleTabs[0] ?? TABS[0]

  const pendingEnrollmentCount = useMemo(
    () => enrollments.filter((e) => e.status === 'pending').length,
    [enrollments],
  )

  const onTabKeyDown = useCallback((e, id) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const idx = visibleTabs.findIndex((t) => t.id === id)
    const next =
      e.key === 'ArrowRight'
        ? visibleTabs[Math.min(visibleTabs.length - 1, idx + 1)]
        : visibleTabs[Math.max(0, idx - 1)]
    if (next) setTab(next.id)
  }, [visibleTabs])

  if (!courseId) {
    return <Navigate to="/teacher/dashboard" replace />
  }

  if (loading && !course && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" label="Chargement" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
        <p className="text-sm text-red-700 dark:text-red-300">{error ?? 'Cours introuvable.'}</p>
        <Button type="button" variant="ghost" as={Link} to="/teacher/dashboard">
          Retour au tableau de bord
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 text-zinc-600 dark:text-zinc-400"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} className="shrink-0" aria-hidden />
            Retour
          </Button>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{pageTitle}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {course.semester_label ?? '—'} · {course.department_code ?? '—'} · UE {course.teaching_unit_code ?? '—'} ·{' '}
            {course.credits} cr.
            {course.teacher_name ? (
              <>
                {' '}
                · enseignant : <span className="font-medium text-zinc-700 dark:text-zinc-300">{course.teacher_name}</span>
                {course.teacher_matricule ? (
                  <span className="font-mono text-xs text-zinc-500"> ({course.teacher_matricule})</span>
                ) : null}
              </>
            ) : (
              ' · sans enseignant assigné'
            )}
          </p>
          <p className="text-xs font-mono text-zinc-400 break-all">ID : {course.id}</p>
        </div>
      </div>

      {/* ── Onglets (même bandeau que le dashboard faculté) ── */}
      <div className="space-y-3">
        <div
          className="overflow-hidden rounded-xl bg-brand-600 shadow-sm ring-1 ring-brand-700/30 dark:bg-brand-600 dark:ring-white/10"
          role="tablist"
          aria-label="Sections du cours"
        >
          <div className="-mb-px flex flex-wrap divide-x divide-secondary-400/50 px-1 sm:px-2">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tcd-tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`tcd-panel-${t.id}`}
                className={cn(
                  'border-b-2 px-4 py-3 text-sm font-semibold tracking-tight transition-colors duration-200 outline-none',
                  'rounded-t-md focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600',
                  tab === t.id
                    ? 'border-secondary-400 text-secondary-50 shadow-[inset_0_-8px_12px_-10px_rgba(249,115,22,0.35)] dark:border-secondary-300 dark:text-secondary-50'
                    : 'border-transparent text-secondary-200/95 hover:border-secondary-400/55 hover:text-secondary-50 dark:text-secondary-200/90',
                )}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKeyDown(e, t.id)}
              >
                <span className="inline-flex items-center gap-1">
                  {t.label}
                  {t.id === 'enrollment_requests' && pendingEnrollmentCount > 0 ? (
                    <span className="inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-secondary-500 px-1.5 text-[10px] font-bold text-white tabular-nums shadow-sm">
                      {pendingEnrollmentCount > 99 ? '99+' : pendingEnrollmentCount}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </div>
        <p className="px-0.5 text-xs leading-relaxed text-[var(--app-muted)] sm:px-1">{tabMeta.description}</p>
      </div>

      <div
        role="tabpanel"
        id={`tcd-panel-${tab}`}
        aria-labelledby={`tcd-tab-${tab}`}
        className="min-w-0 max-w-full"
      >
      {tab === 'info' ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Card className="p-6 border border-zinc-200/90 dark:border-[var(--app-border)] shadow-sm">
            <h2 className="font-heading text-sm font-semibold text-zinc-900 dark:text-zinc-50">Référentiel</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Modifiez code, intitulé, crédits, rattachements (département, semestre, niveau, UE).
            </p>
            <div className="mt-4">
              <CourseEditForm
                courseId={courseId}
                active
                canStructure={canStructure}
                semesters={semesters}
                teachingUnits={teachingUnits}
                onSaved={reload}
                submitLabel="Enregistrer les modifications"
              />
            </div>
          </Card>
          <Card className="h-fit space-y-3 p-5 border border-zinc-200/90 dark:border-[var(--app-border)] text-sm">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Synthèse</h3>
            <dl className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div>
                <dt className="font-medium text-zinc-500">Année</dt>
                <dd>{course.academic_year ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">UE</dt>
                <dd>
                  {course.teaching_unit_code} — {course.teaching_unit_name}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Niveau</dt>
                <dd>{course.level_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Création</dt>
                <dd>{course.created_at ? new Date(course.created_at).toLocaleString('fr-FR') : '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-500">Dernière mise à jour</dt>
                <dd>{course.updated_at ? new Date(course.updated_at).toLocaleString('fr-FR') : '—'}</dd>
              </div>
            </dl>
          </Card>
        </div>
      ) : null}

      {tab === 'enrollments' ? <CourseEnrollmentsSection enrollments={enrollments} /> : null}

      {tab === 'enrollment_requests' ? (
        <CourseEnrollmentRequestsSection courseId={courseId} enrollments={enrollments} onUpdated={reload} />
      ) : null}

      {tab === 'grades' ? (
        <CourseNotationSection
          courseId={courseId}
          courseCode={course?.code}
          roster={notationRoster}
          onGradeSaved={handleNotationGradeSaved}
          canPublishGrades={Boolean(user?.capabilities?.can_publish_grades)}
          canEditGrades={Boolean(user?.capabilities?.can_edit_grades)}
          onRosterReload={reloadNotationRoster}
        />
      ) : null}

      {tab === 'archives' ? (
        <div className="space-y-6">
          <Card className="overflow-hidden border border-zinc-200/90 dark:border-[var(--app-border)] shadow-sm">
            <div className="flex flex-col gap-3 border-b border-zinc-100 bg-zinc-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Archives académiques</h2>
                <p className="text-xs text-zinc-500">{courseArchives.length} fichier(s) déposé(s)</p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="shrink-0 self-start sm:self-auto"
                onClick={() => setArchiveUploadModalOpen(true)}
              >
                <Upload size={16} className="shrink-0" aria-hidden />
                Ajouter une archive
              </Button>
            </div>
            <div className="p-3 sm:p-5">
              {courseArchives.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500 sm:px-4 dark:border-[var(--app-border)] dark:text-zinc-400">
                  Aucune archive pour l’instant. Utilisez le bouton «&nbsp;Ajouter une archive&nbsp;» ci-dessus.
                </div>
              ) : (
                <ul
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  role="list"
                >
                  {courseArchives.map((a) => {
                    const canRemove =
                      canStructure || (user?.matricule && a.uploaded_by_matricule === user.matricule)
                    const archiveStatusKey = String(a.status ?? '').trim().toLowerCase()
                    const isPublished = archiveStatusKey === 'published'
                    const statusBusy = archiveStatusSavingId === a.id
                    return (
                      <li key={a.id} className="min-w-0 list-none">
                        <article
                          className={cn(
                            'group relative flex h-full min-h-[12rem] flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/80 p-3 shadow-sm',
                            'transition-[transform,box-shadow,border-color,ring-color] duration-200 ease-out',
                            'hover:-translate-y-0.5 hover:border-secondary-400/50 hover:shadow-md',
                            'hover:ring-2 hover:ring-secondary-400/70 hover:ring-offset-2 hover:ring-offset-[var(--app-canvas)]',
                            'dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)]',
                            'dark:hover:border-secondary-500/45 dark:hover:shadow-lg dark:hover:shadow-black/20 dark:hover:ring-secondary-500/55',
                          )}
                        >
                          <div
                            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/25 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                            aria-hidden
                          />
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            <CourseArchiveFileIcon
                              archive={a}
                              className="h-10 w-10 sm:h-11 sm:w-11"
                              size={18}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                                <p className="min-w-0 font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                                  {a.title || a.original_name}
                                </p>
                                <Badge tone={isPublished ? 'success' : 'warning'} className="w-fit shrink-0">
                                  {ARCHIVE_STATUS_LABELS[archiveStatusKey] ?? a.status}
                                </Badge>
                              </div>
                              <p className="mt-1 break-words text-xs text-zinc-500">{a.original_name}</p>
                            </div>
                          </div>

                          {a.notes ? (
                            <p className="mt-2.5 text-xs leading-relaxed text-zinc-600 line-clamp-3 dark:text-zinc-400 sm:mt-3">
                              {a.notes}
                            </p>
                          ) : null}

                          <dl className="mt-3 flex flex-1 flex-col gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-4">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                              <dt className="shrink-0 font-medium text-zinc-500 dark:text-zinc-500">Taille</dt>
                              <dd className="min-w-0 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                                {formatBytes(a.size_bytes)}
                              </dd>
                            </div>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                              <dt className="shrink-0 font-medium text-zinc-500 dark:text-zinc-500">Déposé par</dt>
                              <dd className="min-w-0 text-right">
                                <span className="font-mono">{a.uploaded_by_matricule}</span>
                                {a.uploaded_by_name ? <span className="ml-1">{a.uploaded_by_name}</span> : null}
                              </dd>
                            </div>
                            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                              <dt className="shrink-0 font-medium text-zinc-500 dark:text-zinc-500">Ajouté le</dt>
                              <dd className="min-w-0 text-right text-[11px] sm:text-xs">
                                {a.created_at ? new Date(a.created_at).toLocaleString('fr-FR') : '—'}
                              </dd>
                            </div>
                            {a.published_at ? (
                              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                                <dt className="shrink-0 font-medium text-zinc-500 dark:text-zinc-500">Publié le</dt>
                                <dd className="min-w-0 text-right text-[11px] sm:text-xs">
                                  {new Date(a.published_at).toLocaleString('fr-FR')}
                                </dd>
                              </div>
                            ) : null}
                          </dl>

                          <div className="mt-auto flex flex-nowrap items-end justify-end gap-2 border-t border-zinc-100 pt-3 sm:mt-4 sm:gap-3 dark:border-[var(--app-border)]">
                            {a.file_url ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0 px-2.5 text-brand-600 dark:text-brand-400"
                                as="a"
                                href={a.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Download size={14} className="shrink-0" aria-hidden />
                                Ouvrir
                              </Button>
                            ) : null}
                            {canRemove ? (
                              <div className="flex min-w-0 flex-col items-center gap-1">
                                <p className="text-center text-[10px] font-medium leading-tight text-zinc-600 dark:text-zinc-400">
                                  {archiveSwitchCaption(a.status)}
                                </p>
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={isPublished}
                                  aria-busy={statusBusy}
                                  aria-label={
                                    isPublished
                                      ? 'Archive visible par les étudiants — désactiver pour repasser en brouillon'
                                      : 'Archive en brouillon — activer pour la publier aux étudiants'
                                  }
                                  disabled={statusBusy}
                                  onClick={() =>
                                    handleArchiveStatusChange(a.id, isPublished ? 'draft' : 'published')
                                  }
                                  className={cn(
                                    'relative inline-block h-7 w-11 shrink-0 overflow-hidden rounded-full p-0.5 transition-colors duration-200',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-canvas)]',
                                    isPublished
                                      ? 'bg-secondary-500 shadow-inner dark:bg-secondary-600'
                                      : 'bg-zinc-200 shadow-inner dark:bg-zinc-600',
                                    statusBusy && 'cursor-wait opacity-60',
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'pointer-events-none absolute left-0.5 top-1 block size-5 rounded-full bg-white shadow ring-1 ring-black/10 transition-transform duration-200 ease-out will-change-transform dark:ring-white/15',
                                      isPublished ? 'translate-x-4' : 'translate-x-0',
                                      statusBusy && 'animate-pulse',
                                    )}
                                    aria-hidden
                                  />
                                </button>
                              </div>
                            ) : null}
                            {canRemove ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 shrink-0 p-0 text-red-600 dark:text-red-400"
                                aria-label="Supprimer l’archive"
                                title="Supprimer l’archive"
                                onClick={() => setArchiveDeleteId(a.id)}
                              >
                                <Trash2 size={16} strokeWidth={2} className="shrink-0" aria-hidden />
                              </Button>
                            ) : null}
                          </div>
                        </article>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </Card>

          {archiveUploadModalOpen ? (
            <div
              className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/55 dark:bg-black/75 backdrop-blur-[3px]"
              role="presentation"
              onClick={closeArchiveUploadModal}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={archiveUploadModalTitleId}
                className={cn(
                  'flex max-h-[min(90vh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 dark:ring-white/10',
                  'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
                  'animate-in fade-in zoom-in-95 duration-200',
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-3 border-b border-[var(--app-border)] px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 dark:text-brand-300">
                    <Upload size={20} strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2 id={archiveUploadModalTitleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                      Ajouter une archive
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      Vidéos, audio, images, PDF, bureautique (Office, OpenDocument), archives ZIP, etc. Taille max.{' '}
                      150&nbsp;Mo. Refusés&nbsp;: scripts et exécutables (.py, .js, .exe, .sh, .bat…). Les nouveaux
                      fichiers sont en <strong className="font-semibold text-zinc-600 dark:text-zinc-300">brouillon</strong>{' '}
                      : publiez-les ensuite pour les rendre visibles aux étudiants.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200"
                    aria-label="Fermer"
                    disabled={uploadingArchive}
                    onClick={closeArchiveUploadModal}
                  >
                    <X size={20} strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <form
                  ref={archiveUploadFormRef}
                  className="flex min-h-0 flex-1 flex-col"
                  onSubmit={handleArchiveSubmit}
                >
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Titre (optionnel)</span>
                        <input
                          name="title"
                          type="text"
                          maxLength={200}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-brand-500/30 focus:border-brand-500 focus:ring-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_94%,black)] dark:text-zinc-100"
                          placeholder="ex. Enregistrement CM3"
                        />
                      </label>
                      <label className="block space-y-1.5 sm:col-span-2">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Commentaire (optionnel)</span>
                        <textarea
                          name="notes"
                          rows={2}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-brand-500/30 focus:border-brand-500 focus:ring-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_94%,black)] dark:text-zinc-100"
                          placeholder="Précisions pour les collègues ou la direction…"
                        />
                      </label>
                    </div>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Fichier</span>
                      <input
                        name="file"
                        type="file"
                        required
                        className="block w-full cursor-pointer text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700 dark:text-zinc-400"
                        accept="audio/*,video/*,image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.ods,.odp,.rtf,.txt,.zip,.7z"
                      />
                    </label>
                  </div>
                  <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)] px-5 py-3 dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
                    <Button type="button" variant="ghost" disabled={uploadingArchive} onClick={closeArchiveUploadModal}>
                      Annuler
                    </Button>
                    <Button type="submit" variant="primary" disabled={uploadingArchive}>
                      {uploadingArchive ? 'Envoi…' : 'Enregistrer l’archive'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          <ConfirmModal
            open={archiveDeleteId != null}
            onClose={() => setArchiveDeleteId(null)}
            title="Supprimer cette archive ?"
            message="Le fichier sera retiré du serveur. Cette action est définitive."
            confirmLabel="Supprimer"
            onConfirm={handleConfirmDeleteArchive}
          />
        </div>
      ) : null}

      {tab === 'other' ? (
        <Card className="space-y-3 p-6 border border-zinc-200/90 dark:border-[var(--app-border)] shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Autres volets</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            D’autres briques pourront être branchées ici : pièces jointes de cours, imports de notes CSV, messages
            liés au cours, ou suivi d’assiduité — selon les évolutions du produit.
          </p>
          <p className="text-xs text-zinc-500">
            Les imports globaux restent accessibles depuis les menus enseignant / référentiels lorsqu’ils sont
            disponibles.
          </p>
        </Card>
      ) : null}
      </div>
    </div>
  )
}
