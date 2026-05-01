import { LampDesk } from 'lucide-react'

import { useTheme } from '@/features/theme/model/ThemeContext'
import { THEME_MODES } from '@/features/theme/model/theme.constants'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui'

/**
 * Lampe allumée = mode sombre actif (cliquer pour revenir au clair).
 * Lampe éteinte = mode clair (cliquer pour activer le sombre).
 */
export function ThemeLampToggle({ className }) {
  const { mode, toggleMode } = useTheme()
  const isDark = mode === THEME_MODES.DARK

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0',
        'text-[var(--app-muted)] hover:text-[var(--app-fg)] hover:bg-[var(--app-nav-hover)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-elevated)]',
        className
      )}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-pressed={isDark}
      title={isDark ? 'Mode clair (éteindre la lampe)' : 'Mode sombre (allumer la lampe)'}
    >
      <LampDesk
        size={20}
        strokeWidth={isDark ? 2.25 : 1.65}
        className={cn(
          'transition-[opacity,filter,color] duration-200',
          isDark ? 'theme-lamp-on' : 'text-zinc-400 dark:text-zinc-500 opacity-55'
        )}
        aria-hidden
      />
    </button>
  )
}

export function ThemeModeToggle() {
  const { mode, toggleMode } = useTheme()
  const isDark = mode === THEME_MODES.DARK

  return (
    <Button variant="ghost" onClick={toggleMode} className="gap-2">
      <LampDesk
        size={18}
        strokeWidth={isDark ? 2.25 : 1.65}
        className={cn(
          'shrink-0 transition-[opacity,filter,color] duration-200',
          isDark ? 'theme-lamp-on' : 'text-zinc-400 dark:text-zinc-500 opacity-55'
        )}
        aria-hidden
      />
      {isDark ? 'Mode clair' : 'Mode sombre'}
    </Button>
  )
}
