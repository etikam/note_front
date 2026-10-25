import { AlertTriangle, Inbox } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

/** État vide ou d'erreur standardisé. ``tone="error"`` avec ``onRetry`` pour les échecs de chargement. */
export function EmptyState({ icon: Icon, title, description, action, tone = 'neutral', onRetry, className, compact = false }) {
  const FallbackIcon = tone === 'error' ? AlertTriangle : Inbox
  const Glyph = Icon ?? FallbackIcon
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      <span
        className={cn(
          'mb-3 flex h-11 w-11 items-center justify-center rounded-xl',
          tone === 'error'
            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300'
            : 'bg-[var(--app-subtle)] text-[var(--app-muted)]',
        )}
      >
        <Glyph size={20} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-[var(--app-fg)]">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--app-muted)]">{description}</p> : null}
      {onRetry || action ? (
        <div className="mt-4 flex gap-2">
          {onRetry ? (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Réessayer
            </Button>
          ) : null}
          {action}
        </div>
      ) : null}
    </div>
  )
}
