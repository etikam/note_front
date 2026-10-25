import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/ui/Skeleton'

const TONES = {
  neutral: 'text-[var(--app-muted)] bg-[var(--app-subtle)]',
  brand: 'text-brand-700 bg-brand-50 dark:text-brand-200 dark:bg-brand-500/10',
  warning: 'text-secondary-700 bg-secondary-50 dark:text-secondary-200 dark:bg-secondary-500/10',
  success: 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-500/10',
}

/** Indicateur compact : libellé, valeur, précision optionnelle. */
export function StatTile({ label, value, hint, icon: Icon, tone = 'neutral', loading = false, className }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] px-4 py-3.5', className)}>
      {Icon ? (
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', TONES[tone] ?? TONES.neutral)}>
          <Icon size={17} aria-hidden />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-[var(--app-muted)]">{label}</p>
        {loading ? (
          <Skeleton className="mt-1.5 h-6 w-16" />
        ) : (
          <p className="mt-0.5 font-heading text-[22px] font-semibold leading-tight tabular-nums text-[var(--app-fg)]">{value}</p>
        )}
        {hint ? <p className="mt-0.5 truncate text-[11.5px] text-[var(--app-muted)]">{hint}</p> : null}
      </div>
    </div>
  )
}
