import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BookOpen, Plus } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAuth } from '@/features/auth/model/AuthContext'
import {
  deleteCourseAssignment,
  fetchCourseAssignmentSemesters,
  fetchCourseAssignmentsList,
} from '@/features/teacher/faculty/api/courseAssignmentsApi'
import { CourseAssignModal } from '@/features/teacher/faculty/ui/CourseAssignModal'
import { CourseAssignmentCard } from '@/features/teacher/faculty/ui/CourseAssignmentCard'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Field } from '@/shared/ui/Field'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'

const PAGE_SIZE = 20

const selectClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]'

export function TeacherFacultyCourseAssignmentsPage() {
  const { user } = useAuth()
  const canManageCourses = Boolean(user?.capabilities?.can_manage_courses)
  const { academicYearId, academicYearLabel, refreshAcademicYears } = useAcademicYear()

  const [semesterFilter, setSemesterFilter] = useState('')
  const [semesterOptions, setSemesterOptions] = useState([])
  const [data, setData] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [busyCourseId, setBusyCourseId] = useState(null)
  const [unassignCourseId, setUnassignCourseId] = useState(null)

  useEffect(() => {
    refreshAcademicYears?.()
  }, [refreshAcademicYears])

  useEffect(() => {
    if (!academicYearId) {
      setSemesterOptions([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const params = { academic_year_id: academicYearId }
        const managed = user?.scope?.managed_department_id
        if (managed) params.department_id = managed
        const rows = await fetchCourseAssignmentSemesters(params)
        if (!cancelled) setSemesterOptions(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setSemesterOptions([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [academicYearId, user?.scope?.managed_department_id])

  useEffect(() => {
    setPage(1)
  }, [academicYearId, semesterFilter])

  const params = useMemo(() => {
    const p = { page }
    if (academicYearId) p.academic_year_id = academicYearId
    if (semesterFilter) p.semester_id = semesterFilter
    return p
  }, [page, academicYearId, semesterFilter])

  const load = useCallback(async () => {
    if (!academicYearId || !canManageCourses) return
    setLoading(true)
    setError(null)
    try {
      const body = await fetchCourseAssignmentsList(params)
      setData(body)
    } catch (e) {
      setError(e?.message ?? 'Chargement impossible.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [params, academicYearId, canManageCourses])

  useEffect(() => {
    load()
  }, [load])

  const results = data?.results ?? []
  const count = data?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE) || 1)

  const requestUnassign = (courseId) => setUnassignCourseId(courseId)

  if (!canManageCourses) {
    return <Navigate to="/teacher/faculty/list" replace />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-600 dark:text-secondary-400 mb-1.5">
            Ressources académiques
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-900 dark:text-zinc-50 tracking-tight">
            Affectations cours
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
            Cours déjà assignés pour l’année sélectionnée dans la barre de navigation
            {academicYearLabel ? (
              <>
                {' '}
                (<span className="font-medium text-zinc-700 dark:text-zinc-300">{academicYearLabel}</span>).
              </>
            ) : (
              ' (choisissez une année académique dans la barre du haut).'
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="shrink-0"
          disabled={!academicYearId}
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} aria-hidden />
          Assigner un cours
        </Button>
      </div>

      {!academicYearId ? (
        <Card className="border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/35 dark:text-amber-100">
          Sélectionnez une année académique dans le sélecteur global pour afficher les affectations.
        </Card>
      ) : null}

      {academicYearId ? (
        <div className="max-w-xs">
          <Field label="Filtrer par semestre">
            <select className={selectClass} value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)}>
              <option value="">Tous les semestres</option>
              {semesterOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" label="Chargement" />
        </div>
      ) : error ? (
        <Card className="border-orange-200/80 px-4 py-6 text-sm text-orange-800 dark:border-orange-500/30 dark:text-orange-200">
          {error}
        </Card>
      ) : (
        <div
          className={cn(
            results.length === 0 ? '' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3',
          )}
        >
          {results.length === 0 ? (
            <Card className="px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Aucun cours assigné pour cette période.
            </Card>
          ) : (
            results.map((row) => (
              <CourseAssignmentCard
                key={row.id}
                row={row}
                detailHref={`/teacher/faculty/course-assignments/${row.id}`}
                onRequestUnassign={requestUnassign}
                unassignBusy={busyCourseId === row.id}
              />
            ))
          )}
        </div>
      )}

      {count > PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {page} / {totalPages} ({count} cours)
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Précédent
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : null}

      {user?.capabilities?.can_provision_teacher ? (
        <p className="text-sm text-zinc-500">
          <BookOpen size={14} className="inline mr-1 align-text-bottom opacity-70" aria-hidden />
          <Link to="/teacher/faculty/list" className="text-brand-600 hover:underline dark:text-brand-400">
            Retour au dashboard enseignants
          </Link>
        </p>
      ) : null}

      {modalOpen && academicYearId ? (
        <CourseAssignModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          academicYearId={String(academicYearId)}
          onSuccess={async () => {
            dispatchToast({ type: 'success', message: 'Cours affecté.' })
            await load()
          }}
        />
      ) : null}

      <ConfirmModal
        open={unassignCourseId != null}
        onClose={() => setUnassignCourseId(null)}
        title="Retirer l’enseignant de ce cours ?"
        message="L’enseignant ne sera plus affecté à cette matière pour la période concernée."
        confirmLabel="Retirer"
        onConfirm={async () => {
          const courseId = unassignCourseId
          if (!courseId) return
          setBusyCourseId(courseId)
          try {
            await deleteCourseAssignment(courseId)
            dispatchToast({ type: 'success', message: 'Affectation retirée.' })
            await load()
          } catch (e) {
            dispatchToast({ type: 'error', message: e?.message ?? 'Action impossible.' })
            throw e
          } finally {
            setBusyCourseId(null)
          }
        }}
      />
    </div>
  )
}
