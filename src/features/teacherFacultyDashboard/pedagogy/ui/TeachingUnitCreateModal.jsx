import { useEffect, useState } from 'react'
import { Layers } from 'lucide-react'

import { usePrograms } from '@/features/academicYear/hooks/usePrograms'
import { ProgramSelect } from '@/features/academicYear/ui/ProgramSelect'
import { patchTeachingUnit, postTeachingUnit } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'

import { PedagogyModalFrame } from '@/features/teacherFacultyDashboard/pedagogy/ui/PedagogyModalFrame'

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]'

const empty = { code: '', name: '', total_credits: 6, description: '', program: '' }

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   onCreated: () => Promise<void> | void
 *   mode?: 'create' | 'edit'
 *   unit?: { id: number; code: string; name: string; total_credits?: number; description?: string; program?: number } | null
 * }} props
 */
export function TeachingUnitCreateModal({ open, onClose, onCreated, mode = 'create', unit = null }) {
  const { programs } = usePrograms({ enabled: open })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && unit) {
      setForm({
        code: unit.code ?? '',
        name: unit.name ?? '',
        total_credits: unit.total_credits ?? 6,
        description: unit.description ?? '',
        program: unit.program != null ? String(unit.program) : '',
      })
      return
    }
    setForm(empty)
  }, [open, mode, unit])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        total_credits: Number(form.total_credits) || 6,
        description: form.description,
        program: Number(form.program),
      }
      if (mode === 'edit' && unit?.id) {
        await patchTeachingUnit(unit.id, payload)
        dispatchToast({ type: 'success', message: 'UE mise à jour.' })
      } else {
        await postTeachingUnit(payload)
        dispatchToast({ type: 'success', message: 'UE créée.' })
      }
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
      title={mode === 'edit' ? 'Modifier l’unité d’enseignement' : 'Nouvelle unité d’enseignement'}
      subtitle="Code catalogue, intitulé, volume de crédits et programme (maquette) de rattachement."
      icon={Layers}
      widthClass="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="form-teaching-unit" variant="primary" disabled={saving}>
            {saving ? 'Enregistrement…' : mode === 'edit' ? 'Enregistrer' : 'Créer l’UE'}
          </Button>
        </div>
      }
    >
      <form id="form-teaching-unit" className="space-y-4" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Code UE">
            <Input className={inputCls} value={form.code} onChange={(e) => setForm((x) => ({ ...x, code: e.target.value }))} required />
          </Field>
          <Field label="Crédits totaux">
            <Input type="number" min={1} className={inputCls} value={form.total_credits} onChange={(e) => setForm((x) => ({ ...x, total_credits: e.target.value }))} required />
          </Field>
        </div>
        <Field label="Intitulé">
          <Input className={inputCls} value={form.name} onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))} required />
        </Field>
        <Field label="Description (optionnel)">
          <textarea className={cn(inputCls, 'min-h-[72px] resize-y')} value={form.description} onChange={(e) => setForm((x) => ({ ...x, description: e.target.value }))} />
        </Field>
        <Field label="Programme">
          <ProgramSelect
            className={inputCls}
            programs={programs}
            value={form.program}
            onChange={(value) => setForm((x) => ({ ...x, program: value }))}
            required
          />
        </Field>
      </form>
    </PedagogyModalFrame>
  )
}
