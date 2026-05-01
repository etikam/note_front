import { useEffect, useId, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

/** Modale de confirmation in-app (fond flouté, z-index au-dessus des modales Académie). */
export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  onConfirm,
}) {
  const titleId = useId()
  const descId = useId()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) setPending(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !pending) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, pending])

  if (!open) return null

  const handleBackdrop = () => {
    if (!pending) onClose()
  }

  const handleConfirm = async () => {
    setPending(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // Le parent gère l’erreur (toast) ; la modale reste ouverte.
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/55 dark:bg-black/75 backdrop-blur-[3px]"
      role="presentation"
      onClick={handleBackdrop}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? descId : undefined}
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 dark:ring-white/10',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4 px-5 py-5">
          <span
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1',
              variant === 'danger'
                ? 'bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800/60'
                : 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)] dark:text-zinc-300 dark:ring-[var(--app-border)]',
            )}
          >
            <AlertTriangle size={24} strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            {message ? (
              <p id={descId} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {message}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)] px-5 py-3 dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? 'En cours…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
