import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { BookOpen, Plus } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAccess } from '@/features/access/model/useAccess'
import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import {
  deleteCourseAssignment,
  fetchCourseAssignmentModules,
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

const SEMESTER_SELECT_CLASS =
  'w-full min-h-[2.5rem] px-3 py-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] text-sm text-zinc-900 dark:text-zinc-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-shadow ' +
  'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-zinc-50 dark:disabled:bg-brand-950/40'

export function TeacherFacultyCourseAssignmentsPage() {
  const access = useAccess()
  const canManageCourses = access.canManage('courses.assign')
  const { academicYearId, academicYearLabel, refreshAcademicYears } = useAcademicYear()
  const scopeOptions = useScopeOptions('courses.assign', { enabled: canManageCourses })
  const [searchParams] = useSearchParams()
  const [scope, setScope] = useState(() => ({ departmentId: '', programId: searchParams.get('program') ?? '' }))

  const [moduleFilter, setModuleFilter] = useState('')
  const [moduleOptions, setModuleOptions] = useState([])
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
    if (scopeOptions.loading) return
    const locked = defaultScope(scopeOptions)
    if (locked.departmentId || locked.programId) setScope((s) => (s.departmentId || s.programId ? s : locked))
  }, [scopeOptions])

  const scopeParams = useMemo(() => {
    if (scope.programId) return { program_id: scope.programId }
    if (scope.departmentId) return { department_id: scope.departmentId }
    return {}
  }, [scope])

  useEffect(() => {
    if (!academicYearId) {
      setModuleOptions([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchCourseAssignmentModules({ academic_year_id: academicYearId, ...scopeParams })
        if (!cancelled) setModuleOptions(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setModuleOptions([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [academicYearId, scopeParams])

  useEffect(() => {
    setPage(1)
  }, [academicYearId, moduleFilter, scopeParams])

  const params = useMemo(() => {
    const p = { page, ...scopeParams }
    if (academicYearId) p.academic_year_id = academicYearId
    if (moduleFilter) p.module_id = moduleFilter
    return p
  }, [page, academicYearId, moduleFilter, scopeParams])

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
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
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
          <Field label="Programme">
            <ScopeSelect
              className={SEMESTER_SELECT_CLASS}
              options={scopeOptions}
              departmentId={scope.departmentId}
              programId={scope.programId}
              onChange={setScope}
              allLabel="Tous les programmes"
            />
          </Field>
          <Field label="Filtrer par module">
            <select className={SEMESTER_SELECT_CLASS} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="">Tous les modules</option>
              {moduleOptions.map((s) => (
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

      {access.canAny('teachers.view', 'teachers.provision') ? (
        <p className="text-sm text-zinc-500">
          <BookOpen size={14} className="inline mr-1 align-text-bottom opacity-70" aria-hidden />
          <Link to="/teacher/faculty/list" className="text-brand-600 hover:underline dark:text-brand-400">
            Retour à l’annuaire enseignants
          </Link>
        </p>
      ) : null}

      {modalOpen && academicYearId ? (
        <CourseAssignModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          academicYearId={String(academicYearId)}
          initialScope={scope}
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
