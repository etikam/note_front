import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/features/theme/model/ThemeContext'
import { THEME_MODES } from '@/features/theme/model/theme.constants'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui'

/**
 * Toggle thème dans le header : icône soleil (mode clair) / lune (mode sombre), fortement visible.
 */
export function ThemeLampToggle({ className }) {
  const { mode, toggleMode } = useTheme()
  const isDark = mode === THEME_MODES.DARK

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
        'border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_88%,var(--app-canvas))]',
        'text-[var(--app-fg)] shadow-sm hover:bg-[color-mix(in_srgb,var(--app-elevated)_78%,var(--app-canvas))] hover:shadow-md',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-elevated)]',
        isDark &&
          'border-amber-400/45 bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-zinc-900/40 shadow-[0_0_20px_-4px_rgba(251,191,36,0.55)] dark:from-amber-400/25 dark:via-amber-500/12 dark:to-zinc-950/50 dark:shadow-[0_0_24px_-2px_rgba(251,191,36,0.45)]',
        className,
      )}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      aria-pressed={isDark}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? (
        <Moon
          size={22}
          strokeWidth={2.25}
          className="theme-toggle-moon text-amber-200 drop-shadow-[0_0_8px_rgba(253,230,138,0.55)]"
          aria-hidden
        />
      ) : (
        <Sun
          size={22}
          strokeWidth={2}
          className="text-amber-500 dark:text-amber-400/90"
          aria-hidden
        />
      )}
    </button>
  )
}

export function ThemeModeToggle() {
  const { mode, toggleMode } = useTheme()
  const isDark = mode === THEME_MODES.DARK

  return (
    <Button variant="ghost" onClick={toggleMode} className="gap-2">
      {isDark ? (
        <Moon size={18} strokeWidth={2.25} className="shrink-0 theme-toggle-moon text-amber-300" aria-hidden />
      ) : (
        <Sun size={18} strokeWidth={2} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      )}
      {isDark ? 'Mode clair' : 'Mode sombre'}
    </Button>
  )
}
