/** Squelette de chargement pour le tableau de rapport détaillé. */
export function ReportTableSkeleton() {
  const cols = 18
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
      <div className="h-24 bg-brand-600/20" />
      <div className="divide-y divide-[var(--app-border)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-2 px-4 py-3">
            {Array.from({ length: cols }).map((__, j) => (
              <div
                key={j}
                className="h-4 flex-1 rounded bg-[color-mix(in_srgb,var(--app-elevated)_82%,var(--app-canvas))] dark:bg-white/[0.08]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
