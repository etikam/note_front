import { Link } from 'react-router-dom'

import { ENROLLMENT_STATUS_UI, STUDENT_BADGE } from '@/features/student/student.constants'
import { cn } from '@/shared/lib/cn'

export function StudentCourseCard({ enrollment }) {
  const statusUi = ENROLLMENT_STATUS_UI[enrollment.status] ?? ENROLLMENT_STATUS_UI.pending
  return (
    <Link
      to={`/student/courses/${enrollment.course_id}`}
      className="block rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-[var(--app-muted)]">{enrollment.course_code}</p>
          <h3 className="mt-1 font-heading text-lg font-semibold text-[var(--app-fg)]">{enrollment.course_name}</h3>
          <p className="mt-1 text-sm text-[var(--app-muted)]">
            {enrollment.teaching_unit_code} · S{enrollment.semester_number ?? '—'} · {enrollment.academic_year}
          </p>
        </div>
        <span className={cn(STUDENT_BADGE, statusUi.className)}>{statusUi.label}</span>
      </div>
      {enrollment.teacher_name ? (
        <p className="mt-3 text-sm text-[var(--app-muted)]">Enseignant : {enrollment.teacher_name}</p>
      ) : null}
    </Link>
  )
}
