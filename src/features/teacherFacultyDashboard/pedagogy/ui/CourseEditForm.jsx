import { useEffect, useMemo, useState } from 'react'

import { fetchLevels } from '@/features/academicYear/api/academicsApi'
import { fetchCourse, patchCourse } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { Spinner } from '@/shared/ui/Spinner'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { cn } from '@/shared/lib/cn'

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]'

function allowedProgramSemestersForLevel(level) {
  if (!level) return []
  if (String(level.cycle || '').toUpperCase() !== 'LICENCE') return [1, 2, 3, 4, 5, 6]
  const byNumber = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
  }
  return byNumber[Number(level.number)] ?? []
}

/**
 * Formulaire d’édition d’un cours (réutilisable modale ou page fiche).
 */
export function CourseEditForm({
  courseId,
  active,
  canStructure,
  semesters,
  teachingUnits,
  onSaved,
  /** Modale : bouton annuler */
  onCancel,
  /** Libellé du bouton principal */
  submitLabel = 'Enregistrer',
}) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [levels, setLevels] = useState([])
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    credits: 0,
    semester: '',
    program_semester: '',
    level: '',
    teaching_unit: '',
  })

  useEffect(() => {
    if (!active || !courseId) return
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const c = await fetchCourse(courseId)
        if (cancelled) return
        setForm({
          code: c.code ?? '',
          name: c.name ?? '',
          description: c.description ?? '',
          credits: c.credits ?? 0,
          semester: c.semester != null ? String(c.semester) : '',
          program_semester:
            c.program_semester != null && c.program_semester !== '' ? String(c.program_semester) : '',
          level: c.level != null ? String(c.level) : '',
          teaching_unit: c.teaching_unit != null ? String(c.teaching_unit) : '',
        })
      } catch (e) {
        if (!cancelled) dispatchToast({ type: 'error', message: e?.message ?? 'Chargement impossible.' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [active, courseId])

  const selectedTeachingUnit = useMemo(
    () => teachingUnits.find((u) => String(u.id) === String(form.teaching_unit)) ?? null,
    [teachingUnits, form.teaching_unit],
  )
  const selectedDepartmentId =
    selectedTeachingUnit?.department != null ? String(selectedTeachingUnit.department) : ''
  const selectedDepartmentCode = selectedTeachingUnit?.department_code ?? ''
  const selectedLevel = useMemo(
    () => levels.find((lv) => String(lv.id) === String(form.level)) ?? null,
    [levels, form.level],
  )
  const availableProgramSemesters = useMemo(
    () => allowedProgramSemestersForLevel(selectedLevel),
    [selectedLevel],
  )

  useEffect(() => {
    if (!active || !selectedDepartmentId) {
      setLevels([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const lv = await fetchLevels({ department: selectedDepartmentId })
        if (!cancelled) setLevels(lv)
      } catch {
        if (!cancelled) setLevels([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [active, selectedDepartmentId])

  useEffect(() => {
    if (form.program_semester === '') return
    const current = Number(form.program_semester)
    if (!availableProgramSemesters.includes(current)) {
      setForm((f) => ({ ...f, program_semester: '' }))
    }
  }, [availableProgramSemesters, form.program_semester])

  const submit = async (e) => {
    e.preventDefault()
    if (!canStructure || !courseId) return
    setSaving(true)
    try {
      await patchCourse(courseId, {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description,
        credits: Number(form.credits) || 0,
        semester: Number(form.semester),
        program_semester:
          form.program_semester === '' || form.program_semester == null ? null : Number(form.program_semester),
        level: Number(form.level),
        teaching_unit: Number(form.teaching_unit),
      })
      dispatchToast({ type: 'success', message: 'Cours enregistré.' })
      onSaved?.()
    } catch (err) {
      const d = err?.response?.data
      const msg =
        typeof d?.detail === 'string'
          ? d.detail
          : d && typeof d === 'object'
            ? JSON.stringify(d)
            : err?.message ?? 'Erreur.'
      dispatchToast({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  return (
    <form className="space-y-3" onSubmit={submit}>
      <Field label="Code">
        <Input
          className={inputCls}
          value={form.code}
          readOnly={!canStructure}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
        />
      </Field>
      <Field label="Intitulé">
        <Input
          className={inputCls}
          value={form.name}
          readOnly={!canStructure}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={cn(inputCls, 'min-h-[88px] resize-y')}
          value={form.description}
          readOnly={!canStructure}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </Field>
      <Field label="Crédits">
        <Input
          type="number"
          min={0}
          className={inputCls}
          value={form.credits === '' || form.credits === null ? '' : String(form.credits)}
          readOnly={!canStructure}
          onChange={(e) =>
            setForm((f) => ({ ...f, credits: e.target.value === '' ? '' : Number(e.target.value) }))
          }
        />
      </Field>
      <Field label="Département (via UE)">
        <Input className={inputCls} value={selectedDepartmentCode || '—'} readOnly />
      </Field>
      <Field label="Semestre calendaire">
        <select
          className={inputCls}
          value={form.semester}
          disabled={!canStructure}
          onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
        >
          <option value="">—</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              S{s.number}
              {s.academic_year_label ? ` (${s.academic_year_label})` : ''}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Semestre programme (parcours)</span>
        <p className="text-[11px] leading-snug text-[var(--app-muted)]">
          Mapping licence strict : L1 (S1–S2), L2 (S3–S4), L3 (S5–S6). Choisissez d’abord un niveau pour voir
          uniquement les valeurs autorisées.
        </p>
        <select
          className={inputCls}
          value={form.program_semester}
          disabled={!canStructure || !selectedLevel}
          onChange={(e) => setForm((f) => ({ ...f, program_semester: e.target.value }))}
        >
          <option value="">— Non renseigné</option>
          {availableProgramSemesters.map((n) => (
            <option key={n} value={String(n)}>
              S{n}
            </option>
          ))}
        </select>
      </div>
      <Field label="Niveau">
        <select
          className={inputCls}
          value={form.level}
          disabled={!canStructure || !selectedDepartmentId}
          onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
        >
          <option value="">—</option>
          {levels.map((lv) => (
            <option key={lv.id} value={lv.id}>
              {lv.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="UE">
        <select
          className={inputCls}
          value={form.teaching_unit}
          disabled={!canStructure}
          onChange={(e) => setForm((f) => ({ ...f, teaching_unit: e.target.value, level: '' }))}
        >
          <option value="">—</option>
          {teachingUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code} — {u.name}
            </option>
          ))}
        </select>
      </Field>
      {!canStructure ? (
        <p className="text-xs text-[var(--app-muted)]">Lecture seule — profil sans droit de modification du référentiel.</p>
      ) : (
        <div className="flex justify-end gap-2 pt-2">
          {onCancel ? (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
              Annuler
            </Button>
          ) : null}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Enregistrement…' : submitLabel}
          </Button>
        </div>
      )}
    </form>
  )
}
