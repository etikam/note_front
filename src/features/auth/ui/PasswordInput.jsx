import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { authInputUnderline } from '@/features/auth/ui/authInputClasses'
import { getPasswordStrength } from '@/features/auth/lib/validation'

const STRENGTH_LEVELS = {
  0: { color: '', width: 0 },
  1: { color: 'bg-brand-800 dark:bg-brand-700', width: 20 },
  2: { color: 'bg-brand-700 dark:bg-brand-600', width: 40 },
  3: { color: 'bg-brand-600 dark:bg-brand-500', width: 60 },
  4: { color: 'bg-brand-500 dark:bg-brand-400', width: 80 },
  5: { color: 'bg-brand-400 dark:bg-brand-300', width: 100 },
}

const STRENGTH_LABELS = {
  0: '',
  1: 'Très faible',
  2: 'Faible',
  3: 'Moyen',
  4: 'Bon',
  5: 'Excellent',
}

export function PasswordInput({ value, onChange, placeholder = 'Mot de passe', showStrength = false, ...rest }) {
  const [visible, setVisible] = useState(false)
  const { score } = getPasswordStrength(value)
  const level = STRENGTH_LEVELS[score] ?? STRENGTH_LEVELS[0]

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" aria-hidden />
        <input
          className={cn(authInputUnderline, 'pr-10')}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          {...rest}
        />
        <button
          type="button"
          className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && value ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-[color-mix(in_srgb,var(--app-elevated)_80%,black)] rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-300', level.color)}
              style={{ width: `${level.width}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 w-16 text-right shrink-0">
            {STRENGTH_LABELS[score]}
          </span>
        </div>
      ) : null}
    </div>
  )
}
