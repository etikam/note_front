import { useEffect, useId } from 'react'
import { X } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/**
 * Enveloppe visuelle commune aux modales Académie (fond, focus trap léger, Escape).
 */
export function PedagogyModalFrame({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  /** ex. max-w-lg, max-w-2xl, max-w-4xl */
  widthClass = 'max-w-lg',
  bodyClassName,
}) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/55 dark:bg-black/75 backdrop-blur-[3px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 dark:ring-white/10',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
          widthClass,
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-zinc-200/90 dark:border-[var(--app-border)] bg-gradient-to-br from-brand-50/90 via-white to-zinc-50/80 dark:from-[color-mix(in_srgb,var(--app-elevated)_92%,black)] dark:via-[var(--app-elevated)] dark:to-[color-mix(in_srgb,var(--app-elevated)_92%,white)] px-5 py-4">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.12),transparent_52%)]" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {Icon ? (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/90 text-brand-600 shadow-sm ring-1 ring-zinc-200/80 dark:bg-[color-mix(in_srgb,var(--app-elevated)_82%,white)] dark:text-secondary-200 dark:ring-white/10">
                  <Icon size={22} strokeWidth={1.75} aria-hidden />
                </span>
              ) : null}
              <div className="min-w-0 pt-0.5">
                <h2 id={titleId} className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {title}
                </h2>
                {subtitle ? <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p> : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white/80 hover:text-zinc-800 dark:hover:bg-[var(--app-nav-hover)] dark:hover:text-zinc-100"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={cn('max-h-[min(72vh,680px)] overflow-y-auto px-5 py-4', bodyClassName)}>{children}</div>

        {footer ? (
          <div className="border-t border-zinc-100 bg-zinc-50/80 px-5 py-3 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
