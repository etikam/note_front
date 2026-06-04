import { ReportTableHeader } from '@/features/teacherFacultyDashboard/report/ui/ReportTableHeader'
import { ReportTableRow, ReportTotalsRow } from '@/features/teacherFacultyDashboard/report/ui/ReportTableRow'
import { ReportTableSkeleton } from '@/features/teacherFacultyDashboard/report/ui/ReportTableSkeleton'

/**
 * Tableau responsive du rapport détaillé par niveau.
 *
 * @param {{ levels?: Array, totals?: object, loading?: boolean }} props
 */
export function DetailedReportTable({ levels = [], totals, loading }) {
  if (loading) {
    return <ReportTableSkeleton />
  }

  if (!levels.length) {
    return (
      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-6 py-12 text-center shadow-sm">
        <p className="text-sm text-[var(--app-muted)]">
          Aucune donnée pour les filtres sélectionnés.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--app-fg)]">Aperçu du rapport détaillé</h2>
          <p className="mt-0.5 text-xs text-[var(--app-muted)]">
            Effectifs par niveau : inscrits, évalués, admis, dettes et abandons.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-collapse text-sm">
          <ReportTableHeader />
          <tbody>
            {levels.map((row) => (
              <ReportTableRow key={row.level_id ?? row.label} row={row} />
            ))}
          </tbody>
          {totals ? (
            <tfoot>
              <ReportTotalsRow totals={totals} />
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  )
}
