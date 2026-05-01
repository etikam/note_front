import { useEffect, useId, useMemo, useState } from 'react'
import { X } from 'lucide-react'

import { fetchCoursesList } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { postStudentsBulkEnroll } from '@/features/teacher/students/api/studentsApi'
import { useToast } from '@/features/notifications/model/ToastContext'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

function formatReport(report) {
  return [
    `Inscrits: ${report?.enrolled_count ?? 0}`,
    `Déjà inscrits: ${report?.already_enrolled_count ?? 0}`,
    `Hors périmètre/invalides: ${report?.invalid_count ?? 0}`,
  ].join(' | ')
}

export function StudentEnrollModal({
  open,
  onClose,
  selectedStudentIds = [],
  selectedCount = 0,
  departmentId,
  departmentCode,
  departmentName,
  academicYearId,
  onSubmitted,
}) {
  const titleId = useId()
  const descId = useId()
  const { toast } = useToast()
  const [courseId, setCourseId] = useState('')
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [report, setReport] = useState(null)

  useEffect(() => {
    if (!open) return
    setCourseId('')
    setReport(null)
  }, [open])

  useEffect(() => {
    if (!open || !departmentId) {
      setCourses([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingCourses(true)
      try {
        const params = { page_size: 200, department_id: departmentId }
        if (academicYearId) params.academic_year_id = academicYearId
        const data = await fetchCoursesList(params, { skipErrorToast: true })
        if (!cancelled) setCourses(data.results ?? [])
      } catch {
        if (!cancelled) setCourses([])
      } finally {
        if (!cancelled) setLoadingCourses(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, departmentId, academicYearId])

  const canSubmit = useMemo(
    () => Boolean(courseId) && selectedCount > 0 && !submitting,
    [courseId, selectedCount, submitting],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative w-full max-w-xl rounded-2xl border shadow-xl',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              Inscription manuelle à un cours
            </h2>
            <p id={descId} className="text-sm text-[var(--app-muted)]">
              {selectedCount} étudiant{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''} -{' '}
              {departmentName || departmentCode || 'Département'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[var(--app-nav-hover)] dark:text-zinc-400 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-[var(--app-muted)]">Département</span>
            <div className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm">
              {departmentName || '—'} {departmentCode ? `(${departmentCode})` : ''}
            </div>
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-[var(--app-muted)]">Cours</span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={loadingCourses || courses.length === 0}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm',
                'bg-white dark:bg-[var(--app-elevated)] border-zinc-200 dark:border-[var(--app-border)]',
                'text-zinc-900 dark:text-zinc-100',
              )}
            >
              <option value="">
                {loadingCourses ? 'Chargement des cours...' : courses.length ? 'Sélectionner un cours' : 'Aucun cours'}
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </label>

          {report ? (
            <div className="rounded-lg border border-emerald-300/50 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200 dark:border-emerald-800/60">
              {formatReport(report)}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 pb-5 pt-1 border-t border-[var(--app-border)] mt-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Fermer
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return
              setSubmitting(true)
              try {
                const res = await postStudentsBulkEnroll({
                  student_ids: selectedStudentIds,
                  course_id: courseId,
                })
                setReport(res)
                toast.success(`Inscription traitée. ${formatReport(res)}`)
                onSubmitted?.(res)
              } catch (e) {
                const detail = e?.response?.data?.detail
                toast.error(detail || "Impossible d'inscrire les étudiants sélectionnés.")
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {submitting ? 'Inscription...' : 'Inscrire'}
          </Button>
        </div>
      </div>
    </div>
  )
}
