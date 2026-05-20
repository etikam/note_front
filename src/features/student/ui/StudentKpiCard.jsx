export function StudentKpiCard({ label, value, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary-500/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--app-muted)]">{label}</p>
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 dark:text-secondary-300 dark:ring-secondary-500/20">
            <Icon size={17} strokeWidth={2} aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums tracking-tight text-[var(--app-fg)]">{value}</p>
    </div>
  )
}
