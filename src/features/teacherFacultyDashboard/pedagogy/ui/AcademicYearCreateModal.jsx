import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'

import { postAcademicYear } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { DateInputFr } from '@/shared/ui/DateInputFr'
import { dispatchToast } from '@/shared/notifications/toastBridge'

import { PedagogyModalFrame } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyModalFrame'

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]'

const empty = { year: '', start_date: '', end_date: '', is_current: false }

export function AcademicYearCreateModal({ open, onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (open) setForm(empty)
  }, [open])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.start_date?.trim() || !form.end_date?.trim()) {
      dispatchToast({
        type: 'error',
        message: 'Renseignez la date de début et la date de fin.',
      })
      return
    }
    setSaving(true)
    try {
      await postAcademicYear({
        ...form,
        start_date: form.start_date.trim(),
        end_date: form.end_date.trim(),
      })
      dispatchToast({ type: 'success', message: 'Année académique créée.' })
      await onCreated?.()
      onClose()
    } catch (err) {
      dispatchToast({ type: 'error', message: err?.response?.data?.detail ?? err?.message ?? 'Erreur.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PedagogyModalFrame
      open={open}
      onClose={onClose}
      title="Nouvelle année académique"
      subtitle="Libellé, période et option pour définir l’année courante."
      icon={GraduationCap}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="form-academic-year" variant="primary" disabled={saving}>
            {saving ? 'Création…' : 'Créer l’année'}
          </Button>
        </div>
      }
    >
      <form id="form-academic-year" className="space-y-4" onSubmit={submit}>
        <Field label="Libellé (ex. 2026-2027)">
          <Input className={inputCls} value={form.year} onChange={(e) => setForm((x) => ({ ...x, year: e.target.value }))} required />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Date de début">
            <DateInputFr
              className={inputCls}
              value={form.start_date}
              onChange={(v) => setForm((x) => ({ ...x, start_date: v }))}
              required
            />
          </Field>
          <Field label="Date de fin">
            <DateInputFr
              className={inputCls}
              value={form.end_date}
              onChange={(v) => setForm((x) => ({ ...x, end_date: v }))}
              required
            />
          </Field>
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200/90 bg-white/60 px-3 py-2.5 text-sm dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
            checked={form.is_current}
            onChange={(e) => setForm((x) => ({ ...x, is_current: e.target.checked }))}
          />
          <span className="text-zinc-700 dark:text-zinc-300">Définir comme année courante après création</span>
        </label>
      </form>
    </PedagogyModalFrame>
  )
}
