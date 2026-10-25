import { cn } from '@/shared/lib/cn'

/**
 * Onglets soulignés. ``tabs`` : ``[{ id, label, icon?, count? }]``.
 * Flèches gauche/droite pour naviguer au clavier.
 */
export function Tabs({ tabs, value, onChange, className, ariaLabel = 'Sections' }) {
  function onKeyDown(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = tabs.findIndex((t) => t.id === value)
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
    onChange(next.id)
    e.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn('flex gap-1 overflow-x-auto border-b border-[var(--app-border)]', className)}
    >
      {tabs.map((t) => {
        const active = t.id === value
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            data-tab={t.id}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-medium outline-none transition-colors',
              'focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-0',
              active
                ? 'border-brand-600 text-[var(--app-fg)] dark:border-brand-400'
                : 'border-transparent text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg-soft)]',
            )}
          >
            {Icon ? <Icon size={15} aria-hidden /> : null}
            {t.label}
            {t.count != null ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[11px] font-semibold tabular-nums',
                  active ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200' : 'bg-[var(--app-subtle)] text-[var(--app-muted)]',
                )}
              >
                {t.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
