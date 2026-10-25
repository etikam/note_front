import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Link2, Upload, UserCog } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { RouteTabs } from '@/shared/ui/RouteTabs'

/** Sous-sections « Enseignants » visibles selon les permissions de l'utilisateur. */
function facultySectionTabs(access) {
  return [
    { to: '/teacher/faculty/list', label: 'Annuaire', icon: UserCog, visible: access.canManage('teachers.view') },
    { to: '/teacher/faculty/course-assignments', label: 'Affectations des cours', icon: Link2, visible: access.canManage('courses.assign') },
    { to: '/teacher/faculty/import-export', label: 'Import', icon: Upload, visible: access.canGlobal('teachers.provision') },
  ].filter((t) => t.visible)
}

export function TeacherFacultyLayout() {
  const access = useAccess()
  const location = useLocation()
  const tabs = facultySectionTabs(access)
  const isDetail = /^\/teacher\/faculty\/\d+\/?$/.test(location.pathname)

  if (!tabs.length) return <Navigate to="/teacher/my-courses" replace />
  const isAssignmentDetail = location.pathname.startsWith('/teacher/faculty/course-assignments/')
  const current = tabs.find((t) => location.pathname.startsWith(t.to))
  if (!isDetail && !isAssignmentDetail && !current) return <Navigate to={tabs[0].to} replace />

  return (
    <section aria-label="Enseignants">
      {!isDetail && !isAssignmentDetail ? <RouteTabs tabs={tabs} ariaLabel="Sections enseignants" /> : null}
      <Outlet />
    </section>
  )
}
