import { useCallback, useEffect, useMemo, useState } from 'react'
import { Sparkles, X } from 'lucide-react'

import { useScopeOptions } from '@/features/access/model/useScopeOptions'
import { defaultScope } from '@/features/access/model/scopeFilter'
import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import {
  fetchCourseAssignmentCandidates,
  fetchCourseAssignmentModules,
  fetchCourseAssignmentTeacherPreview,
  fetchCourseAssignmentTeachers,
  postCourseAssignment,
} from '@/features/teacher/faculty/api/courseAssignmentsApi'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, Input } from '@/shared/ui/Field'
import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

const selectClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)] transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500/40'

function SectionTitle({ step, label, done, titleId }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span
        className={cn(
          'flex h-7 min-w-[1.75rem] items-center justify-center rounded-full text-[11px] font-bold tabular-nums',
          done
            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
            : 'bg-zinc-200/90 text-zinc-600 dark:bg-white/10 dark:text-zinc-400',
        )}
        aria-hidden
      >
        {step}
      </span>
      <h3 id={titleId} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
        {label}
      </h3>
    </div>
  )
}

function scopeQuery({ departmentId, programId }) {
  if (programId) return { program_id: programId }
  if (departmentId) return { department_id: departmentId }
  return null
}

const EMPTY_SCOPE = { departmentId: '', programId: '' }

