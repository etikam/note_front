import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  GraduationCap,
  User,
  Users,
  BookOpen,
} from 'lucide-react'

import { patchMyPhoto } from '@/features/auth/api/authApi'
import { postOnboardingComplete } from '@/features/student/api/studentApi'
import { fetchStudentProfile } from '@/features/student/api/studentApi'
import { useAuth } from '@/features/auth/model/AuthContext'
import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

/* ─── helpers ─── */

function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 ' +
  'px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent ' +
  'transition-colors'

/* ─── step indicator ─── */

const STEPS = [
  { label: 'Photo', icon: Camera },
  { label: 'Coordonnées', icon: User },
  { label: 'Famille', icon: Users },
  { label: 'Résumé', icon: BookOpen },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center">
      {STEPS.map((step, idx) => {
        const num = idx + 1
        const done = num < current
        const active = num === current
        const Icon = step.icon
        return (
          <div key={num} className="flex items-center">
            <div
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300',
                done && 'bg-brand-600 text-white shadow-sm',
                active && 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900/40 shadow-md',
                !done && !active && 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500',
              )}
            >
              {done ? <Check size={16} strokeWidth={2.5} /> : <Icon size={15} />}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-10 sm:w-16 mx-1 transition-colors duration-300',
                  num < current ? 'bg-brand-500' : 'bg-zinc-200 dark:bg-zinc-700',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── step 1 : photo ─── */

function Step1Photo({ user, profile, photoPreview, onPhotoChange, uploading }) {
  const fileRef = useRef(null)

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      <div className="text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Bienvenue, {profile?.first_name || user?.full_name?.split(' ')[0]} 👋
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          Complétez votre profil en quelques étapes pour finaliser votre inscription.
        </p>
      </div>

      <div className="w-full flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 px-3.5 py-3">
        <span className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0">⚠</span>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          Veillez à renseigner vos <strong>vraies informations</strong>. Elles seront utilisées pour votre dossier académique officiel et ne pourront être modifiées que par l'administration.
        </p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="group relative w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center">
              <User size={40} className="text-brand-400 dark:text-brand-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
            {uploading ? (
              <Spinner size="sm" variant="inverse" />
            ) : (
              <Camera size={22} className="text-white" />
            )}
          </div>
        </button>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-600 border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow">
          <Camera size={14} className="text-white" />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
      />

      <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
        Formats acceptés : JPG, PNG — La photo est optionnelle, vous pouvez en ajouter une plus tard.
      </p>

      {profile && (
        <div className="w-full rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/40 px-4 py-3">
          <p className="text-xs font-medium text-brand-700 dark:text-brand-300 mb-2">Vos informations académiques</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="text-zinc-400 dark:text-zinc-500">Matricule</span>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{profile.matricule}</span>
            {profile.level_name && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500">Niveau</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{profile.level_name}</span>
              </>
            )}
            {profile.department_name && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500">Département</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{profile.department_name}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── step 2 : infos personnelles ─── */

function Step2Personal({ form, onChange, errors }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Vos coordonnées</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Renseignez vos vraies informations pour votre dossier officiel.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Genre */}
        <Field label="Genre" htmlFor="gender">
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'M', label: 'Masculin' },
              { value: 'F', label: 'Féminin' },
            ].map(({ value, label }) => (
              <label
                key={value}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all',
                  form.gender === value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-500'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
                )}
              >
                <input
                  type="radio"
                  name="gender"
                  value={value}
                  checked={form.gender === value}
                  onChange={() => onChange('gender', value)}
                  className="accent-brand-600"
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    form.gender === value
                      ? 'text-brand-700 dark:text-brand-300'
                      : 'text-zinc-700 dark:text-zinc-300',
                  )}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </Field>

        {/* Date de naissance */}
        <Field label="Date de naissance" htmlFor="birth_date" error={errors.birth_date}>
          <input
            id="birth_date"
            type="date"
            className={inputCls}
            value={form.birth_date}
            onChange={(e) => onChange('birth_date', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </Field>

        {/* Lieu de naissance */}
        <Field label="Lieu de naissance" htmlFor="birth_place" error={errors.birth_place}>
          <input
            id="birth_place"
            type="text"
            className={inputCls}
            value={form.birth_place}
            onChange={(e) => onChange('birth_place', e.target.value)}
            placeholder="Ville ou région de naissance"
            maxLength={200}
          />
        </Field>

        {/* Téléphone */}
        <Field
          label="Numéro de téléphone"
          htmlFor="phone"
          hint="Format : +224 xxx xxx xxx"
          error={errors.phone}
        >
          <input
            id="phone"
            type="tel"
            className={inputCls}
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+224 000 000 000"
            maxLength={20}
          />
        </Field>
      </div>
    </div>
  )
}

/* ─── step 3 : famille & bio ─── */

function Step3Family({ form, onChange, errors }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Informations familiales</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Renseignez vos vraies informations pour votre dossier officiel.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Field label="Nom du père" htmlFor="dad_name" error={errors.dad_name}>
          <input
            id="dad_name"
            type="text"
            className={inputCls}
            value={form.dad_name}
            onChange={(e) => onChange('dad_name', e.target.value)}
            placeholder="Prénom et nom du père"
            maxLength={150}
          />
        </Field>

        <Field label="Nom de la mère" htmlFor="mum_name" error={errors.mum_name}>
          <input
            id="mum_name"
            type="text"
            className={inputCls}
            value={form.mum_name}
            onChange={(e) => onChange('mum_name', e.target.value)}
            placeholder="Prénom et nom de la mère"
            maxLength={150}
          />
        </Field>
      </div>
    </div>
  )
}

/* ─── step 4 : récapitulatif ─── */

function SummaryRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <span className="text-xs sm:text-sm text-zinc-400 dark:text-zinc-500 sm:shrink-0 sm:w-36">{label}</span>
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 sm:text-right">{value}</span>
    </div>
  )
}

