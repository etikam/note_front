import { useEffect, useState } from 'react'
import { CalendarDays } from 'lucide-react'

import { postModule } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { DateInputFr } from '@/shared/ui/DateInputFr'
import { dispatchToast } from '@/shared/notifications/toastBridge'

import { PedagogyModalFrame } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyModalFrame'

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]'

const empty = { number: 1, start_date: '', end_date: '' }

/**
 * @param {{ open: boolean; onClose: () => void; academicYearId: number | null; yearLabel?: string; onCreated: () => Promise<void> | void }} props
 */
export function SemesterCreateModal({ open, onClose, academicYearId, yearLabel, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (open) setForm(empty)
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    if (!academicYearId) return
    if (!form.start_date?.trim() || !form.end_date?.trim()) {
      dispatchToast({
        type: 'error',
        message: 'Renseignez la date de début et la date de fin.',
      })
      return
    }
    setSaving(true)
    try {
      await postModule(academicYearId, {
        number: Number(form.number),
        start_date: form.start_date.trim(),
        end_date: form.end_date.trim(),
      })
      dispatchToast({ type: 'success', message: 'Module créé.' })
      await onCreated?.()
      onClose()
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.response?.data?.detail ?? err?.message ?? 'Erreur.' })
    } finally {
      setSaving(false)
    }
  }

  const disabled = !academicYearId

  return (
    <PedagogyModalFrame
      open={open}
      onClose={onClose}
      title="Nouveau module"
      subtitle={
        academicYearId
          ? yearLabel
            ? `Rattaché à l’année « ${yearLabel} ».`
            : 'Rattaché à l’année sélectionnée dans le calendrier.'
          : 'Sélectionnez d’abord une année dans la liste à gauche.'
      }
      icon={CalendarDays}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="form-module" variant="primary" disabled={saving || disabled}>
            {saving ? 'Création…' : 'Créer le module'}
          </Button>
        </div>
      }
    >
      <form id="form-module" className="space-y-4" onSubmit={submit}>
        <Field label="Numéro">
          <select
            className={inputCls}
            value={form.number}
            disabled={disabled}
            onChange={(e) => setForm((x) => ({ ...x, number: Number(e.target.value) }))}
          >
            <option value={1}>Module 1</option>
            <option value={2}>Module 2</option>
          </select>
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Date de début">
            <DateInputFr
              className={inputCls}
              value={form.start_date}
              disabled={disabled}
              onChange={(v) => setForm((x) => ({ ...x, start_date: v }))}
              required
            />
          </Field>
          <Field label="Date de fin">
            <DateInputFr
              className={inputCls}
              value={form.end_date}
              disabled={disabled}
              onChange={(v) => setForm((x) => ({ ...x, end_date: v }))}
              required
            />
          </Field>
        </div>
      </form>
    </PedagogyModalFrame>
  )
}
