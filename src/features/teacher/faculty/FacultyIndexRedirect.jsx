import { Navigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/model/AuthContext'
import { hasAnyCapability } from '@/core/accessControl'

export function FacultyIndexRedirect() {
  const { user } = useAuth()
  const canProvision = hasAnyCapability(user, ['can_provision_teacher'])
  const canManageCourses = hasAnyCapability(user, ['can_manage_courses'])
  if (canProvision) return <Navigate to="list" replace />
  if (canManageCourses) return <Navigate to="course-assignments" replace />
  return <Navigate to="/teacher/dashboard" replace />
}
