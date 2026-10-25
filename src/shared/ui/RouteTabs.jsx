import { NavLink } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'

/** Onglets de navigation entre sous-pages (même style que ``Tabs``). ``tabs`` : ``[{ to, label, icon?, end? }]``. */
export function RouteTabs({ tabs, className, ariaLabel = 'Sous-sections' }) {
  if (tabs.length < 2) return null
  return (
    <nav aria-label={ariaLabel} className={cn('mb-6 flex gap-1 overflow-x-auto border-b border-[var(--app-border)]', className)}>
      {tabs.map((t) => {
        const Icon = t.icon
        return (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                'relative -mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13px] font-medium outline-none transition-colors',
                'focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
                isActive
                  ? 'border-brand-600 text-[var(--app-fg)] dark:border-brand-400'
                  : 'border-transparent text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg-soft)]',
              )
            }
          >
            {Icon ? <Icon size={15} aria-hidden /> : null}
            {t.label}
          </NavLink>
        )
      })}
    </nav>
  )
}
