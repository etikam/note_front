import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, UserPlus } from 'lucide-react'

import { useInView } from '@/shared/hooks/useInView'
import { useStudents } from '@/features/teacher/students/hooks/useStudents'
import { StudentFilters } from '@/features/teacher/students/ui/StudentFilters'
import { StudentStats } from '@/features/teacher/students/ui/StudentStats'
import { StudentTable } from '@/features/teacher/students/ui/StudentTable'
import { StudentEnrollModal } from '@/features/teacher/students/ui/StudentEnrollModal'
import { Button } from '@/shared/ui/Button'

export function TeacherStudentsListPage() {
  const [setTableHostRef, listInView] = useInView({ rootMargin: '100px' })
  const ts = useStudents({ listEnabled: listInView })
  const [selectedIds, setSelectedIds] = useState([])
  const [enrollOpen, setEnrollOpen] = useState(false)

  useEffect(() => {
    setSelectedIds([])
  }, [ts.results, ts.page, ts.pageSize, ts.ordering])

  const selectedRows = useMemo(() => {
    if (!Array.isArray(ts.results) || ts.results.length === 0 || selectedIds.length === 0) return []
    const selectedSet = new Set(selectedIds)
    return ts.results.filter((r) => selectedSet.has(r.id))
  }, [selectedIds, ts.results])

  const selectedDepartmentCodes = useMemo(
    () => new Set(selectedRows.map((r) => r.department_code).filter(Boolean)),
    [selectedRows],
  )
  const canShowEnrollButton = selectedRows.length > 0 && selectedDepartmentCodes.size === 1
  const selectedDepartmentCode = canShowEnrollButton ? selectedRows[0]?.department_code ?? '' : ''
  const selectedDepartmentName = canShowEnrollButton ? selectedRows[0]?.department_name ?? '' : ''
  const selectedDepartmentId = useMemo(() => {
    if (!selectedDepartmentCode) return null
    const dep = (ts.departments ?? []).find((d) => String(d.code) === String(selectedDepartmentCode))
    return dep?.id ?? null
  }, [selectedDepartmentCode, ts.departments])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-600 dark:text-secondary-400 mb-1.5">
            Gestion académique
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Étudiants
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Annuaire institutionnel — recherche, filtres et suivi des dossiers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {selectedRows.length > 0 ? (
            <Button variant="ghost" onClick={() => setSelectedIds([])}>
              Tout désélectionner
            </Button>
          ) : null}
          {canShowEnrollButton ? (
            <Button variant="primary" onClick={() => setEnrollOpen(true)}>
              Inscrire ({selectedRows.length})
            </Button>
          ) : null}
          <Button variant="softSecondary" onClick={ts.exportCsv}>
            <Download size={16} aria-hidden /> Exporter
          </Button>
          {ts.canImport && (
            <Button as={Link} to="/teacher/students/import-export">
              <UserPlus size={16} aria-hidden /> Ajouter
            </Button>
          )}
        </div>
      </div>

      <StudentStats stats={ts.stats} />

      <StudentFilters
        q={ts.q}
        onQChange={ts.setQ}
        departmentId={ts.departmentId}
        onDepartmentIdChange={ts.setDepartmentId}
        filterAcademicYearId={ts.filterAcademicYearId}
        onFilterAcademicYearIdChange={ts.setFilterAcademicYearId}
        cohorteId={ts.cohorteId}
        onCohorteIdChange={ts.setCohorteId}
        cohorts={ts.cohorts}
        filtersOpen={ts.filtersOpen}
        onFiltersOpenChange={ts.setFiltersOpen}
        levelId={ts.levelId}
        onLevelIdChange={ts.setLevelId}
        status={ts.status}
        onStatusChange={ts.setStatus}
        departments={ts.departments}
        levels={ts.levels}
        metaLoading={ts.metaLoading}
        isLoadingYears={ts.isLoadingYears}
        academicYears={ts.academicYears}
        deptScoped={ts.deptScoped}
        activeFilterCount={ts.activeFilterCount}
        onResetFilters={ts.resetFilters}
      />

      <div ref={setTableHostRef}>
        {selectedRows.length > 0 && !canShowEnrollButton ? (
          <div className="mb-3 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/20 dark:text-amber-200">
            La sélection contient plusieurs départements. Pour inscrire en lot, sélectionnez uniquement des étudiants
            du même département.
          </div>
        ) : null}
        <StudentTable
          listEnabled={listInView}
          loading={ts.loading}
          error={ts.error}
          onRetry={ts.load}
          results={ts.results}
          page={ts.page}
          onPageChange={ts.setPage}
          count={ts.count}
          next={ts.next}
          previous={ts.previous}
          pageNumbers={ts.pageNumbers}
          rangeStart={ts.rangeStart}
          rangeEnd={ts.rangeEnd}
          pageSize={ts.pageSize}
          onPageSizeChange={ts.setPageSize}
          ordering={ts.ordering}
          onOrderingChange={ts.setOrdering}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
        />
      </div>

      <StudentEnrollModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        selectedStudentIds={selectedIds}
        selectedCount={selectedRows.length}
        departmentId={selectedDepartmentId}
        departmentCode={selectedDepartmentCode}
        departmentName={selectedDepartmentName}
        academicYearId={ts.filterAcademicYearId}
        onSubmitted={() => {
          setSelectedIds([])
          ts.load()
        }}
      />
    </div>
  )
}
