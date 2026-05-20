import { useMemo, useState } from 'react'

import { useStudentCourses } from '@/features/student/hooks/useStudentResources'
import { StudentCourseCard } from '@/features/student/ui/StudentCourseCard'
import { StudentEmptyState } from '@/features/student/ui/StudentEmptyState'
import { StudentFilterChip, StudentFiltersBar } from '@/features/student/ui/StudentFiltersBar'
import { StudentPageHeader } from '@/features/student/ui/StudentPageHeader'
import { Spinner } from '@/shared/ui/Spinner'

export function StudentCoursesPage() {
  const { data, loading } = useStudentCourses({ page_size: 100 })
  const [statusFilter, setStatusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  const rows = data?.results ?? []
  const years = useMemo(
    () => [...new Set(rows.map((r) => r.academic_year).filter(Boolean))].sort().reverse(),
    [rows],
  )

  const filtered = rows.filter((row) => {
    if (statusFilter !== 'all' && row.status !== statusFilter) return false
    if (yearFilter !== 'all' && row.academic_year !== yearFilter) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6">
      <StudentPageHeader title="Mes cours" description="Cours auxquels vous êtes inscrit ou en attente de validation." />

      <StudentFiltersBar>
        <StudentFilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
          Tous
        </StudentFilterChip>
        {['approved', 'pending', 'rejected'].map((s) => (
          <StudentFilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
            {s === 'approved' ? 'Approuvés' : s === 'pending' ? 'En attente' : 'Rejetés'}
          </StudentFilterChip>
        ))}
        {years.map((y) => (
          <StudentFilterChip key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>
            {y}
          </StudentFilterChip>
        ))}
      </StudentFiltersBar>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" label="Chargement des cours" />
        </div>
      ) : filtered.length === 0 ? (
        <StudentEmptyState title="Aucun cours" description="Ajustez les filtres ou demandez une inscription." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((enrollment) => (
            <StudentCourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
        </div>
      )}
    </div>
  )
}
