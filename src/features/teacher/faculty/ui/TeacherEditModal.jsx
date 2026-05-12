import { useEffect, useId, useMemo, useState } from 'react'
import { BookOpen, GraduationCap, Loader2, Pencil, User, X } from 'lucide-react'

import { fetchTeacherGrades, patchTeacher } from '@/features/teacher/faculty/api/teachersApi'
import { TEACHER_ROLE_OPTIONS } from '@/features/teacher/faculty/facultyList.constants'
import { apiDateToIsoField } from '@/shared/lib/datesFr'
import { cn } from '@/shared/lib/cn'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { Button } from '@/shared/ui/Button'
import { DateInputFr } from '@/shared/ui/DateInputFr'

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

function emptyFormFromTeacher(teacher) {
  if (!teacher) {
    return {
      matricule: '',
      first_name: '',
      last_name: '',
      email: '',
      gender: '',
      phone: '',
      birth_date: '',
      teacher_role: 'teacher',
      grade: '',
      years_of_experience: '',
      has_phd: false,
      hire_date: '',
      bio: '',
    }
  }
  return {
    matricule: teacher.matricule ?? '',
    first_name: teacher.first_name ?? '',
    last_name: teacher.last_name ?? '',
    email: teacher.email ?? '',
    gender: teacher.gender ?? '',
    phone: teacher.phone ?? '',
    birth_date: apiDateToIsoField(teacher.birth_date),
    teacher_role: teacher.teacher_role ?? 'teacher',
    grade: teacher.grade ?? '',
    years_of_experience:
      teacher.years_of_experience != null && teacher.years_of_experience !== ''
        ? String(teacher.years_of_experience)
        : '',
    has_phd: Boolean(teacher.has_phd),
    hire_date: apiDateToIsoField(teacher.hire_date),
    bio: teacher.bio ?? '',
  }
}

function buildPatchPayload(form) {
  const payload = {
    matricule: form.matricule.trim(),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    teacher_role: form.teacher_role,
    has_phd: Boolean(form.has_phd),
  }
  payload.gender = form.gender || ''
  payload.grade = form.grade ? String(form.grade).trim() : ''
  if (form.hire_date?.trim()) payload.hire_date = form.hire_date.trim()
  else payload.hire_date = null
  payload.bio = form.bio.trim()
  payload.phone = form.phone.trim()
  if (form.birth_date?.trim()) payload.birth_date = form.birth_date.trim()
  else payload.birth_date = null
  if (form.years_of_experience !== '' && form.years_of_experience != null) {
    const n = Number(form.years_of_experience)
    if (!Number.isNaN(n)) payload.years_of_experience = Math.max(0, n)
  } else {
    payload.years_of_experience = 0
  }
  return payload
}

/**
 * Modale d’édition de la fiche enseignant (provisionnement — même esprit que `StudentEditModal`).
 */
