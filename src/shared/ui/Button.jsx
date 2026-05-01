import { cn } from '@/shared/lib/cn'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-canvas)] ' +
  'disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap'

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400 dark:active:bg-brand-600 dark:text-white shadow-sm',
  secondary:
    'bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 dark:bg-secondary-500 dark:hover:bg-secondary-400 dark:active:bg-secondary-600 shadow-sm',
  ghost:
    'bg-transparent text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[color-mix(in_srgb,var(--app-elevated)_70%,white)] active:bg-zinc-200 dark:active:bg-[color-mix(in_srgb,var(--app-elevated)_55%,white)] border border-zinc-200 dark:border-[var(--app-border)]',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500 dark:active:bg-red-700 shadow-sm',
  soft:    'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:hover:bg-brand-900/70',
  softSecondary:
    'bg-secondary-50 text-secondary-800 hover:bg-secondary-100 active:bg-secondary-200 dark:bg-secondary-950/35 dark:text-secondary-200 dark:hover:bg-secondary-950/55',
}

const SIZES = {
  sm: 'h-8  px-3 text-xs',
  md: 'h-9  px-4',
  lg: 'h-11 px-6 text-base',
}

export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}) {
  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={cn(BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, className)}
      {...props}
    />
  )
}
