import { cn } from '@/shared/lib/cn'

import {
  GRADE_STATUS_LABELS,
  VALIDATION_STATUS_LABELS,
  gradeStatusBadgeClass,
  validationStatusBadgeClass,
} from '@/features/teacherFacultyDashboard/pedagogy/notation/model/notationLabels'

const BADGE = 'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide'

/** Statut pédagogique uniquement (`status`). */
export function NotationGradeStatusBadge({ grade }) {
  if (!grade) {
    return (
      <div className="flex flex-wrap gap-1">
        <span className={cn(BADGE, 'border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-600')}>
          Pas encore de saisie
        </span>
      </div>
    )
  }
  const stLabel = GRADE_STATUS_LABELS[grade.status] ?? grade.status
  return (
    <span className={cn(BADGE, gradeStatusBadgeClass(grade.status))} title="Résultat pédagogique">
      {stLabel}
    </span>
  )
}

/** Visibilité côté étudiant (publiée ou non). À placer dans la colonne Publication. */
export function NotationPublicationBadges({ grade }) {
  if (!grade) return null
  return grade.published ? (
    <span
      className={cn(
        BADGE,
        'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-200',
      )}
      title="Visibilité étudiant"
    >
      Publiée
    </span>
  ) : (
    <span className={cn(BADGE, 'border-zinc-200 text-zinc-500 dark:border-zinc-600')} title="Visibilité étudiant">
      Non publiée
    </span>
  )
}

/** Niveau hiérarchique du circuit de validation (`validation_status`). */
export function NotationWorkflowBadge({ grade }) {
  if (!grade) {
    return <span className="text-xs text-zinc-400">—</span>
  }
  const valLabel = VALIDATION_STATUS_LABELS[grade.validation_status] ?? grade.validation_status
  return (
    <span className={cn(BADGE, validationStatusBadgeClass())} title="Circuit de validation">
      {valLabel}
    </span>
  )
}
