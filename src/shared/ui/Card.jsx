import { cn } from '@/shared/lib/cn'

export function Card({ className, ...props }) {
  return (
    <section
      className={cn(
        'bg-[var(--app-elevated)] rounded-xl border border-[var(--app-border)] shadow-sm',
        className
      )}
      {...props}
    />
  )
}