export function TeacherEditModal({ open, onClose, teacher, onSaved }) {
  const titleId = useId()
  const descId = useId()

  const [teacherGrades, setTeacherGrades] = useState([])
  const [gradesLoading, setGradesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState(() => emptyFormFromTeacher(null))

  const teacherLabel = useMemo(
    () => (teacher ? `${teacher.first_name} ${teacher.last_name} · ${teacher.matricule}` : ''),
    [teacher],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, submitting])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setGradesLoading(true)
    ;(async () => {
      try {
        const rows = await fetchTeacherGrades()
        if (!cancelled) setTeacherGrades(Array.isArray(rows) ? rows : [])
      } catch {
        if (!cancelled) setTeacherGrades([])
      } finally {
        if (!cancelled) setGradesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open || !teacher) return
    setForm(emptyFormFromTeacher(teacher))
    setFormError('')
    setFieldErrors({})
  }, [open, teacher])

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
    if (!teacher?.id) return
    setSubmitting(true)
    setFormError('')
    setFieldErrors({})
    const payload = buildPatchPayload(form)
    try {
      await patchTeacher(teacher.id, payload)
      dispatchToast({
        type: 'success',
        message: `Fiche mise à jour — ${payload.first_name} ${payload.last_name}.`,
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

  if (!open || !teacher) return null

  function err(key) {
    return fieldErrors[key] ? (
      <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
        {fieldErrors[key]}
      </p>
    ) : null
  }

  const inputErr = (name) => cn(fieldErrors[name] ? 'border-red-500 ring-2 ring-red-500/25 dark:border-red-600' : '')

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-[2px]"
      role="presentation"
      onClick={() => !submitting && onClose()}
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
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--app-border)] px-5 pb-3 pt-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-600 ring-1 ring-brand-600/20 dark:text-brand-400">
              <Pencil size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                Modifier la fiche enseignant
              </h2>
              <p id={descId} className="truncate text-sm text-[var(--app-muted)]">
                {teacherLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-[var(--app-nav-hover)]"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4 sm:px-6">
            {formError ? (
              <div
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {formError}
              </div>
            ) : null}

            <section className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] p-4 sm:p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--app-fg)]">
                <User size={17} strokeWidth={2} aria-hidden className="text-brand-600 dark:text-brand-400" />
                Identité & contact
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="te-mat">
                    Matricule
                  </label>
                  <input
                    id="te-mat"
                    className={cn(inputClass, inputErr('matricule'))}
                    value={form.matricule}
                    onChange={(e) => setField('matricule', e.target.value)}
                    required
                    autoComplete="off"
                  />
                  {err('matricule')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="te-email">
                    Email professionnel
                  </label>
                  <input
                    id="te-email"
                    type="email"
                    className={cn(inputClass, inputErr('email'))}
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    required
                    autoComplete="email"
                  />
                  {err('email')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="te-fn">
                    Prénom
                  </label>
                  <input
                    id="te-fn"
                    className={cn(inputClass, inputErr('first_name'))}
                    value={form.first_name}
                    onChange={(e) => setField('first_name', e.target.value)}
                    required
                    autoComplete="given-name"
                  />
                  {err('first_name')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="te-ln">
                    Nom
                  </label>
                  <input
                    id="te-ln"
                    className={cn(inputClass, inputErr('last_name'))}
                    value={form.last_name}
                    onChange={(e) => setField('last_name', e.target.value)}
                    required
                    autoComplete="family-name"
                  />
                  {err('last_name')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="te-gen">
                    Genre
                  </label>
                  <select
                    id="te-gen"
                    className={cn(inputClass, inputErr('gender'))}
                    value={form.gender}
                    onChange={(e) => setField('gender', e.target.value)}
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value || 'nr'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {err('gender')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="te-phone">
                    Téléphone
                  </label>
                  <input
                    id="te-phone"
                    type="tel"
                    className={cn(inputClass, inputErr('phone'))}
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    autoComplete="tel"
                    placeholder="+225…"
                  />
                  {err('phone')}
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="te-bd">
                    Date de naissance
                  </label>
                  <DateInputFr
                    id="te-bd"
                    name="birth_date"
                    value={form.birth_date}
                    onChange={(v) => setField('birth_date', v)}
                    className={cn(inputClass, inputErr('birth_date'))}
                  />
                  {err('birth_date')}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] p-4 sm:p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--app-fg)]">
                <GraduationCap size={17} strokeWidth={2} aria-hidden className="text-brand-600 dark:text-brand-400" />
                Fonction & carrière
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="te-role">
                    Rôle institutionnel
                  </label>
                  <select
                    id="te-role"
                    className={cn(inputClass, inputErr('teacher_role'))}
                    value={form.teacher_role}
                    onChange={(e) => setField('teacher_role', e.target.value)}
                  >
                    {TEACHER_ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  {err('teacher_role')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="te-grade">
                    Grade (titre)
                  </label>
                  <select
                    id="te-grade"
                    className={cn(inputClass, inputErr('grade'))}
                    value={form.grade}
                    onChange={(e) => setField('grade', e.target.value)}
                    disabled={gradesLoading}
                  >
                    <option value="">{gradesLoading ? 'Chargement…' : 'Non renseigné'}</option>
                    {teacherGrades.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  {err('grade')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="te-yoe">
                    Années d&apos;expérience
                  </label>
                  <input
                    id="te-yoe"
                    type="number"
                    min={0}
                    step={1}
                    className={cn(inputClass, inputErr('years_of_experience'))}
                    value={form.years_of_experience}
                    onChange={(e) => setField('years_of_experience', e.target.value)}
                    placeholder="0"
                  />
                  {err('years_of_experience')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="te-hd">
                    Date d&apos;embauche
                  </label>
                  <DateInputFr
                    id="te-hd"
                    name="hire_date"
                    value={form.hire_date}
                    onChange={(v) => setField('hire_date', v)}
                    className={cn(inputClass, inputErr('hire_date'))}
                  />
                  {err('hire_date')}
                </div>
                <div className="sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300 dark:border-[var(--app-border)]"
                      checked={form.has_phd}
                      onChange={(e) => setField('has_phd', e.target.checked)}
                    />
                    <span>Titulaire d&apos;un doctorat</span>
                  </label>
                  {err('has_phd')}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_100%,transparent)] p-4 sm:p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--app-fg)]">
                <BookOpen size={17} strokeWidth={2} aria-hidden className="text-brand-600 dark:text-brand-400" />
                Présentation
              </h3>
              <div>
                <label className={labelClass} htmlFor="te-bio">
                  Biographie / parcours (optionnel)
                </label>
                <textarea
                  id="te-bio"
                  rows={4}
                  className={cn(inputClass, 'min-h-[5rem] resize-y', inputErr('bio'))}
                  value={form.bio}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Parcours académique, spécialités, responsabilités…"
                />
                {err('bio')}
              </div>
            </section>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--app-border)] px-5 py-4 sm:px-6">
            <Button type="button" variant="ghost" onClick={() => !submitting && onClose()} disabled={submitting}>
              Annuler
            </Button>
              <Button type="submit" variant="primary" disabled={submitting || gradesLoading}>
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
        </form>
      </div>
    </div>
  )
}
