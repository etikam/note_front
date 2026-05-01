import { cn } from '@/shared/lib/cn'

const BASE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium'

const TONES = {
  neutral: 'bg-zinc-100 text-zinc-600 dark:bg-brand-950/50 dark:text-zinc-400',
  success: 'bg-brand-100 text-brand-800 dark:bg-brand-800/50 dark:text-brand-100',
  warning: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-950/35 dark:text-secondary-200',
  danger:  'bg-red-600 text-white dark:bg-red-600 dark:text-white',
  info:    'bg-brand-50 text-brand-700 dark:bg-brand-900/60 dark:text-brand-200',
  brand:   'bg-brand-100 text-brand-700 dark:bg-brand-800/70 dark:text-brand-100',
  secondary:
    'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/55 dark:text-secondary-200',
}

export function Badge({ tone = 'neutral', className, ...props }) {
  return (
    <span className={cn(BASE, TONES[tone] ?? TONES.neutral, className)} {...props} />
  )
}
