export function StudentEmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-elevated)] px-6 py-12 text-center">
      <p className="font-heading text-lg font-semibold text-[var(--app-fg)]">{title}</p>
      {description ? <p className="mt-2 text-sm text-[var(--app-muted)]">{description}</p> : null}
    </div>
  )
}
