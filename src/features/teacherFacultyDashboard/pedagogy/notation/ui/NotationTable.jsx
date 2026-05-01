import { NotationRow } from '@/features/teacherFacultyDashboard/pedagogy/notation/ui/NotationRow'

export function NotationTable({
  courseId,
  rows,
  canPublishGrades,
  rowSaving,
  setRowSaving,
  onGradeSaved,
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[62rem] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-[var(--app-border)] dark:text-zinc-400">
            <th className="py-2.5 pl-4 pr-2">Matricule</th>
            <th className="py-2.5 pr-2">Étudiant</th>
            <th className="py-2.5 px-1.5 text-center">N1 (30%)</th>
            <th className="py-2.5 px-1.5 text-center">N2 (30%)</th>
            <th className="py-2.5 px-1.5 text-center">N3 (40%)</th>
            <th className="py-2.5 px-1.5 text-center">Rattr.</th>
            <th className="py-2.5 px-2 text-center">Moy.</th>
            <th className="py-2.5 px-2">Résultat</th>
            <th className="py-2.5 px-2">Statut de validation</th>
            <th className="py-2.5 pr-4 text-right">Publication</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <NotationRow
              key={row.student_id}
              courseId={courseId}
              row={row}
              canPublishGrades={canPublishGrades}
              rowSaving={rowSaving}
              setRowSaving={setRowSaving}
              onGradeSaved={onGradeSaved}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
