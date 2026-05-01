import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

import { fetchLevels } from '@/features/academicYear/api/academicsApi'
import { postTeachingUnitCourseOffering } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyApi'
import { Button } from '@/shared/ui/Button'
import { Field, Input } from '@/shared/ui/Field'
import { dispatchToast } from '@/shared/notifications/toastBridge'

const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]'

/** Crédits saisis dans les champs (chaînes autorisées pour l’input contrôlé). */
function rowCreditsToNumber(value) {
  if (value === '' || value == null) return 0
  const n = Number.parseInt(String(value).trim(), 10)
  return Number.isFinite(n) ? n : 0
}

function sumRowCredits(rows) {
  return rows.reduce((a, r) => a + rowCreditsToNumber(r.credits), 0)
}

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

function formatApiError(data) {
  if (!data) return null
  if (typeof data === 'string') return data
  if (typeof data.detail === 'string') return data.detail

  const lines = []
  const walk = (node, path = []) => {
    if (node == null) return
    if (typeof node === 'string') {
      const prefix = path.length ? `${path.join(' > ')}: ` : ''
      lines.push(`${prefix}${node}`)
      return
    }
    if (Array.isArray(node)) {
      node.forEach((item, idx) => {
        const step = Number.isInteger(idx) ? `Ligne ${idx + 1}` : String(idx)
        walk(item, [...path, step])
      })
      return
    }
    if (typeof node === 'object') {
      Object.entries(node).forEach(([key, value]) => {
        const label =
          key === 'courses'
            ? 'Cours'
            : key === 'code'
              ? 'Code'
              : key === 'name'
                ? 'Intitulé'
                : key === 'program_semester'
                  ? 'Sem. programme'
                  : key === 'credits'
                    ? 'Crédits'
                    : key
        walk(value, [...path, label])
      })
    }
  }
  walk(data)
  return lines.length ? lines.join(' · ') : null
}

/**
 * Saisie semestre / niveau et matières pour une UE (département déduit de l'UE).
 * @param {{
 *   formId?: string
 *   semesters: Array<{ id: number; number: number; start_date?: string; end_date?: string; academic_year_label?: string }>
 *   unitsForOfferSelect: Array<{ id: number; code: string; name: string; total_credits?: number; department?: number; department_code?: string }>
 *   existingCourses?: Array<{ id: string; semester?: number; department?: number; level?: number; credits?: number }>
 *   forcedUeId?: number | null
 *   active: boolean
 *   onSuccess?: () => void | Promise<void>
 *   onStateChange?: (s: { submitDisabled: boolean; saving: boolean }) => void
 * }} props
 */
