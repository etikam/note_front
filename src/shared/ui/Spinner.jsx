import { cn } from '@/shared/lib/cn'

const SIZES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-[3px]',
  lg: 'w-8 h-8 border-[3px]',
}

const VARIANTS = {
  default:
    'border-zinc-200 border-t-brand-600 dark:border-[var(--app-border)] dark:border-t-brand-400',
  inverse: 'border-white/30 border-t-white',
}

export function Spinner({ size = 'md', variant = 'default', className, label = 'Chargement' }) {
  return (
    <span
      className={cn('inline-flex items-center justify-center shrink-0', className)}
      role="status"
      aria-label={label}
    >
      <span
        className={cn(
          'animate-spin rounded-full',
          SIZES[size] ?? SIZES.md,
          VARIANTS[variant] ?? VARIANTS.default
        )}
        aria-hidden
      />
    </span>
  )
}

export function PageLoading({ label = 'Chargement', className }) {
  return (
    <div
      className={cn('flex items-center justify-center min-h-[200px] w-full', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size="lg" label={label} />
    </div>
  )
}
