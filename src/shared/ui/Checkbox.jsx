import { Check, Minus } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/** Case à cocher accessible (état mixte possible). */
export function Checkbox({ checked, indeterminate = false, onChange, disabled, label, description, className, id }) {
  const state = indeterminate ? 'mixed' : Boolean(checked)
  return (
    <label
      htmlFor={id}
      className={cn(
        'group flex items-start gap-2.5',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={state}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-1',
          checked || indeterminate
            ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500'
            : 'border-[var(--app-border-strong)] bg-[var(--app-elevated)] group-hover:border-brand-400',
        )}
      >
        {indeterminate ? <Minus size={12} strokeWidth={3} aria-hidden /> : checked ? <Check size={12} strokeWidth={3} aria-hidden /> : null}
      </button>
      {label ? (
        <span className="min-w-0">
          <span className="block text-[13px] leading-snug text-[var(--app-fg)]">{label}</span>
          {description ? <span className="mt-0.5 block text-[12px] leading-snug text-[var(--app-muted)]">{description}</span> : null}
        </span>
      ) : null}
    </label>
  )
}
