import { Navigate, Outlet } from 'react-router-dom'

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
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <PageLoading label="Chargement" />
  }

  if (isAuthenticated) {
    return <Navigate to="/teacher/dashboard" replace />
  }

  return <Outlet />
}
