import { useMemo } from 'react'

import { buildAccess } from '@/features/access/model/access'
import { useAuth } from '@/features/auth/model/AuthContext'

/** Droits effectifs de l'utilisateur connecté (voir ``buildAccess``). */
export function useAccess() {
  const { user } = useAuth()
  return useMemo(() => buildAccess(user), [user])
}
