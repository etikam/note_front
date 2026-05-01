import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/model/AuthContext'
import { hasAnyCapability } from '@/core/accessControl'
import { cn } from '@/shared/lib/cn'

const facultyTabClass = ({ isActive }) =>
  cn(
    'inline-flex shrink-0 items-center border-b-2 px-4 py-3 text-sm font-semibold tracking-tight transition-colors duration-200 outline-none whitespace-nowrap no-underline',
    'rounded-t-md focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600',
    isActive
      ? 'border-secondary-300 text-secondary-50 visited:text-secondary-50 shadow-[inset_0_-8px_12px_-10px_rgba(249,115,22,0.35)] dark:border-secondary-200 dark:text-secondary-50 dark:visited:text-secondary-50'
      : 'border-transparent text-secondary-100 visited:text-secondary-100 hover:border-secondary-300/70 hover:text-secondary-50 dark:text-secondary-100 dark:visited:text-secondary-100 dark:hover:text-secondary-50',
  )

export function TeacherFacultyLayout() {
  const { user } = useAuth()
  const canProvision = hasAnyCapability(user, ['can_provision_teacher'])
  const canManageCourses = hasAnyCapability(user, ['can_manage_courses'])
  const location = useLocation()
  const isDetail = /^\/teacher\/faculty\/\d+\/?$/.test(location.pathname)

  if (!canProvision && !canManageCourses) {
    return <Navigate to="/teacher/dashboard" replace />
  }

  return (
    <section className="flex flex-col gap-0" aria-label="Gestion des enseignants">
      {!isDetail && (
        <div className="-mx-6 mb-6 px-6">
          <div className="overflow-hidden rounded-xl bg-brand-600 shadow-sm ring-1 ring-brand-700/30 dark:bg-brand-600 dark:ring-white/10">
            <nav
              className="-mb-px flex flex-nowrap divide-x divide-secondary-400/50 overflow-x-auto px-1 text-secondary-100 sm:flex-wrap sm:px-2"
              role="tablist"
              aria-label="Sections enseignants"
            >
              {canManageCourses ? (
                <NavLink to="/teacher/faculty/course-assignments" className={facultyTabClass} role="tab">
                  Affectations cours
                </NavLink>
              ) : null}
              {canProvision ? (
                <>
                  <NavLink to="/teacher/faculty/list" className={facultyTabClass} role="tab" end>
                    Dashboard
                  </NavLink>
                  <NavLink to="/teacher/faculty/import-export" className={facultyTabClass} role="tab">
                    Import & ajout
                  </NavLink>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      )}
      <div>
        <Outlet />
      </div>
    </section>
  )
}