function Step4Summary({ profile, form, photoPreview }) {
  const genderLabel = form.gender === 'M' ? 'Masculin' : form.gender === 'F' ? 'Féminin' : null
  const birthDateLabel = form.birth_date
    ? new Date(form.birth_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Récapitulatif</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Vérifiez vos informations avant de finaliser votre profil.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-zinc-700 shadow-sm shrink-0">
          {photoPreview ? (
            <img src={photoPreview} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/40 flex items-center justify-center">
              <User size={24} className="text-brand-400 dark:text-brand-500" />
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{profile?.matricule}</p>
          {profile?.level_name && (
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-0.5">{profile.level_name}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Coordonnées
          </p>
        </div>
        <div className="px-4">
          <SummaryRow label="Genre" value={genderLabel} />
          <SummaryRow label="Date de naissance" value={birthDateLabel} />
          <SummaryRow label="Lieu de naissance" value={form.birth_place} />
          <SummaryRow label="Téléphone" value={form.phone} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Famille & présentation
          </p>
        </div>
        <div className="px-4">
          <SummaryRow label="Nom du père" value={form.dad_name} />
          <SummaryRow label="Nom de la mère" value={form.mum_name} />
        </div>
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
        Vous pouvez modifier ces informations à tout moment depuis votre profil.
      </p>
    </div>
  )
}

/* ─── page principale ─── */

const PHONE_RE = /^\+?[\d\s\-().]{6,20}$/

function validateStep(step, form) {
  const errors = {}
  if (step === 2) {
    if (form.phone && !PHONE_RE.test(form.phone)) {
      errors.phone = 'Numéro invalide. Format attendu : +224 xxx xxx xxx'
    }
  }
  return errors
}

export function StudentOnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshMe } = useAuth()

  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [stepError, setStepError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [form, setForm] = useState({
    gender: '',
    birth_date: '',
    birth_place: '',
    phone: '',
    dad_name: '',
    mum_name: '',
    bio: '',
  })

  useEffect(() => {
    fetchStudentProfile()
      .then((data) => {
        setProfile(data)
        setPhotoPreview(data.photo_url || null)
        setForm((prev) => ({
          ...prev,
          gender: data.gender || '',
          birth_date: data.birth_date || '',
          birth_place: data.birth_place || '',
          phone: data.phone || '',
          dad_name: data.dad_name || '',
          mum_name: data.mum_name || '',
          bio: data.bio || '',
        }))
      })
      .catch(() => {})
  }, [])

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }, [])

  const handlePhotoChange = useCallback(async (file) => {
    if (!file) return
    setPhotoPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      await patchMyPhoto(fd)
    } catch (_err) {
      // photo upload failure is non-blocking
    } finally {
      setUploading(false)
    }
  }, [])

  const handleNext = useCallback(async () => {
    setStepError('')
    const errors = validateStep(step, form)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    if (step < 4) {
      setStep((s) => s + 1)
      return
    }

    // étape 4 → soumettre
    setSubmitting(true)
    try {
      const payload = {}
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) payload[k] = v
      })
      await postOnboardingComplete(payload)
      await refreshMe()
      navigate('/student/dashboard', { replace: true })
    } catch (err) {
      setStepError(err?.response?.data?.detail || "Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setSubmitting(false)
    }
  }, [step, form, refreshMe, navigate])

  const handleBack = useCallback(() => {
    setStepError('')
    setStep((s) => s - 1)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-brand-950/20 flex flex-col items-center justify-center px-3 py-6 sm:p-4">
      {/* header */}
      <div className="flex items-center gap-2 mb-5 sm:mb-8">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow">
          <GraduationCap size={18} className="text-white" />
        </div>
        <span className="text-base font-semibold text-zinc-700 dark:text-zinc-300">CI Gestion Notes</span>
      </div>

      {/* card */}
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* step bar */}
        <div className="px-4 sm:px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <StepIndicator current={step} />
        </div>

        {/* content */}
        <div className="px-4 sm:px-6 py-5 sm:py-6 min-h-[320px] sm:min-h-[340px]">
          {step === 1 && (
            <Step1Photo
              user={user}
              profile={profile}
              photoPreview={photoPreview}
              onPhotoChange={handlePhotoChange}
              uploading={uploading}
            />
          )}
          {step === 2 && (
            <Step2Personal form={form} onChange={handleChange} errors={fieldErrors} />
          )}
          {step === 3 && (
            <Step3Family form={form} onChange={handleChange} errors={fieldErrors} />
          )}
          {step === 4 && (
            <Step4Summary profile={profile} form={form} photoPreview={photoPreview} />
          )}
        </div>

        {/* footer */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 flex flex-col gap-3">
          {stepError && (
            <p className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2 text-center">
              {stepError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className={cn(
                  'flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-medium transition-colors',
                  'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100',
                  'border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
                  'disabled:opacity-50 disabled:pointer-events-none',
                )}
              >
                <ArrowLeft size={15} />
                Précédent
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting || uploading}
              className={cn(
                'flex items-center gap-1.5 px-5 h-10 rounded-lg text-sm font-semibold transition-all shadow-sm',
                'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white',
                'dark:bg-brand-500 dark:hover:bg-brand-400 dark:active:bg-brand-600',
                'disabled:opacity-60 disabled:pointer-events-none',
              )}
            >
              {submitting ? (
                <Spinner size="sm" variant="inverse" label="Finalisation…" />
              ) : step === 4 ? (
                <>
                  <Check size={15} strokeWidth={2.5} />
                  Terminer
                </>
              ) : (
                <>
                  Suivant
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>

          {/* skip hint on step 1 */}
          {step === 1 && (
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
              Étape {step} sur {STEPS.length} — vous pouvez compléter votre profil plus tard
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
