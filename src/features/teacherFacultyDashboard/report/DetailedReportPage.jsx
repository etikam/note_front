import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAuth } from '@/features/auth/model/AuthContext'
import { OverviewFiltersBar } from '@/features/teacherFacultyDashboard/overview/ui/OverviewFiltersBar'
import { useDetailedReport } from '@/features/teacherFacultyDashboard/report/model/useDetailedReport'
import { DetailedReportTable } from '@/features/teacherFacultyDashboard/report/ui/DetailedReportTable'

/**
 * Page Rapports : tableau statistique détaillé par niveau.
 * Réservée aux profils avec indicateurs agrégés institutionnels.
 */
export function DetailedReportPage() {
  const { user } = useAuth()
  const { academicYearId } = useAcademicYear()
  const canViewAggregatedStats = Boolean(user?.capabilities?.can_view_directory_aggregated_stats)
  const managedDeptId = user?.scope?.managed_department_id ?? null
  const institutionWide = Boolean(user?.scope?.institution_wide)

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
  } = useDetailedReport(academicYearId, canViewAggregatedStats, { managedDeptId, institutionWide })

  if (!canViewAggregatedStats) {
    return (
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-[var(--app-muted)]">
          Le rapport détaillé par niveau est réservé au directeur des études ou au directeur général.
          Vous conservez l&apos;accès aux listes et aux opérations de votre périmètre via le menu.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <OverviewFiltersBar
        filters={filters}
        onFilterChange={setFilter}
        departments={departments}
        levels={levels}
        metaLoading={metaLoading}
        deptScoped={deptScoped}
        title="Filtres du rapport"
        description="Affinez le tableau par semestre, département et niveau. L'année académique suit le sélecteur global."
      />

      {error ? (
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
      ) : null}

      <DetailedReportTable
        levels={data?.levels}
        totals={data?.totals}
        loading={loading && !data}
      />
    </div>
  )
}
