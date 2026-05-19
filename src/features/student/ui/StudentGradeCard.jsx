import {
  NotationGradeStatusBadge,
  NotationPublicationBadges,
  NotationWorkflowBadge,
} from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationStatusBadges'
import { VALIDATION_STATUS_LABELS } from '@/features/teacherFacultyDashboard/pedagogy/notation/model/notationLabels'
import { GRADE_STATUS_UI, STUDENT_BADGE } from '@/features/student/student.constants'
import { cn } from '@/shared/lib/cn'

export function StudentGradeCard({ grade }) {
  return (
    <article className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-[var(--app-muted)]">{grade.course_code}</p>
          <h3 className="mt-1 font-heading text-base font-semibold sm:text-lg">{grade.course_name}</h3>
          <p className="mt-1 text-xs text-[var(--app-muted)] sm:text-sm">
            {grade.academic_year} · S{grade.semester_number ?? '—'}
          </p>
        </div>
        <div className="flex max-w-full flex-wrap justify-end gap-1">
          <NotationGradeStatusBadge grade={grade} />
          <NotationWorkflowBadge grade={grade} />
          <NotationPublicationBadges grade={grade} />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:mt-4 sm:grid-cols-4 sm:gap-3">
        {['note1', 'note2', 'note3', 'note4'].map((key) =>
          grade[key] != null ? (
            <div key={key}>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted)]">{key}</dt>
              <dd className="font-semibold tabular-nums">{grade[key]}</dd>
            </div>
          ) : null,
        )}
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted)]">Moyenne</dt>
          <dd className="font-heading text-lg font-bold tabular-nums sm:text-xl">{grade.average ?? '—'}</dd>
        </div>
      </dl>
    </article>
  )
}

export function StudentGradesTable({ grades }) {
  return (
    <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[var(--app-border)]">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-[var(--app-elevated)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--app-muted)]">
          <tr>
            <th className="px-4 py-3">Cours</th>
            <th className="px-4 py-3">Année</th>
            <th className="px-4 py-3">Moyenne</th>
            <th className="px-4 py-3">Résultat</th>
            <th className="px-4 py-3">Validation</th>
            <th className="px-4 py-3">Publication</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((g) => {
            const statusUi = GRADE_STATUS_UI[g.status] ?? { label: g.status }
            const valLabel =
              g.validation_status_label ??
              VALIDATION_STATUS_LABELS[g.validation_status] ??
              g.validation_status
            return (
              <tr key={g.id} className="border-t border-[var(--app-border)]">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-[var(--app-muted)]">{g.course_code}</span>
                  <span className="ml-2 font-medium">{g.course_name}</span>
                </td>
                <td className="px-4 py-3">{g.academic_year}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">{g.average ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={cn(STUDENT_BADGE, statusUi.className)}>{statusUi.label}</span>
                </td>
                <td className="px-4 py-3 text-xs">{valLabel ?? '—'}</td>
                <td className="px-4 py-3 text-xs">{g.published ? 'Publiée' : 'Non publiée'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
