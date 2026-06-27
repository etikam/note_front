import { useEffect, useId } from 'react'

import {
  GRADE_STATUS_LABELS,
  VALIDATION_STATUS_LABELS,
  gradeStatusBadgeClass,
} from '@/features/teacherFacultyDashboard/pedagogy/notation/model/notationLabels'
import { cn } from '@/shared/lib/cn'

const BADGE = 'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border'

function formatNote(value) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Détail d'une moyenne : notes ayant servi au calcul + historique de saisie. */
export function GradeDetailModal({ open, onClose, student, course, grade }) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !grade) return null

  const statusLabel = grade.status ? GRADE_STATUS_LABELS[grade.status] ?? grade.status : 'Non noté'
  const validationLabel = grade.validation_status
    ? VALIDATION_STATUS_LABELS[grade.validation_status] ?? grade.validation_status
    : '—'

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/55 dark:bg-black/75 backdrop-blur-[3px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 dark:ring-white/10',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--app-border)]">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {course?.name}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {student?.first_name} {student?.last_name} • {student?.matricule}
          </p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Moyenne</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{formatNote(grade.average)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(BADGE, gradeStatusBadgeClass(grade.status))}>{statusLabel}</span>
            {grade.published ? (
              <span className={cn(BADGE, 'border-emerald-200/80 bg-emerald-100 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200')}>
                Publiée
              </span>
            ) : (
              <span className={cn(BADGE, 'border-zinc-200/80 bg-zinc-100 text-zinc-600 dark:border-[var(--app-border)] dark:bg-white/5 dark:text-zinc-400')}>
                Non publiée
              </span>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
              Notes
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                ['CC1', grade.note1],
                ['CC2', grade.note2],
                ['Examen', grade.note3],
                ['Rattrapage', grade.note4],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-[var(--app-border)] px-2 py-2 text-center"
                >
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">{formatNote(value)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
              Historique de notation
            </p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Saisie par</dt>
                <dd className="text-right text-zinc-800 dark:text-zinc-100">
                  {grade.noted_by ?? '—'}
                  {grade.created_at ? ` • ${formatDateTime(grade.created_at)}` : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Dernière modification</dt>
                <dd className="text-right text-zinc-800 dark:text-zinc-100">
                  {grade.updated_by ?? '—'}
                  {grade.updated_at ? ` • ${formatDateTime(grade.updated_at)}` : ''}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500 dark:text-zinc-400">Niveau de validation</dt>
                <dd className="text-right text-zinc-800 dark:text-zinc-100">{validationLabel}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
