import { useEffect, useState } from 'react'

import { Button } from '@/shared/ui/Button'
import { Dialog } from '@/shared/ui/Dialog'
import { Field } from '@/shared/ui/Field'

/**
 * Confirmation d'une action sur la fiche, avec commentaire (obligatoire si ``commentRequired``).
 * ``onConfirm(comment)`` peut lever : le message est affiché et la boîte reste ouverte.
 */
export function GradeSheetActionDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  variant = 'primary',
  commentLabel = 'Commentaire (optionnel)',
  commentRequired = false,
  onConfirm,
}) {
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setComment('')
      setError('')
    }
  }, [open])

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm(comment.trim())
      onClose()
    } catch (err) {
      setError(err?.message || 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }

  const blocked = commentRequired && !comment.trim()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!busy}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button variant={variant} onClick={confirm} disabled={busy || blocked}>
            {busy ? 'Envoi…' : confirmLabel}
          </Button>
        </>
      }
    >
      <Field label={commentLabel}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          data-autofocus=""
          className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
        />
      </Field>
      {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p> : null}
    </Dialog>
  )
}
