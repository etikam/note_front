import { Link } from 'react-router-dom'

import { Button } from '@/shared/ui/Button'

const STATUS_LABELS = {
  study_director: 'Directeur des études',
  general_director: 'Directeur général',
}

/**
 * @param {{
 *   result: Record<string, unknown> | null
 *   courseId?: string
 *   courseLabel?: string
 *   fileName?: string
 *   validationStatus?: string
 *   published?: boolean
 *   onStartAnother?: () => void
 * }} props
 */
export function AdminGradeImportResultPanel({
  result,
  courseId,
  courseLabel,
  fileName,
  validationStatus,
  published,
  onStartAnother,
}) {
  if (!result) return null
  const enrolled = Number(result.enrolled_count ?? 0)
  const grades = Number(result.grades_applied_count ?? 0)
  const resolved = Number(result.resolved_count ?? 0)

  return (
    <div className="rounded-xl border border-brand-200/80 bg-brand-50/80 px-4 py-4 text-sm text-brand-950 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-brand-100">
      <p className="font-semibold">Import terminé</p>
      {(courseLabel || fileName) && (
        <ul className="mt-2 space-y-0.5 text-[13px] text-brand-900/80 dark:text-brand-100/80">
          {courseLabel ? (
            <li>
              <span className="text-brand-800/70 dark:text-brand-200/70">Cours :</span> {courseLabel}
            </li>
          ) : null}
          {fileName ? (
            <li>
              <span className="text-brand-800/70 dark:text-brand-200/70">Fichier :</span> {fileName}
            </li>
          ) : null}
          {validationStatus ? (
            <li>
              <span className="text-brand-800/70 dark:text-brand-200/70">Validation :</span>{' '}
              {STATUS_LABELS[validationStatus] ?? validationStatus}
              {published ? ' · publié' : ' · non publié'}
            </li>
          ) : null}
        </ul>
      )}
      <ul className="mt-3 space-y-1 text-[13px]">
        <li>
          <span className="font-mono font-semibold">{enrolled}</span> nouvelle(s) inscription(s) au cours
        </li>
        <li>
          <span className="font-mono font-semibold">{grades}</span> fiche(s) de notes mise(s) à jour
        </li>
        {resolved > 0 ? (
          <li>
            <span className="font-mono font-semibold">{resolved}</span> conflit(s) traité(s)
          </li>
        ) : null}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {courseId ? (
          <Link
            to={`/teacher/courses/${courseId}`}
            className="inline-flex items-center rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-medium text-brand-800 hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-100 dark:hover:bg-brand-950"
          >
            Voir la notation du cours
          </Link>
        ) : null}
        {onStartAnother ? (
          <Button type="button" variant="ghost" size="sm" onClick={onStartAnother}>
            Importer un autre cours
          </Button>
        ) : null}
      </div>
    </div>
  )
}
