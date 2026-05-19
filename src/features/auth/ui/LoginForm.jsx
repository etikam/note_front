import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, LogIn, User, Eye, EyeOff } from 'lucide-react'

import { login } from '@/features/auth/api/authApi'
import { validateMatricule, validatePassword } from '@/features/auth/lib/validation'
import { useAuth } from '@/features/auth/model/AuthContext'
import { getRoleHomePath } from '@/core/accessControl'
import { authInputUnderline } from '@/features/auth/ui/authInputClasses'
import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

export function LoginForm() {
  const navigate = useNavigate()
  const { refreshMe } = useAuth()
  const [form, setForm] = useState({ matricule: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fieldErrors = useMemo(
    () => ({
      matricule: validateMatricule(form.matricule),
      password: validatePassword(form.password),
    }),
    [form.matricule, form.password]
  )

  async function onSubmit(event) {
    event.preventDefault()
    setError('')

    if (fieldErrors.matricule || fieldErrors.password) {
      setError('Veuillez corriger les champs avant de continuer.')
      return
    }

    setIsSubmitting(true)
    try {
      await login(form)
      const me = await refreshMe()
      navigate(getRoleHomePath(me), { replace: true })
    } catch (httpError) {
      setError(httpError.message || 'Connexion impossible.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Connexion</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Accédez à votre espace de gestion.</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {/* Matricule */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="login-matricule">
            Matricule
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" aria-hidden />
            <input
              id="login-matricule"
              className={authInputUnderline}
              value={form.matricule}
              onChange={(e) => setForm((prev) => ({ ...prev, matricule: e.target.value }))}
              placeholder="Entrez votre matricule"
              autoComplete="username"
              required
            />
          </div>
        </div>

        {/* Mot de passe */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="login-password">
            Mot de passe
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" aria-hidden />
            <input
              id="login-password"
              className={cn(authInputUnderline, 'pr-10')}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Entrez votre mot de passe"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-900/60 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}

        <button
          className={cn(
            'mt-1 h-10 rounded-lg text-sm font-medium text-white transition-all',
            'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400 dark:active:bg-brand-600 dark:text-white shadow-sm',
            'flex items-center justify-center gap-2',
            'disabled:opacity-60 disabled:pointer-events-none'
          )}
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <Spinner size="sm" variant="inverse" label="Connexion en cours" />
          ) : (
            <>
              <LogIn size={16} />
              Se connecter
            </>
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-xs">
        <button type="button" className="text-zinc-500 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          Mot de passe oublié ?
        </button>
        <button
          type="button"
          className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
          onClick={() => navigate('/auth/activate')}
        >
          Activer mon compte
        </button>
      </div>
    </div>
  )
}
