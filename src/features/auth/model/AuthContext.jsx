import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { fetchMe, logout } from '@/features/auth/api/authApi'
import { clearAuthTokens } from '@/shared/api/tokens'
import { setOnUnauthorized } from '@/shared/api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const refreshMe = useCallback(async () => {
    try {
      const me = await fetchMe()
      setUser(me)
      return me
    } catch (_error) {
      clearAuthTokens()
      setUser(null)
      return null
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch (_error) {
      // Le backend peut déjà avoir expiré la session.
    } finally {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    setOnUnauthorized(() => {
      clearAuthTokens()
      setUser(null)
    })
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const me = await fetchMe()
        if (mounted) setUser(me)
      } catch (_error) {
        if (mounted) {
          clearAuthTokens()
          setUser(null)
        }
      } finally {
        if (mounted) setIsBootstrapping(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      refreshMe,
      signOut,
    }),
    [isBootstrapping, refreshMe, signOut, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé sous AuthProvider.')
  }
  return context
}
