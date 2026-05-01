import { ArrowLeft, ArrowRight, CheckCircle, ChevronDown, GraduationCap, Mail, ShieldCheck, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

import { useActivationFlow } from '@/features/auth/hooks/useActivationFlow'
import { useDepartments } from '@/features/auth/hooks/useDepartments'
import { authInputUnderline, authSelectUnderline } from '@/features/auth/ui/authInputClasses'
import { OtpInput } from '@/features/auth/ui/OtpInput'
import { PasswordInput } from '@/features/auth/ui/PasswordInput'
import { ProfileCard } from '@/features/auth/ui/ProfileCard'
import { Stepper } from '@/features/auth/ui/Stepper'
import { Spinner } from '@/shared/ui/Spinner'

const STEPS_LABELS = ['Identification', 'Vérification', 'Activation']

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-sm font-medium ' +
  'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400 dark:active:bg-brand-600 dark:text-white shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none'

const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium ' +
  'bg-transparent text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-[var(--app-border)] hover:bg-zinc-100 dark:hover:bg-[var(--app-nav-hover)] transition-all disabled:opacity-50 disabled:pointer-events-none'

function LookupStep({ flow, departments, isDepartmentsLoading }) {
  function onSubmit(e) {
    e.preventDefault()
    flow.submitLookup()
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Matricule</label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" aria-hidden />
          <input
            className={authInputUnderline}
            value={flow.formData.matricule}
            onChange={(e) => flow.updateField('matricule', e.target.value)}
            placeholder="Entrez votre matricule"
            required
          />
        </div>
      </div>

      {flow.isStudent && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Département</label>
          <div className="relative">
            {isDepartmentsLoading ? (
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" label="Chargement des départements" />
              </span>
            ) : (
              <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" aria-hidden />
            )}
            <select
              className={authSelectUnderline}
              value={flow.formData.department_id}
              onChange={(e) => flow.updateField('department_id', e.target.value)}
              required
              disabled={isDepartmentsLoading}
            >
              <option value="">
                {isDepartmentsLoading ? '—' : 'Sélectionnez votre département'}
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.code} — {dept.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none"
              aria-hidden
            />
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button className={BTN_PRIMARY} type="submit" disabled={flow.isSubmitting}>
          Continuer <ArrowRight size={16} />
        </button>
      </div>
    </form>
  )
}

function OtpRequestStep({ flow }) {
  function onSubmit(e) {
    e.preventDefault()
    flow.submitOtp()
  }

  return (
    <div className="flex flex-col gap-4">
      <ProfileCard profile={flow.profile} type={flow.profileType} />

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {flow.isStudent ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Adresse email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" aria-hidden />
              <input
                className={authInputUnderline}
                type="email"
                value={flow.formData.email}
                onChange={(e) => flow.updateField('email', e.target.value)}
                placeholder="votre.email@exemple.com"
                required
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] rounded-lg px-4 py-3 border border-transparent dark:border-[var(--app-border)]">
            Le code OTP sera envoyé à votre adresse email enregistrée.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button type="button" className={BTN_SECONDARY} onClick={flow.goBack}>
            <ArrowLeft size={14} /> Retour
          </button>
          <button className={BTN_PRIMARY} type="submit" disabled={flow.isSubmitting}>
            Envoyer le code OTP <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  )
}

function ActivateStep({ flow }) {
  function onSubmit(e) {
    e.preventDefault()
    flow.submitActivation()
  }

  return (
    <div className="flex flex-col gap-4">
      {flow.isStudent && <ProfileCard profile={flow.profile} type="student" />}

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Code OTP</label>
        <OtpInput
          value={flow.formData.otp}
          onChange={(value) => flow.updateField('otp', value)}
          disabled={flow.isSubmitting}
        />
        <button
          type="button"
          className={cn(BTN_SECONDARY, 'self-start text-xs')}
          onClick={flow.resendOtp}
          disabled={flow.isSubmitting || !flow.otpTimer.canResend}
        >
          {flow.otpTimer.canResend ? 'Renvoyer le code' : `Renvoyer dans ${flow.otpTimer.secondsLeft}s`}
        </button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nouveau mot de passe</label>
          <PasswordInput
            value={flow.formData.password}
            onChange={(e) => flow.updateField('password', e.target.value)}
            placeholder="Créez votre mot de passe"
            showStrength
            required
            autoComplete="new-password"
          />
        </div>

        {flow.isStudent && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Confirmer le mot de passe</label>
            <PasswordInput
              value={flow.formData.password_confirm}
              onChange={(e) => flow.updateField('password_confirm', e.target.value)}
              placeholder="Saisissez le même mot de passe"
              required
              autoComplete="new-password"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button type="button" className={BTN_SECONDARY} onClick={flow.goBack}>
            <ArrowLeft size={14} /> Retour
          </button>
          <button className={BTN_PRIMARY} type="submit" disabled={flow.isSubmitting}>
            <ShieldCheck size={16} /> Activer mon compte
          </button>
        </div>
      </form>
    </div>
  )
}

function SuccessScreen() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <span className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-950/35 dark:text-secondary-200">
        <CheckCircle size={32} />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Compte activé avec succès !</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Votre compte est maintenant actif. Vous pouvez vous connecter.
        </p>
      </div>
      <button
        className={BTN_PRIMARY}
        type="button"
        onClick={() => navigate('/auth/login')}
      >
        Se connecter
      </button>
    </div>
  )
}

export function ActivationWizard() {
  const flow = useActivationFlow()
  const { departments, isLoading: isDepartmentsLoading } = useDepartments()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Activation de compte</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Suivez les étapes pour activer votre accès.</p>
      </div>

      {!flow.isSuccess ? (
        <>
          {/* Toggle étudiant / enseignant */}
          <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)] rounded-xl border border-transparent dark:border-[var(--app-border)]">
            {['student', 'teacher'].map((type) => (
              <button
                key={type}
                type="button"
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all',
                  flow.profileType === type
                    ? 'bg-white dark:bg-[var(--app-elevated)] text-secondary-700 dark:text-secondary-200 shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                )}
                onClick={() => flow.switchProfileType(type)}
              >
                {type === 'student' ? <GraduationCap size={16} /> : <User size={16} />}
                {type === 'student' ? 'Je suis Étudiant' : 'Je suis Enseignant'}
              </button>
            ))}
          </div>

          <Stepper steps={STEPS_LABELS} currentStep={flow.step} completedSteps={flow.completedSteps} />

          {flow.message && (
            <p className="text-sm text-secondary-900 dark:text-secondary-100 bg-secondary-50 dark:bg-secondary-950/25 border border-secondary-200 dark:border-secondary-900/50 rounded-lg px-4 py-3">
              {flow.message}
            </p>
          )}
          {flow.error && (
            <p className="text-sm text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-900/60 rounded-lg px-4 py-3" role="alert">
              {flow.error}
            </p>
          )}

          <div>
            {flow.step === 1 && <LookupStep flow={flow} departments={departments} isDepartmentsLoading={isDepartmentsLoading} />}
            {flow.step === 2 && <OtpRequestStep flow={flow} />}
            {flow.step === 3 && <ActivateStep flow={flow} />}
          </div>
        </>
      ) : (
        <SuccessScreen />
      )}

      {!flow.isSuccess && (
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors self-start"
          onClick={() => window.history.back()}
        >
          <ArrowLeft size={13} /> Retour à la connexion
        </button>
      )}
    </div>
  )
}
