import { OverviewKpiCard } from '@/features/teacherFacultyDashboard/overview/ui/OverviewKpiCard'

const KPI_ITEMS = [
  { key: 'students', label: 'Étudiants' },
  { key: 'active_students', label: 'Actifs' },
  { key: 'teachers', label: 'Enseignants' },
  { key: 'courses', label: 'Matières' },
]

function KpiSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm">
      <div className="h-3 w-1/2 rounded bg-[color-mix(in_srgb,var(--app-elevated)_82%,var(--app-canvas))] dark:bg-white/[0.08]" />
      <div className="h-9 w-1/3 rounded bg-[color-mix(in_srgb,var(--app-elevated)_82%,var(--app-canvas))] dark:bg-white/[0.08]" />
    </div>
  )
}

export function OverviewKpiGrid({ summary, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_ITEMS.map((item) => (
          <KpiSkeleton key={item.key} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_ITEMS.map((item) => (
        <OverviewKpiCard
          key={item.key}
          label={item.label}
          value={summary?.[item.key]}
        />
      ))}
    </div>
  )
}
