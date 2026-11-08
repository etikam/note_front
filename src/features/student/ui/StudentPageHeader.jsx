export function StudentPageHeader({ eyebrow = 'Espace étudiant', title, description, action }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
      <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold text-[var(--app-muted)]">{eyebrow}</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-[var(--app-fg)] sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
