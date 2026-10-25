import { Search, X } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/** Champ de recherche avec icône et bouton d'effacement. */
export function SearchInput({ value, onChange, placeholder = 'Rechercher…', className, autoFocus, ariaLabel }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        autoFocus={autoFocus}
        data-autofocus={autoFocus ? '' : undefined}
        className={cn(
          'h-9 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] pl-9 pr-8 text-[13px] text-[var(--app-fg)]',
          'placeholder:text-[var(--app-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]',
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--app-muted)] hover:bg-[var(--app-hover)]"
        >
          <X size={13} aria-hidden />
        </button>
      ) : null}
    </div>
  )
}
