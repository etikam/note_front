import { useEffect, useState } from 'react'
import { UserPlus, X } from 'lucide-react'

import { useAuth } from '@/features/auth/model/AuthContext'
import { fetchTeacherGrades, postTeacher } from '@/features/teacher/faculty/api/teachersApi'
import { useTeacherDirectoryList } from '@/features/teacher/faculty/hooks/useTeacherDirectoryList'
import { FacultyDirectoryTable } from '@/features/teacher/faculty/ui/FacultyDirectoryTable'
import { FacultyStats } from '@/features/teacher/faculty/ui/FacultyStats'
import { useInView } from '@/shared/hooks/useInView'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Field, Input } from '@/shared/ui/Field'
import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

const TEACHER_ROLE_OPTIONS = [
  { value: 'teacher', label: 'Enseignant' },
  { value: 'department_head', label: 'Chef de département' },
  { value: 'study_director', label: 'Directeur des études' },
  { value: 'program_director', label: 'Directeur de programme' },
  { value: 'general_director', label: 'Directeur général' },
]

function emptyCreateForm() {
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

function buildCreatePayload(form) {
  const payload = {
    matricule: form.matricule.trim(),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    teacher_role: form.teacher_role,
    has_phd: Boolean(form.has_phd),
  }
  if (form.gender) payload.gender = form.gender
  const phone = form.phone.trim()
  if (phone) payload.phone = phone
  if (form.birth_date) payload.birth_date = form.birth_date
  if (form.grade) payload.grade = form.grade
  if (form.years_of_experience !== '' && form.years_of_experience != null) {
    const n = Number(form.years_of_experience)
    if (!Number.isNaN(n)) payload.years_of_experience = n
  }
  if (form.hire_date) payload.hire_date = form.hire_date
  const bio = form.bio.trim()
  if (bio) payload.bio = bio
  return payload
}

const selectClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]'

const INPUT_ERR =
  'border-red-500 dark:border-red-600 ring-2 ring-red-500/25 focus:ring-red-500/40 focus:border-red-500'

