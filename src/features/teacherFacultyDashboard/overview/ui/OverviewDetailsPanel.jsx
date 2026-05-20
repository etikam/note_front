import { OverviewDepartmentBreakdown } from '@/features/teacherFacultyDashboard/overview/ui/OverviewDepartmentBreakdown'
import { OverviewStatusBreakdown } from '@/features/teacherFacultyDashboard/overview/ui/OverviewStatusBreakdown'

export function OverviewDetailsPanel({ byStatus, byDepartment, loading }) {
  return (
    <div className="flex h-full flex-col gap-6 rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[var(--app-fg)]">Détails des statistiques</h2>
        <p className="mt-1 text-xs text-[var(--app-muted)]">Répartitions des effectifs filtrés.</p>
      </div>
      <OverviewStatusBreakdown rows={byStatus} loading={loading} />
      <OverviewDepartmentBreakdown rows={byDepartment} loading={loading} />
    </div>
  )
}
