import { useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { useOverlay } from '@/shared/hooks/useOverlay'
import { cn } from '@/shared/lib/cn'

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

/**
 * Fenêtre modale centrée.
 * ``dismissible=false`` pendant un enregistrement pour empêcher la fermeture.
 */
export function Dialog({ open, onClose, title, description, icon: Icon, children, footer, size = 'md', dismissible = true }) {
  const titleId = useId()
  const descId = useId()
  const panelRef = useOverlay(open, onClose, { dismissible })
  if (!open) return null

  return createPortal(
    <div
      className="ds-fade-in fixed inset-0 z-[120] flex items-end justify-center bg-[var(--app-overlay)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'ds-pop-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-2xl outline-none sm:rounded-2xl',
          SIZES[size] ?? SIZES.md,
        )}
      >
        <header className="flex items-start gap-3 border-b border-[var(--app-border)] px-5 py-4">
          {Icon ? (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              <Icon size={18} aria-hidden />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[15px] font-semibold leading-tight text-[var(--app-fg)]">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-[13px] leading-relaxed text-[var(--app-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Fermer"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)] disabled:opacity-40"
          >
            <X size={17} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--app-border)] bg-[var(--app-subtle)] px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
