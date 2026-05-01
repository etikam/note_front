import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/features/auth/model/AuthContext'
import { hasAnyCapability } from '@/core/accessControl'
import { cn } from '@/shared/lib/cn'

const studentsTabClass = ({ isActive }) =>
  cn(
    'inline-flex items-center border-b-2 px-4 py-3 text-sm font-semibold tracking-tight transition-colors duration-200 outline-none whitespace-nowrap no-underline',
    'rounded-t-md focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600',
    isActive
      ? 'border-secondary-300 text-secondary-50 visited:text-secondary-50 shadow-[inset_0_-8px_12px_-10px_rgba(249,115,22,0.35)] dark:border-secondary-200 dark:text-secondary-50 dark:visited:text-secondary-50'
      : 'border-transparent text-secondary-100 visited:text-secondary-100 hover:border-secondary-300/70 hover:text-secondary-50 dark:text-secondary-100 dark:visited:text-secondary-100 dark:hover:text-secondary-50',
  )

export function TeacherStudentsLayout() {
  const { user } = useAuth()
  const canImport = hasAnyCapability(user, ['can_import_data'])
  const location = useLocation()
  const isDetail = /^\/teacher\/students\/\d+\/?$/.test(location.pathname)

  return (
    <section className="flex flex-col gap-0" aria-label="Espace étudiants">
      {!isDetail && (
        <div className="-mx-6 mb-6 px-6">
          <div className="overflow-hidden rounded-xl bg-brand-600 shadow-sm ring-1 ring-brand-700/30 dark:bg-brand-600 dark:ring-white/10">
            <nav
              className="-mb-px flex flex-wrap divide-x divide-secondary-400/50 px-1 text-secondary-100 sm:px-2"
              role="tablist"
              aria-label="Sections étudiants"
            >
              <NavLink to="/teacher/students/list" className={studentsTabClass} role="tab" end>
                Annuaire
              </NavLink>
              {canImport ? (
                <NavLink to="/teacher/students/import-export" className={studentsTabClass} role="tab">
                  Import / Export
                </NavLink>
              ) : (
                <span
                  className="inline-flex cursor-not-allowed items-center border-b-2 border-transparent px-4 py-3 text-sm font-semibold tracking-tight text-secondary-200/50 opacity-80"
                  title="Droits insuffisants"
                  aria-disabled="true"
                >
                  Import / Export
                </span>
              )}
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
