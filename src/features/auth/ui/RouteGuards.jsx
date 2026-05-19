import { Navigate, Outlet } from 'react-router-dom'

import { getRoleHomePath } from '@/core/accessControl'
import { useAuth } from '@/features/auth/model/AuthContext'
import { PageLoading } from '@/shared/ui/Spinner'

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <PageLoading label="Chargement de la session" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}

export function GuestRoute() {
  const { user, isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <PageLoading label="Chargement" />
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleHomePath(user)} replace />
  }

  return <Outlet />
}

/** Routes réservées aux comptes enseignant (`user.role === 'teacher'`). */
export function TeacherRoute() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <PageLoading label="Chargement" />
  }

  if (user?.role === 'student') {
    return <Navigate to="/student/dashboard" replace />
  }

  if (user?.role !== 'teacher') {
    return <Navigate to={getRoleHomePath(user)} replace />
  }

  return <Outlet />
}

/** Routes réservées aux comptes étudiant (`user.role === 'student'`). */
export function StudentRoute() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <PageLoading label="Chargement" />
  }

  if (user?.role === 'teacher') {
    return <Navigate to={getRoleHomePath(user)} replace />
  }

  if (user?.role !== 'student') {
    return <Navigate to={getRoleHomePath(user)} replace />
  }

  return <Outlet />
}

export function RoleHomeRedirect() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <PageLoading label="Chargement" />
  }

  return <Navigate to={getRoleHomePath(user)} replace />
}
