import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useOverviewStatistics } from '@/features/teacherFacultyDashboard/overview/model/useOverviewStatistics'
import { OverviewDetailsPanel } from '@/features/teacherFacultyDashboard/overview/ui/OverviewDetailsPanel'
import { OverviewFiltersBar } from '@/features/teacherFacultyDashboard/overview/ui/OverviewFiltersBar'
import { OverviewKpiGrid } from '@/features/teacherFacultyDashboard/overview/ui/OverviewKpiGrid'
import { OverviewLevelChart } from '@/features/teacherFacultyDashboard/overview/ui/OverviewLevelChart'

/**
 * Onglet « Vue d'ensemble » — filtres, KPIs, graphique par niveau, détails.
 * @param {{ enabled: boolean, managedDeptId?: number | null, institutionWide?: boolean }} props
 */
export function OverviewTab({ enabled, managedDeptId, institutionWide }) {
  const { academicYearId } = useAcademicYear()

  const {
    data,
    loading,
    error,
    reload,
    filters,
    setFilter,
    departments,
    levels,
    metaLoading,
    deptScoped,
  } = useOverviewStatistics(academicYearId, enabled, { managedDeptId, institutionWide })

  return (
    <div className="flex flex-col gap-6">
      <OverviewFiltersBar
        filters={filters}
        onFilterChange={setFilter}
        departments={departments}
        levels={levels}
        metaLoading={metaLoading}
        deptScoped={deptScoped}
      />

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {error}{' '}
          <button
            type="button"
            className="font-semibold underline underline-offset-2"
            onClick={() => reload()}
          >
            Réessayer
          </button>
        </p>
      )}

      <OverviewKpiGrid summary={data?.summary} loading={loading && !data} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <OverviewLevelChart byLevel={data?.by_level} loading={loading && !data} />
        </div>
        <div className="lg:col-span-2">
          <OverviewDetailsPanel
            byStatus={data?.by_status}
            byDepartment={data?.by_department}
            loading={loading && !data}
          />
        </div>
      </div>

      <div className="mt-2" aria-hidden />
    </div>
  )
}
