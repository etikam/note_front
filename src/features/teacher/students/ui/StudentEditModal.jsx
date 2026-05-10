import { useEffect, useId, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, Loader2, Pencil, User, X } from 'lucide-react'

import { fetchCohorts, fetchDepartments, fetchLevels } from '@/features/academicYear/api/academicsApi'
import { patchStudentDetail } from '@/features/teacher/students/api/studentsApi'
import { apiDateToIsoField } from '@/shared/lib/datesFr'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { DateInputFr } from '@/shared/ui/DateInputFr'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'EXCLUDED', label: 'Exclu' },
  { value: 'COMPLETED', label: 'Terminé' },
]

const ROLE_OPTIONS = [
  { value: 'ordinary', label: 'Étudiant' },
  { value: 'promotion_head', label: 'Chef de promotion' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Non renseigné' },
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Féminin' },
]

const inputClass = cn(
  'w-full rounded-xl border px-3 py-2.5 text-sm',
  'bg-white dark:bg-[var(--app-elevated)] border-zinc-200 dark:border-[var(--app-border)]',
  'text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500',
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400',
)

const labelClass = 'block text-xs font-medium text-[var(--app-muted)] mb-1.5'

function initialsFromStudent(student) {
  const a = `${student?.first_name?.[0] ?? ''}${student?.last_name?.[0] ?? ''}`.trim()
  return a ? a.toUpperCase() : '?'
}

/**
 * Modale d’édition du dossier étudiant (directeur des études / directeur général — API protégée).
 */
export function StudentEditModal({ open, onClose, student, onSaved }) {
  const titleId = useId()
  const descId = useId()

  const [departments, setDepartments] = useState([])
  const [cohorts, setCohorts] = useState([])
  const [levels, setLevels] = useState([])
  const [departmentId, setDepartmentId] = useState('')
  const [metaLoading, setMetaLoading] = useState(false)
  const [levelsLoading, setLevelsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [form, setForm] = useState(() => emptyForm())

  const studentLabel = useMemo(
    () =>
      student ? `${student.first_name} ${student.last_name} · ${student.matricule}` : '',
    [student],
  )

  /** Si le niveau courant n’est pas dans la liste (ex. changement de filtre), on garde l’option affichée. */
  const levelOptions = useMemo(() => {
    if (!form.level_id) return levels
    const idStr = String(form.level_id)
    const found = levels.some((l) => String(l.id) === idStr)
    if (found || !student?.level_name) return levels
    const id = Number(form.level_id)
    if (!Number.isFinite(id)) return levels
    return [{ id, name: student.level_name, cycle: '', number: null }, ...levels]
  }, [levels, form.level_id, student?.level_name])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /** Chargement départements + cohortes à l’ouverture */
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setMetaLoading(true)
    setFormError('')
    setFieldErrors({})
    ;(async () => {
      try {
        const [d, c] = await Promise.all([fetchDepartments(), fetchCohorts()])
        if (!cancelled) {
          setDepartments(d)
          setCohorts(c)
        }
      } catch {
        if (!cancelled) {
          setDepartments([])
          setCohorts([])
          setFormError('Impossible de charger les listes (réseau ou accès).')
        }
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  /** Réinitialiser le formulaire depuis la fiche */
  useEffect(() => {
    if (!open || !student) return
    setForm({
      first_name: student.first_name ?? '',
      last_name: student.last_name ?? '',
      matricule: student.matricule ?? '',
      INE: student.INE ?? '',
      gender: student.gender ?? '',
      birth_date: apiDateToIsoField(student.birth_date),
      birth_place: student.birth_place ?? '',
      phone: student.phone ?? '',
      dad_name: student.dad_name ?? '',
      mum_name: student.mum_name ?? '',
      department_text: student.department_text ?? '',
      bio: student.bio ?? '',
      status: student.status ?? 'INACTIVE',
      student_role: student.student_role ?? 'ordinary',
      level_id: student.level_id != null ? String(student.level_id) : '',
      cohorte_id: student.cohorte?.id != null ? String(student.cohorte.id) : '',
      email: student.email ?? '',
    })
  }, [open, student])

  /** Département dérivé du code sur la fiche */
  useEffect(() => {
    if (!open || !student || !departments.length) return
    const dept = departments.find((d) => d.code === student.department_code)
    setDepartmentId(dept ? String(dept.id) : '')
  }, [open, student, departments])

  /** Niveaux selon département sélectionné */
  useEffect(() => {
    if (!open || !departmentId) {
      setLevels([])
      return
    }
    let cancelled = false
    setLevelsLoading(true)
    ;(async () => {
      try {
        const list = await fetchLevels({ department: departmentId })
        if (!cancelled) setLevels(list)
      } catch {
        if (!cancelled) setLevels([])
      } finally {
        if (!cancelled) setLevelsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, departmentId])

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
    setFieldErrors((e) => {
      if (!e[name]) return e
      const next = { ...e }
      delete next[name]
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!student?.id) return
    setSubmitting(true)
    setFormError('')
    setFieldErrors({})
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      matricule: form.matricule.trim(),
      INE: form.INE.trim(),
      gender: form.gender || '',
      birth_date: form.birth_date.trim() || null,
      birth_place: form.birth_place.trim(),
      phone: form.phone.trim(),
      dad_name: form.dad_name.trim(),
      mum_name: form.mum_name.trim(),
      department_text: form.department_text.trim(),
      bio: form.bio.trim(),
      status: form.status,
      student_role: form.student_role,
      level_id: form.level_id === '' ? null : Number(form.level_id),
      cohorte_id: form.cohorte_id === '' ? null : Number(form.cohorte_id),
      email: form.email.trim(),
    }
    try {
      await patchStudentDetail(student.id, payload)
      dispatchToast({
        type: 'success',
        message: `Fiche mise à jour — matricule ${payload.matricule}.`,
      })
      if (typeof onSaved === 'function') await onSaved()
      onClose()
    } catch (err) {
      const fe = err?.fieldErrors ?? {}
      if (Object.keys(fe).length) setFieldErrors(fe)
      setFormError(err?.message ?? 'Enregistrement impossible.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open || !student) return null

  function err(key) {
    return fieldErrors[key] ? (
      <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
        {fieldErrors[key]}
      </p>
    ) : null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-[2px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative w-full max-w-3xl max-h-[min(90vh,920px)] flex flex-col rounded-2xl border shadow-2xl',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-3 border-b border-[var(--app-border)]">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600 dark:text-brand-400 ring-1 ring-brand-600/20">
              <Pencil size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                Modifier le dossier étudiant
              </h2>
              <p id={descId} className="text-sm text-[var(--app-muted)] truncate">
                {studentLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[var(--app-nav-hover)] dark:text-zinc-400 transition-colors shrink-0"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-6">
            {formError ? (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {formError}
              </div>
            ) : null}

            {metaLoading ? (
              <div className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
                <Loader2 className="animate-spin" size={18} aria-hidden />
                Chargement des référentiels…
              </div>
            ) : null}

            <section className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] p-4 sm:p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--app-fg)] mb-4">
                <User size={17} strokeWidth={2} aria-hidden className="text-brand-600 dark:text-brand-400" />
                Identité
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="se-first">
                    Prénom
                  </label>
                  <input
                    id="se-first"
                    className={inputClass}
                    value={form.first_name}
                    onChange={(e) => setField('first_name', e.target.value)}
                    autoComplete="given-name"
                  />
                  {err('first_name')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-last">
                    Nom
                  </label>
                  <input
                    id="se-last"
                    className={inputClass}
                    value={form.last_name}
                    onChange={(e) => setField('last_name', e.target.value)}
                    autoComplete="family-name"
                  />
                  {err('last_name')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-mat">
                    Matricule
                  </label>
                  <input
                    id="se-mat"
                    className={inputClass}
                    value={form.matricule}
                    onChange={(e) => setField('matricule', e.target.value)}
                    autoComplete="off"
                  />
                  {err('matricule')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-ine">
                    INE
                  </label>
                  <input
                    id="se-ine"
                    className={inputClass}
                    value={form.INE}
                    onChange={(e) => setField('INE', e.target.value)}
                    autoComplete="off"
                  />
                  {err('INE')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-gender">
                    Genre
                  </label>
                  <select
                    id="se-gender"
                    className={inputClass}
                    value={form.gender}
                    onChange={(e) => setField('gender', e.target.value)}
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value || '_unset'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {err('gender')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-birth">
                    Date de naissance
                  </label>
                  <DateInputFr
                    id="se-birth"
                    className={inputClass}
                    autoComplete="bday"
                    value={form.birth_date}
                    onChange={(v) => setField('birth_date', v)}
                    aria-invalid={Boolean(fieldErrors.birth_date)}
                  />
                  {err('birth_date')}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="se-birthp">
                    Lieu de naissance
                  </label>
                  <input
                    id="se-birthp"
                    className={inputClass}
                    value={form.birth_place}
                    onChange={(e) => setField('birth_place', e.target.value)}
                  />
                  {err('birth_place')}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-[var(--app-fg)] mb-4">Contact & compte</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="se-email">
                    Adresse e-mail (compte)
                  </label>
                  <input
                    id="se-email"
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    autoComplete="email"
                    placeholder="email@exemple.fr"
                  />
                  {err('email')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-phone">
                    Téléphone
                  </label>
                  <input
                    id="se-phone"
                    type="tel"
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    autoComplete="tel"
                  />
                  {err('phone')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-dad">
                    Contact — père / tuteur
                  </label>
                  <input
                    id="se-dad"
                    className={inputClass}
                    value={form.dad_name}
                    onChange={(e) => setField('dad_name', e.target.value)}
                  />
                  {err('dad_name')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-mum">
                    Contact — mère / tutrice
                  </label>
                  <input
                    id="se-mum"
                    className={inputClass}
                    value={form.mum_name}
                    onChange={(e) => setField('mum_name', e.target.value)}
                  />
                  {err('mum_name')}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] p-4 sm:p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--app-fg)] mb-4">
                <GraduationCap size={17} strokeWidth={2} aria-hidden className="text-secondary-500" />
                Scolarité
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="se-dept">
                    Département
                  </label>
                  <select
                    id="se-dept"
                    className={inputClass}
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value)
                      setField('level_id', '')
                    }}
                  >
                    <option value="">— Choisir —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={String(d.id)}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-level">
                    Niveau
                  </label>
                  <select
                    id="se-level"
                    className={cn(inputClass, levelsLoading && 'opacity-60')}
                    value={form.level_id}
                    onChange={(e) => setField('level_id', e.target.value)}
                    disabled={!departmentId || levelsLoading}
                  >
                    <option value="">
                      {levelsLoading ? 'Chargement…' : departmentId ? '— Choisir —' : 'Choisissez un département'}
                    </option>
                    {levelOptions.map((lv) => (
                      <option key={lv.id} value={String(lv.id)}>
                        {lv.name ?? `${lv.cycle} ${lv.number}`}
                      </option>
                    ))}
                  </select>
                  {err('level_id')}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="se-cohort">
                    Cohorte
                  </label>
                  <select
                    id="se-cohort"
                    className={inputClass}
                    value={form.cohorte_id}
                    onChange={(e) => setField('cohorte_id', e.target.value)}
                  >
                    <option value="">— Aucune —</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {c.label ?? `Promo ${c.promotion_number} · ${c.entry_academic_year_year ?? ''}`}
                      </option>
                    ))}
                  </select>
                  {err('cohorte_id')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-status">
                    Statut administratif
                  </label>
                  <select
                    id="se-status"
                    className={inputClass}
                    value={form.status}
                    onChange={(e) => setField('status', e.target.value)}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {err('status')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="se-role">
                    Rôle au sein de la promotion
                  </label>
                  <select
                    id="se-role"
                    className={inputClass}
                    value={form.student_role}
                    onChange={(e) => setField('student_role', e.target.value)}
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {err('student_role')}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="se-dept-text">
                    Département (texte libre)
                  </label>
                  <input
                    id="se-dept-text"
                    className={inputClass}
                    value={form.department_text}
                    onChange={(e) => setField('department_text', e.target.value)}
                  />
                  {err('department_text')}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="se-bio">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={14} aria-hidden />
                      Biographie / remarques
                    </span>
                  </label>
                  <textarea
                    id="se-bio"
                    rows={3}
                    className={cn(inputClass, 'resize-y min-h-[4.5rem]')}
                    value={form.bio}
                    onChange={(e) => setField('bio', e.target.value)}
                    placeholder="Informations complémentaires visibles côté administratif…"
                  />
                  {err('bio')}
                </div>
              </div>
            </section>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--app-border)] px-5 sm:px-6 py-4">
            <div className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
              {!student.photo_url ? (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/15 text-[10px] font-bold text-brand-700 dark:text-brand-300"
                  aria-hidden
                >
                  {initialsFromStudent(student)}
                </span>
              ) : (
                <img
                  src={student.photo_url}
                  alt=""
                  className="h-8 w-8 rounded-lg object-cover ring-1 ring-[var(--app-border)]"
                />
              )}
              <span>Les modifications sont tracées côté serveur.</span>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={submitting || metaLoading}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} aria-hidden />
                    Enregistrement…
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function emptyForm() {
  return {
    first_name: '',
    last_name: '',
    matricule: '',
    INE: '',
    gender: '',
    birth_date: '',
    birth_place: '',
    phone: '',
    dad_name: '',
    mum_name: '',
    department_text: '',
    bio: '',
    status: 'INACTIVE',
    student_role: 'ordinary',
    level_id: '',
    cohorte_id: '',
    email: '',
  }
}
