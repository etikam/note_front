import { Fragment, useMemo, useState } from 'react'

import { GradeDetailModal } from '@/features/teacher/students/grades/ui/GradeDetailModal'
import { cn } from '@/shared/lib/cn'

const HEADER_CELL =
  'border-b border-r border-zinc-200 py-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 align-bottom dark:border-[var(--app-border)] dark:text-zinc-400'

const STICKY_HEADER_CELL = cn(HEADER_CELL, 'sticky z-10 bg-[var(--app-elevated)]')

const CELL = 'border-b border-r border-zinc-200 py-2 px-2 text-sm text-zinc-700 dark:border-[var(--app-border)] dark:text-zinc-200'

const STICKY_CELL = cn(CELL, 'sticky z-10 bg-[var(--app-elevated)]')

const VERT = 'inline-block [writing-mode:vertical-rl] rotate-180 h-[11rem] break-all mx-auto'

function formatAverage(value) {
  if (value === null || value === undefined) return '—'
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(2)
}

/** Entoure les portions correspondant à `query` d'un <mark> jaune. */
function highlight(text, query) {
  const str = String(text ?? '')
  if (!query || !query.trim()) return str
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = str.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-amber-200 text-amber-900 dark:bg-amber-600/50 dark:text-amber-100 rounded px-0.5 not-italic">
        {part}
      </mark>
    ) : part,
  )
}

export function LevelGradesTable({ report, selectedCourseId = '', searchQuery = '' }) {
  const semesters = report?.semesters ?? []
  const allStudents = report?.students ?? []
  const [selected, setSelected] = useState(null)

  const filteredStudents = useMemo(() => {
    let result = allStudents

    if (selectedCourseId) {
      result = result.filter((s) => s.course_grades?.[String(selectedCourseId)] !== null)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.matricule.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.first_name.toLowerCase().includes(q),
      )
    }

    return result
  }, [allStudents, selectedCourseId, searchQuery])

  if (!allStudents.length) {
    return (
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Aucun étudiant trouvé pour cette cohorte.
      </div>
    )
  }

  if (!filteredStudents.length) {
    return (
      <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Aucun résultat pour ces filtres.
      </div>
    )
  }

  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border border-[var(--app-border)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className={cn(STICKY_HEADER_CELL, 'left-0 w-10 text-center')} rowSpan={2}>
              N°
            </th>
            <th className={cn(STICKY_HEADER_CELL, 'left-10 w-[7rem] whitespace-nowrap')} rowSpan={2}>
              Matricule
            </th>
            <th className={cn(STICKY_HEADER_CELL, 'left-[9.5rem] whitespace-nowrap')} rowSpan={2}>
              Nom et prénom
            </th>
            {semesters.map((semester) => {
              const colCount =
                semester.teaching_units.reduce((n, tu) => n + tu.courses.length + 1, 0) + 1
              return (
                <th
                  key={`sem-${semester.number}`}
                  className={cn(HEADER_CELL, 'text-center bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]')}
                  colSpan={colCount}
                >
                  Semestre {semester.number}
                </th>
              )
            })}
            <th className={cn(HEADER_CELL, 'text-center')} rowSpan={2}>
              <span className={VERT}>Nb total de cours non validés</span>
            </th>
          </tr>
          <tr>
            {semesters.map((semester) =>
              semester.teaching_units.map((tu) => (
                <Fragment key={tu.id}>
                  {tu.courses.map((course) => {
                    const isSelected = selectedCourseId && String(course.id) === String(selectedCourseId)
                    return (
                      <th
                        key={course.id}
                        className={cn(
                          HEADER_CELL,
                          'text-center',
                          isSelected && 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
                        )}
                      >
                        <span className={VERT}>{course.name}</span>
                      </th>
                    )
                  })}
                  <th className={cn(HEADER_CELL, 'text-center bg-secondary-500/5')}>
                    <span className={VERT}>Moy. UE</span>
                  </th>
                </Fragment>
              )),
            )}
            {semesters.map((semester) => (
              <th key={`sem-nonval-${semester.number}`} className={cn(HEADER_CELL, 'text-center')}>
                <span className={VERT}>Nb cours non validés</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student, idx) => (
            <tr key={student.id} className="hover:bg-[var(--app-nav-hover)]">
              <td className={cn(STICKY_CELL, 'left-0 text-center text-zinc-500')}>{idx + 1}</td>
              <td className={cn(STICKY_CELL, 'left-10 font-medium whitespace-nowrap')}>
                {highlight(student.matricule, searchQuery)}
              </td>
              <td className={cn(STICKY_CELL, 'left-[9.5rem] whitespace-nowrap')}>
                {highlight(`${student.last_name} ${student.first_name}`, searchQuery)}
              </td>
              {semesters.map((semester) =>
                semester.teaching_units.map((tu) => (
                  <Fragment key={tu.id}>
                    {tu.courses.map((course) => {
                      const grade = student.course_grades?.[String(course.id)]
                      const notValidated = !grade || grade.status !== 'PASSED'
                      const isSelected = selectedCourseId && String(course.id) === String(selectedCourseId)
                      return (
                        <td
                          key={course.id}
                          className={cn(
                            CELL,
                            'text-center',
                            notValidated && grade ? 'text-orange-600 dark:text-orange-300' : '',
                            !grade ? 'text-zinc-400 dark:text-zinc-500' : '',
                            grade ? 'cursor-pointer hover:bg-secondary-500/10' : '',
                            isSelected && 'bg-amber-50 dark:bg-amber-900/20',
                          )}
                          onClick={grade ? () => setSelected({ student, course, grade }) : undefined}
                        >
                          {formatAverage(grade?.average)}
                        </td>
                      )
                    })}
                    <td className={cn(CELL, 'text-center font-semibold bg-secondary-500/5')}>
                      {formatAverage(student.teaching_unit_averages?.[String(tu.id)])}
                    </td>
                  </Fragment>
                )),
              )}
              {semesters.map((semester) => (
                <td key={`sem-nonval-${semester.number}`} className={cn(CELL, 'text-center font-semibold')}>
                  {student.semester_non_validated?.[semester.number] ?? 0}
                </td>
              ))}
              <td className={cn(CELL, 'text-center font-bold')}>{student.total_non_validated}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <GradeDetailModal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        student={selected?.student}
        course={selected?.course}
        grade={selected?.grade}
      />
    </div>
  )
}
