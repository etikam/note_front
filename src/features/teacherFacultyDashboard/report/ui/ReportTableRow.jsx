import { cn } from '@/shared/lib/cn'
import { fmtInt, fmtPct } from '@/features/teacherFacultyDashboard/report/ui/reportFormat'

const tdBase = 'border border-[var(--app-border)] px-2 py-2.5 text-center text-sm tabular-nums text-[var(--app-fg)]'
const tdLabel = 'text-left font-medium'

function Cell({ value, className }) {
  return <td className={cn(tdBase, className)}>{value}</td>
}

/** Une ligne de données (niveau ou total) dans le tableau de rapport. */
export function ReportTableRow({ row, isTotal = false }) {
  const enrolled = row.enrolled ?? {}
  const evaluated = row.evaluated ?? {}
  const admitted = row.admitted ?? {}
  const debts = row.debts ?? {}
  const pending = row.pending ?? {}
  const abandon = row.abandon ?? {}

  const rowClass = isTotal
    ? 'bg-brand-50/80 font-semibold dark:bg-brand-950/30'
    : 'even:bg-[color-mix(in_srgb,var(--app-elevated)_96%,var(--app-canvas))] hover:bg-[var(--app-nav-hover)]/30'

  return (
    <tr className={rowClass}>
      <td className={cn(tdBase, tdLabel, 'sticky left-0 z-[1] bg-inherit')}>
        {row.label}
      </td>
      <Cell value={fmtInt(enrolled.female)} />
      <Cell value={fmtInt(enrolled.male)} />
      <Cell value={fmtInt(enrolled.total)} className="font-semibold" />
      <Cell value={fmtInt(evaluated.female)} />
      <Cell value={fmtInt(evaluated.male)} />
      <Cell value={fmtInt(evaluated.total)} className="font-semibold" />
      <Cell value={fmtInt(admitted.count_total)} />
      <Cell value={fmtInt(admitted.count_female)} />
      <Cell value={fmtPct(admitted.pct_total)} />
      <Cell value={fmtPct(admitted.pct_female)} />
      <Cell value={fmtInt(debts['1'])} />
      <Cell value={fmtInt(debts['2'])} />
      <Cell value={fmtInt(debts['3'])} />
      <Cell value={fmtInt(debts['4'])} />
      <Cell value={fmtInt(debts['5plus'])} />
      <Cell value={fmtInt(pending.total)} />
      <Cell value={fmtInt(pending.female)} />
      <Cell value={fmtInt(abandon.total)} />
      <Cell value={fmtInt(abandon.female)} />
    </tr>
  )
}

/** Ligne « Total général » (alias sémantique). */
export function ReportTotalsRow({ totals }) {
  return <ReportTableRow row={totals} isTotal />
}