export function CourseOfferingFormBlock({
  formId = 'form-offering',
  semesters,
  unitsForOfferSelect,
  existingCourses = [],
  forcedUeId = null,
  active,
  onSuccess,
  onStateChange,
}) {
  const rowIdRef = useRef(0)
  const makeRow = useCallback((credits = '3') => {
    rowIdRef.current += 1
    return { id: rowIdRef.current, code: '', name: '', credits: String(credits), program_semester: '' }
  }, [])

  const [saving, setSaving] = useState(false)
  const [offerUeId, setOfferUeId] = useState(() => (forcedUeId != null ? String(forcedUeId) : ''))
  const [offer, setOffer] = useState({
    semester: '',
    level: '',
    replace_existing: false,
    rows: [makeRow('3'), makeRow('3')],
  })
  const [levels, setLevels] = useState([])

  useEffect(() => {
    if (!active) return
    const ueInit = forcedUeId != null ? String(forcedUeId) : ''
    setOfferUeId(ueInit)
    rowIdRef.current = 0
    setOffer({
      semester: '',
      level: '',
      replace_existing: false,
      rows: [makeRow('3'), makeRow('3')],
    })
  }, [active, forcedUeId, makeRow])

  const selectedUe = useMemo(
    () => unitsForOfferSelect.find((u) => String(u.id) === String(offerUeId)),
    [unitsForOfferSelect, offerUeId],
  )
  const selectedDepartmentId = selectedUe?.department != null ? Number(selectedUe.department) : null
  const selectedDepartmentCode = selectedUe?.department_code ?? null
  const selectedLevel = useMemo(
    () => levels.find((lv) => String(lv.id) === String(offer.level)) ?? null,
    [levels, offer.level],
  )
  const availableProgramSemesters = useMemo(
    () => allowedProgramSemestersForLevel(selectedLevel),
    [selectedLevel],
  )

  useEffect(() => {
    if (!selectedDepartmentId) {
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
  }, [selectedDepartmentId])

  useEffect(() => {
    if (!offer.semester || semesters.length === 0) return
    const ok = semesters.some((s) => String(s.id) === String(offer.semester))
    if (!ok) setOffer((o) => ({ ...o, semester: '' }))
  }, [semesters, offer.semester])

  useEffect(() => {
    if (!selectedLevel) return
    setOffer((o) => ({
      ...o,
      rows: o.rows.map((r) => {
        if (r.program_semester === '' || r.program_semester == null) return r
        return availableProgramSemesters.includes(Number(r.program_semester))
          ? r
          : { ...r, program_semester: '' }
      }),
    }))
  }, [availableProgramSemesters, selectedLevel])

  const targetCredits = selectedUe?.total_credits ?? 0
  const sumOffer = sumRowCredits(offer.rows)
  const offerCreditsOk = Boolean(selectedUe && targetCredits > 0 && sumOffer === targetCredits)
  const slotKey = useMemo(() => {
    if (!offer.semester || !selectedDepartmentId || !offer.level) return null
    return `${offer.semester}|${selectedDepartmentId}|${offer.level}`
  }, [offer.semester, selectedDepartmentId, offer.level])
  const existingSlot = useMemo(() => {
    if (!slotKey) return []
    const sem = Number(offer.semester)
    const dep = Number(selectedDepartmentId)
    const lvl = Number(offer.level)
    return (existingCourses ?? []).filter(
      (c) => Number(c.semester) === sem && Number(c.department) === dep && Number(c.level) === lvl,
    )
  }, [existingCourses, slotKey, offer.semester, selectedDepartmentId, offer.level])
  const existingSlotCredits = useMemo(
    () => existingSlot.reduce((acc, c) => acc + (Number(c.credits) || 0), 0),
    [existingSlot],
  )
  const hasExistingSlot = existingSlot.length > 0
  const offerCreditsWarning = (() => {
    if (!selectedUe || targetCredits <= 0) return null
    if (sumOffer === targetCredits) return null
    if (sumOffer < targetCredits) {
      const d = targetCredits - sumOffer
      return `Il manque ${d} ${d === 1 ? 'crédit' : 'crédits'} pour atteindre les ${targetCredits} cr. requis pour cette saisie.`
    }
    const d = sumOffer - targetCredits
    return `Dépassement de ${d} ${d === 1 ? 'crédit' : 'crédits'} par rapport aux ${targetCredits} cr. requis.`
  })()

  const addOfferRow = useCallback(() => {
    setOffer((o) => ({ ...o, rows: [...o.rows, makeRow('0')] }))
  }, [makeRow])
  const removeOfferRow = useCallback((rowId) => {
    setOffer((o) => ({ ...o, rows: o.rows.length > 1 ? o.rows.filter((r) => r.id !== rowId) : o.rows }))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!offerUeId) {
      dispatchToast({ type: 'error', message: 'Choisir une unité d’enseignement.' })
      return
    }
    if (!offer.semester || !selectedDepartmentId || !offer.level) {
      dispatchToast({ type: 'error', message: 'Renseignez semestre, UE et niveau.' })
      return
    }
    setSaving(true)
    try {
      await postTeachingUnitCourseOffering(Number(offerUeId), {
        semester: Number(offer.semester),
        level: Number(offer.level),
        replace_existing: offer.replace_existing,
        courses: offer.rows.map((r) => ({
          code: r.code.trim(),
          name: r.name.trim(),
          credits: rowCreditsToNumber(r.credits),
          program_semester: r.program_semester === '' || r.program_semester == null ? null : Number(r.program_semester),
        })),
      })
      dispatchToast({ type: 'success', message: 'Matières enregistrées.' })
      await onSuccess?.()
    } catch (err) {
      const msg = formatApiError(err?.response?.data) || err?.message || 'Erreur.'
      dispatchToast({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  /** Bouton actif sauf pendant l’envoi ; crédits et règles métier vérifiés côté serveur (réponse d’erreur affichée en toast). */
  const submitDisabled = saving
  const hideUeSelect = forcedUeId != null

  useEffect(() => {
    onStateChange?.({ submitDisabled, saving })
  }, [submitDisabled, saving, onStateChange])

  return (
    <form id={formId} className="space-y-4" onSubmit={submit}>

      {!hideUeSelect ? (
        <Field label="Unité d’enseignement">
          <select className={inputCls} value={offerUeId} onChange={(e) => setOfferUeId(e.target.value)} required>
            <option value="">Choisir une UE…</option>
            {unitsForOfferSelect.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.name} ({u.total_credits} cr.)
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field label="Semestre">
          <select
            className={inputCls}
            value={offer.semester}
            onChange={(e) => setOffer((o) => ({ ...o, semester: e.target.value }))}
            disabled={semesters.length === 0}
          >
            <option value="">
              {semesters.length === 0 ? 'Aucun semestre pour l’année…' : 'Choisir un semestre…'}
            </option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                S{s.number}
                {s.start_date && s.end_date ? ` — ${s.start_date} → ${s.end_date}` : ''}
                {s.academic_year_label ? ` (${s.academic_year_label})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Département (dérivé de l’UE)">
          <Input className={inputCls} value={selectedDepartmentCode ?? '—'} readOnly />
        </Field>
        <Field label="Niveau">
          <select
            className={inputCls}
            value={offer.level}
            onChange={(e) => setOffer((o) => ({ ...o, level: e.target.value }))}
            disabled={!selectedDepartmentId}
          >
            <option value="">{selectedDepartmentId ? 'Choisir un niveau…' : 'Choisir d’abord une UE…'}</option>
            {levels.map((lv) => (
              <option key={lv.id} value={lv.id}>
                {lv.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200/90 bg-white/60 px-3 py-2.5 text-xs dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)]">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 text-brand-600"
          checked={offer.replace_existing}
          onChange={(e) => setOffer((o) => ({ ...o, replace_existing: e.target.checked }))}
        />
        <span className="text-zinc-700 dark:text-zinc-300">
          Remplacer les cours existants sur ce créneau (interdit si un enseignant est assigné)
        </span>
      </label>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Matières</p>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400 leading-snug">
          Une ligne = un cours pour <strong>ce</strong> semestre, département de l’UE et niveau. Somme des « Cr. » ={' '}
          <strong className="text-zinc-800 dark:text-zinc-200">{targetCredits || '—'}</strong> cr. (total UE). Pas
          d’addition avec le tableau du haut (autres créneaux).
        </p>

        {selectedUe ? (
          <div className="mb-3 space-y-2 rounded-xl border border-zinc-200/90 bg-zinc-50/50 px-3 py-2.5 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Somme des lignes ci-dessous : <strong>{sumOffer}</strong> cr. — objectif pour cette saisie :{' '}
              <strong>{targetCredits}</strong> cr.
            </p>
            {slotKey && hasExistingSlot ? (
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Déjà enregistrés pour ce créneau : <strong>{existingSlotCredits}</strong> cr. ({existingSlot.length}{' '}
                cours).{' '}
                {offer.replace_existing ? (
                  <span className="text-emerald-700 dark:text-emerald-300">Ils seront remplacés.</span>
                ) : (
                  <span className="text-red-700 dark:text-red-300">Sans “Remplacer”, l’enregistrement sera refusé.</span>
                )}
              </p>
            ) : null}
            {offerCreditsOk ? (
              <p className="text-xs font-medium rounded-lg border-2 border-emerald-600 bg-emerald-100 px-3 py-2 text-emerald-950 shadow-sm dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-100 dark:shadow-none">
                Total atteint.
              </p>
            ) : null}
            {slotKey && hasExistingSlot && !offer.replace_existing ? (
              <p
                role="alert"
                className="text-xs font-medium rounded-lg border-2 border-red-600 bg-red-50 px-3 py-2 text-red-900 shadow-sm dark:border-red-500 dark:bg-red-950/70 dark:text-red-50 dark:shadow-none"
              >
                Cochez “Remplacer” si vous voulez réécrire les cours de ce créneau.
              </p>
            ) : null}
            {offerCreditsWarning ? (
              <p
                role="alert"
                className="text-xs font-medium rounded-lg border-2 border-red-600 bg-red-50 px-3 py-2 text-red-900 shadow-sm dark:border-red-500 dark:bg-red-950/70 dark:text-red-50 dark:shadow-none"
              >
                {offerCreditsWarning}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-white/40 p-3 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
          {offer.rows.map((row, i) => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-3">
                <Field label={i === 0 ? 'Code' : ''}>
                  <Input
                    className={inputCls}
                    value={row.code}
                    onChange={(e) => {
                      const v = e.target.value
                      setOffer((o) => ({
                        ...o,
                        rows: o.rows.map((r) => (r.id === row.id ? { ...r, code: v } : r)),
                      }))
                    }}
                  />
                </Field>
              </div>
              <div className="col-span-12 sm:col-span-4">
                <Field label={i === 0 ? 'Intitulé' : ''}>
                  <Input
                    className={inputCls}
                    value={row.name}
                    onChange={(e) => {
                      const v = e.target.value
                      setOffer((o) => ({
                        ...o,
                        rows: o.rows.map((r) => (r.id === row.id ? { ...r, name: v } : r)),
                      }))
                    }}
                  />
                </Field>
              </div>
              <div className="col-span-6 sm:col-span-2">
                <Field label={i === 0 ? 'Cr.' : ''}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    className={inputCls}
                    value={row.credits}
                    onChange={(e) => {
                      const v = e.target.value
                      setOffer((o) => ({
                        ...o,
                        rows: o.rows.map((r) => (r.id === row.id ? { ...r, credits: v } : r)),
                      }))
                    }}
                  />
                </Field>
              </div>
              <div className="col-span-6 sm:col-span-1">
                <Field label={i === 0 ? 'Sem. prog.' : ''}>
                  <select
                    className={inputCls}
                    value={row.program_semester}
                    disabled={!selectedLevel}
                    onChange={(e) => {
                      const v = e.target.value
                      setOffer((o) => ({
                        ...o,
                        rows: o.rows.map((r) => (r.id === row.id ? { ...r, program_semester: v } : r)),
                      }))
                    }}
                  >
                    <option value="">—</option>
                    {availableProgramSemesters.map((n) => (
                      <option key={n} value={String(n)}>
                        S{n}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="col-span-12 sm:col-span-2 flex justify-end gap-1 pb-1">
                <Button type="button" variant="ghost" size="sm" onClick={addOfferRow} aria-label="Ajouter une ligne">
                  <Plus size={14} />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeOfferRow(row.id)} aria-label="Supprimer la ligne">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  )
}
