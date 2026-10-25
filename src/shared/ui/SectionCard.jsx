import { cn } from '@/shared/lib/cn'

/** Carte de section : titre, description et actions en en-tête, contenu libre. */
export function SectionCard({ title, description, actions, children, className, bodyClassName, flush = false }) {
  return (
    <section className={cn('rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-[0_1px_2px_rgb(0_0_0/0.04)]', className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--app-border)] px-4 py-3">
          <div className="min-w-0">
            {title ? <h2 className="text-[14px] font-semibold text-[var(--app-fg)]">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[12.5px] text-[var(--app-muted)]">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn(flush ? '' : 'p-4', bodyClassName)}>{children}</div>
    </section>
  )
}
