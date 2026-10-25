import { useId } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { useOverlay } from '@/shared/hooks/useOverlay'
import { cn } from '@/shared/lib/cn'

const WIDTHS = { md: 'sm:max-w-md', lg: 'sm:max-w-xl', xl: 'sm:max-w-3xl' }

/** Panneau latéral droit : détail, édition ou assistant sans quitter la liste. */
export function Drawer({ open, onClose, title, description, eyebrow, children, footer, width = 'lg', dismissible = true }) {
  const titleId = useId()
  const panelRef = useOverlay(open, onClose, { dismissible })
  if (!open) return null

  return createPortal(
    <div
      className="ds-fade-in fixed inset-0 z-[120] flex justify-end bg-[var(--app-overlay)] backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && dismissible) onClose()
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'ds-slide-in-right flex h-full w-full flex-col border-l border-[var(--app-border)] bg-[var(--app-elevated)] shadow-2xl outline-none',
          WIDTHS[width] ?? WIDTHS.lg,
        )}
      >
        <header className="flex items-start gap-3 border-b border-[var(--app-border)] px-5 py-4">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--app-muted)]">{eyebrow}</p>
            ) : null}
            <h2 id={titleId} className="text-base font-semibold leading-tight text-[var(--app-fg)]">
              {title}
            </h2>
            {description ? <p className="mt-1 text-[13px] text-[var(--app-muted)]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={!dismissible}
            aria-label="Fermer le panneau"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)] disabled:opacity-40"
          >
            <X size={17} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--app-border)] bg-[var(--app-subtle)] px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </aside>
    </div>,
    document.body,
  )
}
