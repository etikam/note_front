import { useEffect, useState } from 'react'
import { CalendarClock, Ban } from 'lucide-react'

import { apiErrorMessage, fetchAssignment, revokeAssignment, updateAssignment } from '@/features/access/api/accessApi'
import { ASSIGNMENT_STATUS, SCOPE_LEVEL_PHRASES, formatDate, formatPeriod } from '@/features/admin/model/accessLabels'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { ConfirmModal } from '@/shared/ui/ConfirmModal'
import { Drawer } from '@/shared/ui/Drawer'
import { Field, Input } from '@/shared/ui/Field'
import { SkeletonLines } from '@/shared/ui/Skeleton'
import { StatusPill } from '@/shared/ui/StatusPill'

function Row({ label, children }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 text-[13px]">
      <dt className="text-[var(--app-muted)]">{label}</dt>
      <dd className="min-w-0 text-[var(--app-fg)]">{children}</dd>
    </div>
  )
}

/** Détail d'un mandat : période modifiable, révocation. ``assignmentId`` suffit (chargé à l'ouverture). */
export function MandateDrawer({ assignmentId, onClose, onChanged }) {
  const open = assignmentId != null
  const [mandate, setMandate] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ starts_on: '', ends_on: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setMandate(null)
    setError('')
    fetchAssignment(assignmentId)
      .then((m) => {
        if (cancelled) return
        setMandate(m)
        setForm({ starts_on: m.starts_on ?? '', ends_on: m.ends_on ?? '', note: m.note ?? '' })
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, 'Mandat introuvable.')))
    return () => {
      cancelled = true
    }
  }, [open, assignmentId])

  const editable = mandate && mandate.status !== 'revoked'
  const dirty =
    mandate &&
    (form.starts_on !== (mandate.starts_on ?? '') || form.ends_on !== (mandate.ends_on ?? '') || form.note !== (mandate.note ?? ''))
  const datesInvalid = Boolean(form.starts_on && form.ends_on && form.ends_on < form.starts_on)
  const status = mandate ? ASSIGNMENT_STATUS[mandate.status] : null

  async function save() {
    setSaving(true)
    try {
      const updated = await updateAssignment(mandate.id, {
        starts_on: form.starts_on || null,
        ends_on: form.ends_on || null,
        note: form.note.trim(),
      })
      setMandate(updated)
      dispatchToast({ type: 'success', message: 'Mandat mis à jour.' })
      onChanged?.(updated)
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err, 'Modification impossible.') })
    } finally {
      setSaving(false)
    }
  }

  async function revoke() {
    try {
      const updated = await revokeAssignment(mandate.id)
      setMandate(updated)
      dispatchToast({ type: 'success', message: `Mandat de ${mandate.teacher_name} révoqué.` })
      onChanged?.(updated)
    } catch (err) {
      dispatchToast({ type: 'error', message: apiErrorMessage(err, 'Révocation impossible.') })
      throw err
    }
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        eyebrow="Mandat"
        title={mandate ? mandate.role_name : 'Mandat'}
        description={mandate ? mandate.target_label || SCOPE_LEVEL_PHRASES[mandate.scope_level] : null}
        width="md"
        footer={
          editable ? (
            <div className="flex w-full items-center justify-between gap-2">
              <Button variant="ghost" className="text-red-700 dark:text-red-300" onClick={() => setConfirmRevoke(true)} disabled={saving}>
                <Ban size={15} aria-hidden /> Révoquer
              </Button>
              <Button onClick={save} disabled={!dirty || datesInvalid || saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          ) : null
        }
      >
        {error ? (
          <p className="text-[13px] text-red-700 dark:text-red-300">{error}</p>
        ) : !mandate ? (
          <SkeletonLines lines={6} />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Avatar name={mandate.teacher_name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[var(--app-fg)]">{mandate.teacher_name}</p>
                <p className="font-mono text-[11.5px] text-[var(--app-muted)]">{mandate.teacher_matricule}</p>
              </div>
              {status ? <StatusPill tone={status.tone}>{status.label}</StatusPill> : null}
            </div>

            <dl className="divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
              <Row label="Rôle">{mandate.role_name}</Row>
              <Row label="Périmètre">{mandate.target_label || 'Institution'}</Row>
              <Row label="Période">{formatPeriod(mandate.starts_on, mandate.ends_on)}</Row>
              <Row label="Nommé le">{formatDate(mandate.created_at)}</Row>
              {mandate.revoked_at ? <Row label="Révoqué le">{formatDate(mandate.revoked_at)}</Row> : null}
              {mandate.note && !editable ? <Row label="Note">{mandate.note}</Row> : null}
            </dl>

            {editable ? (
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--app-fg)]">
                  <CalendarClock size={15} className="text-[var(--app-muted)]" aria-hidden /> Période et note
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Début">
                    <Input type="date" value={form.starts_on} onChange={(e) => setForm((f) => ({ ...f, starts_on: e.target.value }))} />
                  </Field>
                  <Field label="Fin" error={datesInvalid ? 'La fin précède le début.' : null}>
                    <Input type="date" value={form.ends_on} min={form.starts_on || undefined} onChange={(e) => setForm((f) => ({ ...f, ends_on: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Note" className="mt-3">
                  <Input value={form.note} maxLength={255} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="—" />
                </Field>
                <p className="mt-3 text-[12px] text-[var(--app-muted)]">
                  Pour mettre fin au mandat à une date précise, renseignez la fin ; « Révoquer » y met fin immédiatement.
                </p>
              </section>
            ) : null}
          </div>
        )}
      </Drawer>
      <ConfirmModal
        open={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        title="Révoquer ce mandat ?"
        message={mandate ? `${mandate.teacher_name} perdra immédiatement les droits de « ${mandate.role_name} »${mandate.target_label ? ` sur ${mandate.target_label}` : ''}. Le mandat reste dans l’historique.` : ''}
        confirmLabel="Révoquer"
        onConfirm={revoke}
      />
    </>
  )
}
