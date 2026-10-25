import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'

import { fetchTeacherGrades, postTeacher } from '@/features/teacher/faculty/api/teachersApi'
import { MandatesHint } from '@/features/teacher/faculty/ui/TeacherMandates'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { DateInputFr } from '@/shared/ui/DateInputFr'
import { Dialog } from '@/shared/ui/Dialog'
import { Field, Input, Select } from '@/shared/ui/Field'

const EMPTY = {
  matricule: '',
  first_name: '',
  last_name: '',
  email: '',
  gender: '',
  phone: '',
  birth_date: '',
  grade: '',
  years_of_experience: '',
  has_phd: false,
  hire_date: '',
  bio: '',
}

function buildPayload(form) {
  const payload = {
    matricule: form.matricule.trim(),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    has_phd: Boolean(form.has_phd),
  }
  if (form.gender) payload.gender = form.gender
  if (form.phone.trim()) payload.phone = form.phone.trim()
  if (form.birth_date?.trim()) payload.birth_date = form.birth_date.trim()
  if (form.grade) payload.grade = form.grade
  if (form.years_of_experience !== '' && !Number.isNaN(Number(form.years_of_experience))) {
    payload.years_of_experience = Number(form.years_of_experience)
  }
  if (form.hire_date?.trim()) payload.hire_date = form.hire_date.trim()
  if (form.bio.trim()) payload.bio = form.bio.trim()
  return payload
}

const ERR = 'border-red-500 ring-2 ring-red-500/20 dark:border-red-600'

function Section({ title, children }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--app-muted)]">{title}</legend>
      {children}
    </fieldset>
  )
}

/** Création d'une fiche enseignant (compte inactif jusqu'à l'activation par l'intéressé). */
export function TeacherCreateDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [grades, setGrades] = useState([])

  useEffect(() => {
    if (!open) return undefined
    setForm(EMPTY)
    setErrors({})
    setError('')
    let cancelled = false
    fetchTeacherGrades()
      .then((rows) => !cancelled && setGrades(Array.isArray(rows) ? rows : []))
      .catch(() => !cancelled && setGrades([]))
    return () => {
      cancelled = true
    }
  }, [open])

  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => {
      if (!e[field]) return e
      const next = { ...e }
      delete next[field]
      return next
    })
  }
  const err = (field) => (errors[field] ? ERR : undefined)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setErrors({})
    try {
      const created = await postTeacher(buildPayload(form))
      onCreated?.(created)
      onClose()
    } catch (ex) {
      setErrors(ex?.fieldErrors && typeof ex.fieldErrors === 'object' ? ex.fieldErrors : {})
      setError(ex?.message?.trim() || 'Création impossible.')
    } finally {
      setSaving(false)
    }
  }

  const ready = form.matricule.trim() && form.first_name.trim() && form.last_name.trim() && form.email.trim()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!saving}
      size="lg"
      icon={UserPlus}
      title="Ajouter un enseignant"
      description="La fiche est créée sans accès : l’enseignant active lui-même son compte avec son e-mail."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button type="submit" form="teacher-create-form" disabled={saving || !ready}>
            {saving ? 'Enregistrement…' : 'Créer la fiche'}
          </Button>
        </>
      }
    >
      <form id="teacher-create-form" onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Section title="Identité et contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Matricule" error={errors.matricule}>
              <Input value={form.matricule} onChange={(e) => set('matricule')(e.target.value)} className={cn('font-mono', err('matricule'))} autoComplete="off" data-autofocus="" />
            </Field>
            <Field label="E-mail professionnel" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} className={err('email')} autoComplete="email" />
            </Field>
            <Field label="Prénom" error={errors.first_name}>
              <Input value={form.first_name} onChange={(e) => set('first_name')(e.target.value)} className={err('first_name')} autoComplete="given-name" />
            </Field>
            <Field label="Nom" error={errors.last_name}>
              <Input value={form.last_name} onChange={(e) => set('last_name')(e.target.value)} className={err('last_name')} autoComplete="family-name" />
            </Field>
            <Field label="Sexe" error={errors.gender}>
              <Select value={form.gender} onChange={(e) => set('gender')(e.target.value)} className={err('gender')}>
                <option value="">Non renseigné</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </Select>
            </Field>
            <Field label="Téléphone" error={errors.phone}>
              <Input type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} placeholder="+224…" className={err('phone')} autoComplete="tel" />
            </Field>
            <Field label="Date de naissance" error={errors.birth_date}>
              <DateInputFr value={form.birth_date} onChange={set('birth_date')} className={err('birth_date')} />
            </Field>
          </div>
        </Section>

        <Section title="Carrière">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Grade" error={errors.grade}>
              <Select value={form.grade} onChange={(e) => set('grade')(e.target.value)} className={err('grade')}>
                <option value="">Non renseigné</option>
                {grades.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Années d’expérience" error={errors.years_of_experience}>
              <Input type="number" min={0} value={form.years_of_experience} onChange={(e) => set('years_of_experience')(e.target.value)} className={err('years_of_experience')} />
            </Field>
            <Field label="Date d’embauche" error={errors.hire_date}>
              <DateInputFr value={form.hire_date} onChange={set('hire_date')} className={err('hire_date')} />
            </Field>
            <div className="flex items-end pb-2">
              <Checkbox checked={form.has_phd} onChange={set('has_phd')} label="Titulaire d’un doctorat" />
            </div>
          </div>
          <div className="mt-4">
            <Field label="Parcours (optionnel)" error={errors.bio}>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => set('bio')(e.target.value)}
                placeholder="Spécialités, parcours, responsabilités…"
                className={cn('w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]', err('bio'))}
              />
            </Field>
          </div>
          <div className="mt-3">
            <MandatesHint />
          </div>
        </Section>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:bg-red-500/10 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  )
}
