import { useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'

import { fetchLevels } from '@/features/academicYear/api/academicsApi'
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

const empty = { code: '', name: '', total_credits: 6, description: '', program: '', level: '', semester: '' }

/** Semestres de parcours d'un niveau (licence : L1 → S1/S2, L2 → S3/S4, L3 → S5/S6). */
function semestersFor(level) {
  if (!level) return []
  if (String(level.cycle || '').toUpperCase() !== 'LICENCE') return [1, 2, 3, 4, 5, 6]
  const n = Number(level.number)
  return n >= 1 && n <= 3 ? [2 * n - 1, 2 * n] : []
}

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
        level: unit.level != null ? String(unit.level) : '',
        semester: unit.semester != null ? String(unit.semester) : '',
      })
      return
    }
    setForm(empty)
  }, [open, mode, unit])

  const [levels, setLevels] = useState([])
  useEffect(() => {
    if (!open || !form.program) {
      setLevels([])
      return undefined
    }
    let cancelled = false
    fetchLevels({ program: form.program }, { skipErrorToast: true })
      .then((rows) => !cancelled && setLevels(rows))
      .catch(() => !cancelled && setLevels([]))
    return () => {
      cancelled = true
    }
  }, [open, form.program])
  const selectedLevel = useMemo(() => levels.find((lv) => String(lv.id) === String(form.level)) ?? null, [levels, form.level])
  const semesters = semestersFor(selectedLevel)

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
        level: form.level ? Number(form.level) : null,
        semester: form.semester ? Number(form.semester) : null,
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
      const details = err?.response?.data?.details
      const first = details ? Object.values(details).flat()[0] : null
      dispatchToast({ type: 'error', message: first ?? err?.response?.data?.detail ?? err?.response?.data?.message ?? err?.message ?? 'Erreur.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PedagogyModalFrame
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? 'Modifier l’unité d’enseignement' : 'Nouvelle unité d’enseignement'}
      subtitle="Élément de la maquette de l’année : programme, place dans le parcours (niveau, semestre) et crédits."
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
            onChange={(value) => setForm((x) => ({ ...x, program: value, level: '', semester: '' }))}
            required
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Niveau">
            <select
              className={inputCls}
              value={form.level}
              disabled={!form.program}
              onChange={(e) => {
                const level = levels.find((lv) => String(lv.id) === e.target.value)
                setForm((x) => ({
                  ...x,
                  level: e.target.value,
                  semester: semestersFor(level).includes(Number(x.semester)) ? x.semester : '',
                }))
              }}
            >
              <option value="">{form.program ? 'Choisir un niveau…' : 'Choisir d’abord un programme'}</option>
              {levels.map((lv) => (
                <option key={lv.id} value={lv.id}>
                  {lv.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Semestre">
            <select
              className={inputCls}
              value={form.semester}
              disabled={!selectedLevel}
              onChange={(e) => setForm((x) => ({ ...x, semester: e.target.value }))}
            >
              <option value="">{selectedLevel ? 'Choisir un semestre…' : '—'}</option>
              {semesters.map((n) => (
                <option key={n} value={n}>
                  S{n}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-[11.5px] leading-relaxed text-[var(--app-muted)]">
          Les cours de l’UE prennent son niveau et son semestre ; le module (M1 ou M2) en découle.
        </p>
      </form>
    </PedagogyModalFrame>
  )
}