export function TeacherFacultyListPage() {
  const { user } = useAuth()
  const canProvision = Boolean(user?.capabilities?.can_provision_teacher)

  const [setTableHostRef, listInView] = useInView({ rootMargin: '100px' })
  const dir = useTeacherDirectoryList({ listEnabled: listInView })

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createError, setCreateError] = useState(null)
  const [createFieldErrors, setCreateFieldErrors] = useState({})
  const [teacherGrades, setTeacherGrades] = useState([])
  const [gradesLoading, setGradesLoading] = useState(false)

  const handleCreateChange = (field, value) => {
    setCreateForm((f) => ({ ...f, [field]: value }))
    setCreateFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const inputErrClass = (name) => cn(createFieldErrors[name] ? INPUT_ERR : undefined)

  useEffect(() => {
    if (!createOpen || !canProvision) return
    let cancelled = false
    ;(async () => {
      setGradesLoading(true)
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
  }, [createOpen, canProvision])

  const submitCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    setCreateFieldErrors({})
    try {
      await postTeacher(buildCreatePayload(createForm))
      setCreateForm(emptyCreateForm())
      setCreateOpen(false)
      await dir.load()
    } catch (e) {
      const fieldErrors = e?.fieldErrors && typeof e.fieldErrors === 'object' ? e.fieldErrors : {}
      setCreateFieldErrors(fieldErrors)
      setCreateError(e?.message?.trim() || 'Création impossible.')
    } finally {
      setCreating(false)
    }
  }

  if (!canProvision) return null

  const closeCreateModal = () => {
    if (creating) return
    setCreateOpen(false)
    setCreateError(null)
    setCreateFieldErrors({})
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-600 dark:text-secondary-400 mb-1.5">
            Ressources humaines
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-900 dark:text-zinc-50 tracking-tight">
            Enseignants
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Tableau de bord RH — création unitaire, statistiques et accès à la fiche (affectation cours selon vos
            droits).
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="border border-zinc-200 dark:border-[var(--app-border)]"
          onClick={() => {
            setCreateOpen(true)
            setCreateError(null)
            setCreateFieldErrors({})
          }}
        >
          <UserPlus size={16} aria-hidden />
          Ajouter un enseignant
        </Button>
      </div>

      <FacultyStats stats={dir.stats} />

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Recherche" className="min-w-[12rem] flex-1">
          <Input value={dir.q} onChange={(e) => dir.setQ(e.target.value)} placeholder="Matricule, nom, email…" />
        </Field>
        <Field label="Statut" className="w-40">
          <select className={selectClass} value={dir.status} onChange={(e) => dir.setStatus(e.target.value)}>
            <option value="">Tous</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="suspended">Suspendu</option>
            <option value="on_leave">En congé</option>
          </select>
        </Field>
      </div>

      <div ref={setTableHostRef}>
        <FacultyDirectoryTable
          listEnabled={listInView}
          loading={dir.loading}
          error={dir.error}
          onRetry={dir.load}
          results={dir.results}
          page={dir.page}
          onPageChange={dir.setPage}
          count={dir.count}
          next={dir.next}
          previous={dir.previous}
          pageNumbers={dir.pageNumbers}
          rangeStart={dir.rangeStart}
          rangeEnd={dir.rangeEnd}
          pageSize={dir.pageSize}
          onPageSizeChange={dir.setPageSize}
          ordering={dir.ordering}
          onOrderingChange={dir.setOrdering}
        />
      </div>

      {createOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-black/70 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeCreateModal}
        >
          <Card
            className="relative w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ajouter un enseignant</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Renseignez l’identité, la fonction et les informations professionnelles (aligné sur la fiche enseignant).
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-[var(--app-nav-hover)] dark:text-zinc-400 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form className="mt-6 space-y-6" onSubmit={submitCreate} noValidate>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-3">
                  Identité & contact
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Matricule" error={createFieldErrors.matricule}>
                    <Input
                      name="matricule"
                      value={createForm.matricule}
                      onChange={(e) => handleCreateChange('matricule', e.target.value)}
                      required
                      autoComplete="off"
                      aria-invalid={Boolean(createFieldErrors.matricule)}
                      className={inputErrClass('matricule')}
                    />
                  </Field>
                  <Field label="Email professionnel" error={createFieldErrors.email}>
                    <Input
                      type="email"
                      name="email"
                      value={createForm.email}
                      onChange={(e) => handleCreateChange('email', e.target.value)}
                      required
                      autoComplete="email"
                      aria-invalid={Boolean(createFieldErrors.email)}
                      className={inputErrClass('email')}
                    />
                  </Field>
                  <Field label="Prénom" error={createFieldErrors.first_name}>
                    <Input
                      name="first_name"
                      value={createForm.first_name}
                      onChange={(e) => handleCreateChange('first_name', e.target.value)}
                      required
                      autoComplete="given-name"
                      aria-invalid={Boolean(createFieldErrors.first_name)}
                      className={inputErrClass('first_name')}
                    />
                  </Field>
                  <Field label="Nom" error={createFieldErrors.last_name}>
                    <Input
                      name="last_name"
                      value={createForm.last_name}
                      onChange={(e) => handleCreateChange('last_name', e.target.value)}
                      required
                      autoComplete="family-name"
                      aria-invalid={Boolean(createFieldErrors.last_name)}
                      className={inputErrClass('last_name')}
                    />
                  </Field>
                  <Field label="Genre" error={createFieldErrors.gender}>
                    <select
                      name="gender"
                      className={cn(selectClass, inputErrClass('gender'))}
                      value={createForm.gender}
                      onChange={(e) => handleCreateChange('gender', e.target.value)}
                      aria-invalid={Boolean(createFieldErrors.gender)}
                    >
                      <option value="">Non renseigné</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </Field>
                  <Field label="Téléphone" error={createFieldErrors.phone}>
                    <Input
                      type="tel"
                      name="phone"
                      value={createForm.phone}
                      onChange={(e) => handleCreateChange('phone', e.target.value)}
                      autoComplete="tel"
                      placeholder="+225…"
                      aria-invalid={Boolean(createFieldErrors.phone)}
                      className={inputErrClass('phone')}
                    />
                  </Field>
                  <Field label="Date de naissance" error={createFieldErrors.birth_date}>
                    <Input
                      type="date"
                      name="birth_date"
                      value={createForm.birth_date}
                      onChange={(e) => handleCreateChange('birth_date', e.target.value)}
                      aria-invalid={Boolean(createFieldErrors.birth_date)}
                      className={inputErrClass('birth_date')}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-3">
                  Fonction & carrière
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Rôle institutionnel" error={createFieldErrors.teacher_role}>
                    <select
                      name="teacher_role"
                      className={cn(selectClass, inputErrClass('teacher_role'))}
                      value={createForm.teacher_role}
                      onChange={(e) => handleCreateChange('teacher_role', e.target.value)}
                      aria-invalid={Boolean(createFieldErrors.teacher_role)}
                    >
                      {TEACHER_ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Grade (titre)" error={createFieldErrors.grade}>
                    <select
                      name="grade"
                      className={cn(selectClass, inputErrClass('grade'))}
                      value={createForm.grade}
                      onChange={(e) => handleCreateChange('grade', e.target.value)}
                      disabled={gradesLoading}
                      aria-invalid={Boolean(createFieldErrors.grade)}
                    >
                      <option value="">{gradesLoading ? 'Chargement…' : 'Non renseigné'}</option>
                      {teacherGrades.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Années d'expérience" error={createFieldErrors.years_of_experience}>
                    <Input
                      type="number"
                      name="years_of_experience"
                      min={0}
                      step={1}
                      value={createForm.years_of_experience}
                      onChange={(e) => handleCreateChange('years_of_experience', e.target.value)}
                      placeholder="0"
                      aria-invalid={Boolean(createFieldErrors.years_of_experience)}
                      className={inputErrClass('years_of_experience')}
                    />
                  </Field>
                  <Field label="Doctorat" error={createFieldErrors.has_phd}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        name="has_phd"
                        className="rounded border-zinc-300 dark:border-[var(--app-border)]"
                        checked={createForm.has_phd}
                        onChange={(e) => handleCreateChange('has_phd', e.target.checked)}
                      />
                      <span>Oui, titulaire d’un doctorat</span>
                    </label>
                  </Field>
                  <Field label="Date d’embauche" error={createFieldErrors.hire_date}>
                    <Input
                      type="date"
                      name="hire_date"
                      value={createForm.hire_date}
                      onChange={(e) => handleCreateChange('hire_date', e.target.value)}
                      aria-invalid={Boolean(createFieldErrors.hire_date)}
                      className={inputErrClass('hire_date')}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-3">
                  Présentation
                </p>
                <Field label="Biographie / parcours (optionnel)" error={createFieldErrors.bio}>
                  <textarea
                    name="bio"
                    rows={4}
                    value={createForm.bio}
                    onChange={(e) => handleCreateChange('bio', e.target.value)}
                    className={cn(
                      'w-full rounded-lg border bg-white px-3 py-2 text-sm resize-y min-h-[5rem]',
                      'border-zinc-200 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]',
                      'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400',
                      inputErrClass('bio'),
                    )}
                    placeholder="Parcours académique, spécialités, responsabilités…"
                    aria-invalid={Boolean(createFieldErrors.bio)}
                  />
                </Field>
              </div>

              {createError ? (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-900 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-100"
                  role="alert"
                >
                  {createError}
                </div>
              ) : null}
              <div className="sm:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeCreateModal} disabled={creating}>
                  Annuler
                </Button>
                <Button type="submit" variant="primary" disabled={creating}>
                  {creating ? 'Enregistrement…' : 'Créer'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