export function CourseAssignModal({ open, onClose, onSuccess, academicYearId, initialScope = EMPTY_SCOPE }) {
  const scopeOptions = useScopeOptions('courses.assign', { enabled: open })
  /** Périmètre réduit à une entité (chef de département à programme unique, directeur de programme) : pas de choix. */
  const lockedScope = useMemo(() => defaultScope(scopeOptions), [scopeOptions])
  const locked = Boolean(lockedScope.programId || (lockedScope.departmentId && scopeOptions.departments.length === 1))
  const startScope = initialScope.departmentId || initialScope.programId ? initialScope : lockedScope

  const [scope, setScope] = useState(EMPTY_SCOPE)
  const query = scopeQuery(scope)
  const [moduleId, setModuleId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teacherQuery, setTeacherQuery] = useState('')

  const [modules, setModules] = useState([])
  const [candidates, setCandidates] = useState([])
  const [teachers, setTeachers] = useState([])
  const [preview, setPreview] = useState(null)

  const [loadingModules, setLoadingModules] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const showDepartmentPicker = !locked
  const deptChosen = Boolean(query)
  const moduleChosen = Boolean(moduleId)
  const courseChosen = Boolean(courseId)
  const teacherChosen = Boolean(teacherId)

  const reset = useCallback(() => {
    setScope(startScope)
    setModuleId('')
    setCourseId('')
    setTeacherId('')
    setTeacherQuery('')
    setModules([])
    setCandidates([])
    setTeachers([])
    setPreview(null)
    setError(null)
    setLoadingModules(false)
    setLoadingCourses(false)
    setLoadingTeachers(false)
    setSubmitting(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- périmètre de départ figé à l'ouverture
  }, [startScope.departmentId, startScope.programId])

  /** Réinitialise le formulaire sans fermer la modale. */
  const clearForm = useCallback(() => {
    setScope(locked ? lockedScope : EMPTY_SCOPE)
    setModuleId('')
    setCourseId('')
    setTeacherId('')
    setTeacherQuery('')
    setModules([])
    setCandidates([])
    setTeachers([])
    setPreview(null)
    setError(null)
    setLoadingModules(false)
    setLoadingCourses(false)
    setLoadingTeachers(false)
  }, [locked, lockedScope])

  const hasFormProgress = Boolean(
    moduleId || courseId || teacherId || teacherQuery.trim() || (showDepartmentPicker && query),
  )

  useEffect(() => {
    if (!open) return
    reset()
  }, [open, reset])

  const loadModules = useCallback(async () => {
    if (!academicYearId || !query) return
    setLoadingModules(true)
    setError(null)
    try {
      const rows = await fetchCourseAssignmentModules({ academic_year_id: academicYearId, ...query })
      setModules(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setError(e?.message ?? 'Modules indisponibles.')
      setModules([])
    } finally {
      setLoadingModules(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ``query`` dérive de ``scope``
  }, [academicYearId, scope])

  useEffect(() => {
    if (!open || !deptChosen) return
    loadModules()
  }, [open, deptChosen, loadModules])

  const loadCandidates = useCallback(async () => {
    if (!academicYearId || !query || !moduleId) return
    setLoadingCourses(true)
    setError(null)
    try {
      const rows = await fetchCourseAssignmentCandidates({
        academic_year_id: academicYearId,
        ...query,
        module_id: moduleId,
      })
      setCandidates(Array.isArray(rows) ? rows : [])
    } catch (e) {
      setError(e?.message ?? 'Cours indisponibles.')
      setCandidates([])
    } finally {
      setLoadingCourses(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ``query`` dérive de ``scope``
  }, [academicYearId, scope, moduleId])

  useEffect(() => {
    if (!open || !moduleChosen) return
    loadCandidates()
  }, [open, moduleChosen, loadCandidates])

  const loadTeachers = useCallback(async () => {
    if (!courseId) return
    setLoadingTeachers(true)
    setError(null)
    try {
      const params = teacherQuery.trim() ? { q: teacherQuery.trim() } : {}
      const rows = await fetchCourseAssignmentTeachers(params)
      setTeachers(rows)
    } catch (e) {
      setError(e?.message ?? 'Enseignants indisponibles.')
      setTeachers([])
    } finally {
      setLoadingTeachers(false)
    }
  }, [teacherQuery, courseId])

  useEffect(() => {
    if (!open || !courseChosen) return
    const t = window.setTimeout(() => loadTeachers(), 300)
    return () => window.clearTimeout(t)
  }, [open, courseChosen, teacherQuery, loadTeachers])

  useEffect(() => {
    if (!open || !teacherId) {
      setPreview(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const p = await fetchCourseAssignmentTeacherPreview(Number(teacherId))
        if (!cancelled) setPreview(p)
      } catch {
        if (!cancelled) setPreview(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, teacherId])

  const submit = async () => {
    if (!courseId || !teacherId || !preview) return
    setSubmitting(true)
    setError(null)
    try {
      await postCourseAssignment({ course: courseId, teacher: Number(teacherId) })
      onSuccess?.()
      onClose()
      reset()
    } catch (e) {
      setError(e?.message ?? 'Affectation impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  const canConfirm = Boolean(courseId && teacherId && preview && !submitting)

  const selectedCourse = useMemo(() => candidates.find((c) => String(c.id) === String(courseId)), [candidates, courseId])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/65 dark:bg-black/75 backdrop-blur-sm"
      role="presentation"
      onClick={() => !submitting && onClose()}
    >
      <Card
        className="relative w-full max-w-2xl max-h-[min(92vh,44rem)] overflow-hidden flex flex-col border border-zinc-200/90 shadow-2xl dark:border-[var(--app-border)] dark:shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-zinc-100 dark:border-[var(--app-border)] bg-gradient-to-r from-brand-50/90 to-white dark:from-[color-mix(in_srgb,var(--app-elevated)_88%,black)] dark:to-[var(--app-elevated)] px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:bg-brand-400/20 dark:text-brand-300">
                <Sparkles size={22} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  Nouvelle affectation
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Choisissez le programme, le module, la matière puis l’enseignant — tout sur ce formulaire.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-500 hover:bg-white/80 dark:hover:bg-[var(--app-nav-hover)] transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </p>
          ) : null}

          {locked ? (
            <p className="mb-6 rounded-lg border border-secondary-200/80 bg-secondary-50/90 px-3 py-2 text-xs text-secondary-950 dark:border-secondary-800/50 dark:bg-secondary-950/25 dark:text-secondary-100">
              Périmètre :{' '}
              <span className="font-semibold">
                {lockedScope.programId
                  ? scopeOptions.programById.get(Number(lockedScope.programId))?.name ?? '—'
                  : scopeOptions.departments[0]?.name ?? '—'}
              </span>
            </p>
          ) : null}

          <div className="space-y-8">
            {showDepartmentPicker ? (
              <section aria-labelledby="assign-dept-title">
                <SectionTitle step={1} label="Programme" done={deptChosen} titleId="assign-dept-title" />
                <Field label="Programme ou département" htmlFor="assign-dept-select">
                  <ScopeSelect
                    id="assign-dept-select"
                    className={selectClass}
                    options={scopeOptions}
                    departmentId={scope.departmentId}
                    programId={scope.programId}
                    allLabel="Sélectionner…"
                    onChange={(next) => {
                      setScope(next)
                      setModuleId('')
                      setCourseId('')
                      setTeacherId('')
                      setPreview(null)
                    }}
                  />
                </Field>
              </section>
            ) : null}

            {deptChosen ? (
              <section className="border-t border-zinc-100 pt-6 dark:border-[var(--app-border)]" aria-labelledby="assign-mod-title">
                <SectionTitle
                  step={showDepartmentPicker ? 2 : 1}
                  label="Module"
                  done={moduleChosen}
                  titleId="assign-mod-title"
                />
                {loadingModules ? (
                  <div className="flex justify-center py-10">
                    <Spinner label="Chargement des modules" />
                  </div>
                ) : (
                  <Field label="Module" htmlFor="assign-mod-select">
                    <select
                      id="assign-mod-select"
                      className={selectClass}
                      value={moduleId}
                      onChange={(e) => {
                        setModuleId(e.target.value)
                        setCourseId('')
                        setTeacherId('')
                        setPreview(null)
                      }}
                    >
                      <option value="">Sélectionner…</option>
                      {modules.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {modules.length === 0 ? (
                      <p className="text-xs text-zinc-500 mt-2">Aucun module avec cours pour ce département.</p>
                    ) : null}
                  </Field>
                )}
              </section>
            ) : null}

            {deptChosen && moduleChosen ? (
              <section className="border-t border-zinc-100 pt-6 dark:border-[var(--app-border)]" aria-labelledby="assign-course-title">
                <SectionTitle step={showDepartmentPicker ? 3 : 2} label="Matière" done={courseChosen} titleId="assign-course-title" />
                {loadingCourses ? (
                  <div className="flex justify-center py-10">
                    <Spinner label="Chargement des cours" />
                  </div>
                ) : (
                  <Field label="Matière (sans enseignant)" htmlFor="assign-course-select">
                    <select
                      id="assign-course-select"
                      className={selectClass}
                      value={courseId}
                      onChange={(e) => {
                        setCourseId(e.target.value)
                        setTeacherId('')
                        setPreview(null)
                      }}
                    >
                      <option value="">Sélectionner…</option>
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                    {candidates.length === 0 ? (
                      <p className="text-xs text-zinc-500 mt-2">Aucun cours libre pour ce module.</p>
                    ) : null}
                  </Field>
                )}
              </section>
            ) : null}

            {deptChosen && moduleChosen && courseChosen ? (
              <section className="border-t border-zinc-100 pt-6 dark:border-[var(--app-border)]" aria-labelledby="assign-teacher-title">
                <SectionTitle step={showDepartmentPicker ? 4 : 3} label="Enseignant" done={teacherChosen} titleId="assign-teacher-title" />
                <div className="space-y-4">
                  <Field label="Rechercher un enseignant" htmlFor="assign-teacher-search">
                    <Input
                      id="assign-teacher-search"
                      value={teacherQuery}
                      onChange={(e) => setTeacherQuery(e.target.value)}
                      placeholder="Nom, matricule, email…"
                    />
                  </Field>
                  <Field label="Enseignant" htmlFor="assign-teacher-select">
                    {loadingTeachers ? (
                      <div className="flex justify-center py-8">
                        <Spinner size="sm" label="Chargement des enseignants" />
                      </div>
                    ) : (
                      <select
                        id="assign-teacher-select"
                        className={selectClass}
                        value={teacherId}
                        onChange={(e) => {
                          setTeacherId(e.target.value)
                          setPreview(null)
                        }}
                      >
                        <option value="">Sélectionner…</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name} ({t.matricule})
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                </div>
              </section>
            ) : null}

            {deptChosen && moduleChosen && courseChosen && teacherChosen ? (
              <section className="border-t border-zinc-100 pt-6 dark:border-[var(--app-border)]" aria-labelledby="assign-review-title">
                <SectionTitle
                  step={showDepartmentPicker ? 5 : 4}
                  label="Validation"
                  done={Boolean(preview)}
                  titleId="assign-review-title"
                />
                <div className="space-y-4 transition-opacity duration-200">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Cours</p>
                    <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedCourse?.code} — {selectedCourse?.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{selectedCourse?.module_label}</p>
                  </div>
                  {preview ? (
                    <div className="rounded-xl border border-secondary-200/80 bg-secondary-50/50 p-4 dark:border-secondary-800/50 dark:bg-secondary-950/20">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">Enseignant</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">{preview.full_name}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                        <div>
                          <dt className="text-zinc-400">Matricule</dt>
                          <dd className="font-mono">{preview.matricule}</dd>
                        </div>
                        <div>
                          <dt className="text-zinc-400">Email</dt>
                          <dd className="truncate">{preview.email}</dd>
                        </div>
                        <div>
                          <dt className="text-zinc-400">Grade</dt>
                          <dd>{preview.grade_display || preview.grade || '—'}</dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-zinc-400">Statut / compte</dt>
                          <dd>
                            {preview.status}
                            {preview.is_activated ? ' · Compte activé' : ' · Non activé'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <div className="flex justify-center py-8">
                      <Spinner size="sm" label="Préparation du récapitulatif" />
                    </div>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-[var(--app-border)] px-6 py-4 bg-zinc-50/50 dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={clearForm}
              disabled={submitting || !hasFormProgress}
              title={!hasFormProgress ? 'Aucune sélection à effacer' : undefined}
            >
              Tout effacer
            </Button>
          </div>
          <Button type="button" variant="primary" onClick={submit} disabled={!canConfirm}>
            {submitting ? 'Enregistrement…' : 'Confirmer l’affectation'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
