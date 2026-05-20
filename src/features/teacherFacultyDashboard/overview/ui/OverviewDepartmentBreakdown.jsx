function formatNumber(value) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '0'
  return new Intl.NumberFormat('fr-FR').format(n)
}

export function OverviewDepartmentBreakdown({ rows = [], loading }) {
  const isEmpty = !loading && rows.length === 0

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--app-muted)]">
        Répartition par département
      </h3>
      <ul className="mt-3 space-y-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex animate-pulse justify-between gap-2">
                <span className="h-4 w-32 rounded bg-[color-mix(in_srgb,var(--app-elevated)_82%,var(--app-canvas))] dark:bg-white/[0.08]" />
                <span className="h-4 w-8 rounded bg-[color-mix(in_srgb,var(--app-elevated)_82%,var(--app-canvas))] dark:bg-white/[0.08]" />
              </li>
            ))
          : isEmpty
            ? (
                <li className="text-sm text-[var(--app-muted)]">Aucun département</li>
              )
            : rows.map((row) => (
                <li key={row.department_id ?? row.code} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-[var(--app-fg)]">{row.name || row.code}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                    {formatNumber(row.count)}
                  </span>
                </li>
              ))}
      </ul>
    </div>
  )
}
