import { cn } from '@/shared/lib/cn'

const INPUT_BASE =
  'w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-shadow ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent ' +
  'disabled:cursor-not-allowed disabled:bg-zinc-50 dark:disabled:bg-brand-950/40 disabled:opacity-60'

export function Field({ label, htmlFor, className, error, children }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)} htmlFor={htmlFor}>
      {label ? (
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      ) : null}
      {children}
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </label>
  )
}

export function Input({ className, ...props }) {
  return <input className={cn(INPUT_BASE, className)} {...props} />
}

export function Select({ className, ...props }) {
  return (
    <select className={cn(INPUT_BASE, 'cursor-pointer', className)} {...props} />
  )
}
