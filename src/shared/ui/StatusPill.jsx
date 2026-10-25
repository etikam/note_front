import { cn } from '@/shared/lib/cn'

const TONES = {
  success: 'bg-green-50 text-green-700 ring-green-600/15 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-400/20',
  warning: 'bg-secondary-50 text-secondary-800 ring-secondary-600/20 dark:bg-secondary-500/10 dark:text-secondary-200 dark:ring-secondary-400/25',
  danger: 'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20',
  info: 'bg-brand-50 text-brand-700 ring-brand-600/15 dark:bg-brand-500/10 dark:text-brand-200 dark:ring-brand-400/25',
  neutral: 'bg-[var(--app-subtle)] text-[var(--app-fg-soft)] ring-[var(--app-border)]',
}

const DOTS = {
  success: 'bg-green-500',
  warning: 'bg-secondary-500',
  danger: 'bg-red-500',
  info: 'bg-brand-500',
  neutral: 'bg-zinc-400',
}

/** Pastille d'état compacte (point coloré + libellé). */
export function StatusPill({ tone = 'neutral', children, dot = true, className, title }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset',
        TONES[tone] ?? TONES.neutral,
        className,
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', DOTS[tone] ?? DOTS.neutral)} aria-hidden /> : null}
      {children}
    </span>
  )
}
