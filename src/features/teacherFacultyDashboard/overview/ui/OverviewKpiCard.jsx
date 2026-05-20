import { cn } from '@/shared/lib/cn'

function formatNumber(value) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function OverviewKpiCard({ label, value, className }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm',
        className,
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--app-muted)]">{label}</p>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums tracking-tight text-brand-600 dark:text-brand-400">
        {formatNumber(value)}
      </p>
    </div>
  )
}
