import { useEffect, useId, useState } from 'react'
import { Ban, X } from 'lucide-react'

import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'

/**
 * Modale suspension — saisie du motif (UI seule, pas d’appel API).
 */
export function StudentSuspendModal({ open, onClose, studentLabel }) {
  const titleId = useId()
  const descId = useId()
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (open) setReason('')
  }, [open])

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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative w-full max-w-md rounded-2xl border shadow-xl',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
              <Ban size={20} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                Suspendre l’étudiant
              </h2>
              {studentLabel ? (
                <p className="text-sm text-[var(--app-muted)] truncate">{studentLabel}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[var(--app-nav-hover)] dark:text-zinc-400 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <p id={descId} className="px-5 text-sm text-[var(--app-muted)]">
          Indiquez le motif de la suspension. Cette action sera enregistrée une fois le flux métier branché.
        </p>

        <div className="px-5 py-4">
          <label htmlFor="suspend-reason" className="block text-xs font-medium text-[var(--app-muted)] mb-1.5">
            Motif de suspension
          </label>
          <textarea
            id="suspend-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex. : absence prolongée, fraude aux examens, non-paiement…"
            className={cn(
              'w-full rounded-xl border px-3 py-2.5 text-sm resize-y min-h-[6rem]',
              'bg-white dark:bg-[var(--app-elevated)] border-zinc-200 dark:border-[var(--app-border)]',
              'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400'
            )}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 pb-5 pt-1 border-t border-[var(--app-border)] mt-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              onClose()
            }}
          >
            Confirmer la suspension
          </Button>
        </div>
      </div>
    </div>
  )
}
