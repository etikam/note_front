import { useMemo, useState } from 'react'

import { useStudentGrades } from '@/features/student/hooks/useStudentResources'
import { GRADE_STATUS_UI } from '@/features/student/student.constants'
import { StudentEmptyState } from '@/features/student/ui/StudentEmptyState'
import { StudentFilterChip, StudentFiltersBar } from '@/features/student/ui/StudentFiltersBar'
import { StudentGradeCard, StudentGradesTable } from '@/features/student/ui/StudentGradeCard'
import { StudentPageHeader } from '@/features/student/ui/StudentPageHeader'
import { Spinner } from '@/shared/ui/Spinner'

export function StudentGradesPage() {
  const { data, loading } = useStudentGrades({ page_size: 100 })
  const [yearFilter, setYearFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const rows = data?.results ?? []
  const years = useMemo(
    () => [...new Set(rows.map((r) => r.academic_year).filter(Boolean))].sort().reverse(),
    [rows],
  )

  const filtered = rows.filter((row) => {
    if (yearFilter !== 'all' && row.academic_year !== yearFilter) return false
    if (statusFilter !== 'all' && row.status !== statusFilter) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <StudentPageHeader
        title="Mes notes"
        description="Toutes vos notes saisies, avec le statut pédagogique, le niveau de validation et la publication."
      />

      <StudentFiltersBar>
        <StudentFilterChip active={yearFilter === 'all'} onClick={() => setYearFilter('all')}>
          Toutes années
        </StudentFilterChip>
        {years.map((y) => (
          <StudentFilterChip key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>
            {y}
          </StudentFilterChip>
        ))}
        {Object.entries(GRADE_STATUS_UI).map(([s, ui]) => (
          <StudentFilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
            {ui.label}
          </StudentFilterChip>
        ))}
      </StudentFiltersBar>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" label="Chargement des notes" />
        </div>
      ) : filtered.length === 0 ? (
        <StudentEmptyState title="Aucune note" description="Vos notes apparaîtront ici dès qu'un enseignant les saisira." />
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:hidden">
            {filtered.map((grade) => (
              <StudentGradeCard key={grade.id} grade={grade} />
            ))}
          </div>
          <StudentGradesTable grades={filtered} />
        </>
      )}
    </div>
  )
}
