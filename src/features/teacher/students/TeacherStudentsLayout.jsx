import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ClipboardList, FileUp, GraduationCap, Upload } from 'lucide-react'

import { useAccess } from '@/features/access/model/useAccess'
import { RouteTabs } from '@/shared/ui/RouteTabs'

/** Sous-sections « Étudiants » visibles selon les permissions de l'utilisateur. */
function studentSectionTabs(access) {
  return [
    { to: '/teacher/students/list', label: 'Annuaire', icon: GraduationCap, visible: access.canManage('students.view') },
    { to: '/teacher/students/import-export', label: 'Import / export', icon: Upload, visible: access.canManage('students.import') },
    { to: '/teacher/students/grades-import', label: 'Import des notes', icon: FileUp, visible: access.canManage('grades.bulk_import') },
    { to: '/teacher/students/grades', label: 'Relevés de notes', icon: ClipboardList, visible: access.canManage('reports.view') },
  ].filter((t) => t.visible)
}

export function TeacherStudentsLayout() {
  const access = useAccess()
  const location = useLocation()
  const tabs = studentSectionTabs(access)
  const isDetail = /^\/teacher\/students\/\d+\/?$/.test(location.pathname)

  if (location.pathname.replace(/\/$/, '') === '/teacher/students') {
    return <Navigate to={tabs[0]?.to ?? '/teacher/my-courses'} replace />
  }
  const current = tabs.find((t) => location.pathname.startsWith(t.to))
  if (!isDetail && !current) {
    return <Navigate to={tabs[0]?.to ?? '/teacher/my-courses'} replace />
  }

  return (
    <section aria-label="Étudiants">
      {!isDetail ? <RouteTabs tabs={tabs} ariaLabel="Sections étudiants" /> : null}
      <Outlet />
    </section>
  )
}
