import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { config } from '@/core/config'
import { THEME_MODES, THEME_STORAGE_KEYS } from '@/features/theme/model/theme.constants'

const ThemeContext = createContext(null)

function getStoredMode() {
  const mode = localStorage.getItem(THEME_STORAGE_KEYS.mode)
  return mode === THEME_MODES.DARK ? THEME_MODES.DARK : THEME_MODES.LIGHT
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => config.defaultThemeMode || getStoredMode())

  useEffect(() => {
    const nextMode = mode === THEME_MODES.DARK ? THEME_MODES.DARK : THEME_MODES.LIGHT
    localStorage.setItem(THEME_STORAGE_KEYS.mode, nextMode)
    document.documentElement.dataset.theme = nextMode
  }, [mode])

  const toggleMode = useCallback(() => {
    setMode((current) => (current === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK))
  }, [])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
    }),
    [mode, toggleMode]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme doit être utilisé sous ThemeProvider.')
  }
  return context
}
