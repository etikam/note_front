import { cn } from '@/shared/lib/cn'

export function StudentFiltersBar({ children, className }) {
  return (
    <div
      className={cn(
        'flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="toolbar"
      aria-label="Filtres"
    >
      {children}
    </div>
  )
}

export function StudentFilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
        active
          ? 'border-brand-500/50 bg-brand-500/10 text-brand-800 dark:text-brand-200'
          : 'border-[var(--app-border)] bg-[var(--app-elevated)] text-[var(--app-muted)] hover:text-[var(--app-fg)]',
      )}
    >
      {children}
    </button>
  )
}
