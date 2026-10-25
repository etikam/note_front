import { Navigate, Outlet } from 'react-router-dom'

import { homePathFor } from '@/features/access/model/access'
import { useAccess } from '@/features/access/model/useAccess'
import { useAuth } from '@/features/auth/model/AuthContext'

/**
 * Garde de route par permission.
 * ``mode`` : ``any`` (n'importe où, y compris ses cours), ``manage`` (sur une entité), ``global`` (faculté / institution).
 * Plusieurs permissions : il suffit d'en détenir une.
 */
export function RequirePermission({ perms, mode = 'manage', children }) {
  const { user } = useAuth()
  const access = useAccess()
  const list = Array.isArray(perms) ? perms : [perms]
  const check = { any: access.can, manage: access.canManage, global: access.canGlobal }[mode] ?? access.canManage
  if (!list.some((p) => check(p))) {
    return <Navigate to={homePathFor(user)} replace />
  }
  return children ?? <Outlet />
}

/** Affiche ``children`` seulement si l'utilisateur détient l'une des permissions. */
export function Can({ perms, mode = 'manage', fallback = null, children }) {
  const access = useAccess()
  const list = Array.isArray(perms) ? perms : [perms]
  const check = { any: access.can, manage: access.canManage, global: access.canGlobal }[mode] ?? access.canManage
  return list.some((p) => check(p)) ? children : fallback
}
