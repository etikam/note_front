import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, ChevronsLeft, ChevronsRight, LogOut, Menu, Settings, X } from 'lucide-react'

import { buildStaffNavigation, buildStudentNavigation } from '@/app/layouts/navigation'
import { homePathFor, primaryRole } from '@/features/access/model/access'
import { useAccess } from '@/features/access/model/useAccess'
import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { AcademicYearNavPicker } from '@/features/academicYear/ui/AcademicYearNavPicker'
import { UserProfileMenu } from '@/features/auth/ui/UserProfileMenu'
import { SearchTrigger } from '@/features/search/ui/CommandPalette'
import { useAuth } from '@/features/auth/model/AuthContext'
import { ThemeLampToggle } from '@/features/theme/ui/ThemeControls'
import { cn } from '@/shared/lib/cn'
import { Avatar } from '@/shared/ui/Avatar'
import { Spinner } from '@/shared/ui/Spinner'

const SIDEBAR_STORAGE_KEY = 'gestion_ci.sidebar.collapsed'
const MOBILE_MAX_BREAKPOINT = 768
const SIDEBAR_W = { expanded: 264, collapsed: 72 }

function useIsDesktop() {
  const query = `(min-width: ${MOBILE_MAX_BREAKPOINT}px)`
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : true))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return isDesktop
}

function navItemClass({ isActive, collapsed }) {
  return cn(
    'group relative flex items-center rounded-lg text-[13px] font-medium outline-none transition-colors duration-150',
    'focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--app-sidebar)]',
    collapsed ? 'mx-auto h-10 w-10 justify-center' : 'h-9 gap-2.5 px-2.5',
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-white/[0.08] dark:text-white'
      : 'text-[var(--app-nav-fg)] hover:bg-[var(--app-nav-hover)] hover:text-[var(--app-nav-fg-strong)]',
  )
}

function SidebarLabel({ collapsed, children }) {
  return (
    <span
      className={cn(
        'overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200',
        collapsed ? 'max-w-0 opacity-0' : 'max-w-[190px] opacity-100',
      )}
    >
      {children}
    </span>
  )
}

function NavItem({ item, collapsed, onNavigate }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) => navItemClass({ isActive, collapsed })}
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed ? (
            <span className="absolute -left-2.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-secondary-500" aria-hidden />
          ) : null}
          <Icon size={collapsed ? 19 : 17} strokeWidth={2} className="shrink-0" aria-hidden />
          <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
        </>
      )}
    </NavLink>
  )
}

function StudentBottomNav({ items }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[95] border-t border-[var(--app-border)] bg-[var(--app-elevated)]/95 backdrop-blur-md md:hidden"
      aria-label="Navigation mobile étudiant"
    >
      <ul className="flex items-stretch justify-around px-1 py-1">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <li key={it.to} className="min-w-0 flex-1">
              <NavLink
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold',
                    isActive ? 'text-brand-700 dark:text-brand-200' : 'text-[var(--app-muted)]',
                  )
                }
              >
                <Icon size={20} strokeWidth={2} aria-hidden />
                <span className="max-w-full truncate">{it.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function identityOf(user) {
  if (!user) return { title: 'Invité', subtitle: '' }
  if (user.role === 'student') return { title: user.full_name || 'Étudiant', subtitle: `Étudiant · ${user.matricule ?? ''}` }
  const role = primaryRole(user)
  if (!role || role.scope_level === 'own') return { title: user.full_name || user.matricule, subtitle: 'Enseignant' }
  const target = role.scope_level === 'institution' ? '' : ` · ${role.target_label}`
  return { title: user.full_name || user.matricule, subtitle: `${role.role_name}${target}` }
}

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const access = useAccess()
  const navigate = useNavigate()
  const location = useLocation()
  const { academicYearLabel, academicYearId, isAcademicYearSwitching } = useAcademicYear()

  const isDesktop = useIsDesktop()
  const isMobile = !isDesktop
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1',
  )

  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [isDesktop])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    const onPref = () => setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1')
    window.addEventListener('gestion_ci:sidebar-pref-changed', onPref)
    return () => window.removeEventListener('gestion_ci:sidebar-pref-changed', onPref)
  }, [])

  useEffect(() => {
    if (!isMobile || !mobileOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [isMobile, mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const isStudent = user?.role === 'student'
  const effectiveCollapsed = isMobile ? false : collapsed
  const sidebarWidth = isMobile || !collapsed ? SIDEBAR_W.expanded : SIDEBAR_W.collapsed
  const identity = useMemo(() => identityOf(user), [user])

  const sections = useMemo(() => (user?.role === 'teacher' ? buildStaffNavigation(access) : []), [user, access])
  const studentItems = useMemo(() => (isStudent ? buildStudentNavigation(user?.capabilities) : []), [isStudent, user])
  const onNavigate = isMobile ? closeMobile : undefined

  async function handleSignOut() {
    await signOut()
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-[var(--app-canvas)] text-[var(--app-fg)]">
      <aside
        style={{ width: sidebarWidth }}
        aria-label="Navigation principale"
        aria-hidden={isMobile && !mobileOpen}
        className={cn(
          'fixed left-0 top-0 flex h-screen flex-col overflow-hidden border-r border-[var(--app-sidebar-border)] bg-[var(--app-sidebar)]',
          'transition-[width,transform] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]',
          isMobile ? 'z-[90] shadow-2xl' : 'z-50',
          isMobile && !mobileOpen && 'pointer-events-none -translate-x-full',
        )}
      >
        <div className={cn('flex h-14 shrink-0 items-center border-b border-[var(--app-border)]', effectiveCollapsed ? 'justify-center px-2' : 'justify-between pl-4 pr-2')}>
          <Link
            to={homePathFor(user)}
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
            title="Gestion CI — accueil"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 font-heading text-[13px] font-bold text-white shadow-sm" aria-hidden>
              CI
            </span>
            {!effectiveCollapsed ? (
              <span className="truncate font-heading text-[15px] font-semibold tracking-tight text-[var(--app-sidebar-fg)]">Gestion CI</span>
            ) : null}
          </Link>
          {!effectiveCollapsed ? (
            <button
              type="button"
              onClick={isMobile ? closeMobile : () => setCollapsed(true)}
              title={isMobile ? 'Fermer le menu' : 'Replier le menu'}
              aria-label={isMobile ? 'Fermer le menu' : 'Replier le menu'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--app-sidebar-muted)] hover:bg-[var(--app-nav-hover)] hover:text-[var(--app-sidebar-fg)]"
            >
              {isMobile ? <X size={17} aria-hidden /> : <ChevronsLeft size={17} aria-hidden />}
            </button>
          ) : null}
        </div>

        <nav id="dashboard-sidebar-nav" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-2.5 py-4" aria-label="Menu principal">
          {effectiveCollapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              title="Déplier le menu"
              aria-label="Déplier le menu"
              className={navItemClass({ isActive: false, collapsed: true })}
            >
              <ChevronsRight size={18} aria-hidden />
            </button>
          ) : null}
          {isStudent ? (
            <div className="flex flex-col gap-0.5">
              {studentItems.map((it) => (
                <NavItem key={it.to} item={it} collapsed={effectiveCollapsed} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id} className="flex flex-col gap-0.5">
                {effectiveCollapsed ? (
                  <span className="mx-auto mb-1 h-px w-6 bg-[var(--app-border)]" aria-hidden />
                ) : (
                  <p className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--app-sidebar-muted)]">
                    {section.label}
                  </p>
                )}
                {section.items.map((it) => (
                  <NavItem key={it.to} item={it} collapsed={effectiveCollapsed} onNavigate={onNavigate} />
                ))}
              </div>
            ))
          )}
        </nav>

        <div className="flex shrink-0 flex-col gap-1 border-t border-[var(--app-border)] px-2.5 py-3">
          {!isStudent ? (
            <div
              className={cn('mb-1 flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--app-sidebar-muted)]', effectiveCollapsed && 'justify-center px-0')}
              title={effectiveCollapsed ? `Année : ${academicYearLabel ?? '—'}` : undefined}
            >
              <Calendar size={15} className="shrink-0 text-secondary-600 dark:text-secondary-400" aria-hidden />
              {!effectiveCollapsed ? (
                <span className="truncate">
                  Année <span className="font-semibold text-[var(--app-sidebar-fg)]">{academicYearLabel ?? '—'}</span>
                </span>
              ) : null}
            </div>
          ) : null}
          {access.isManager ? (
            <NavItem item={{ to: '/settings', label: 'Paramètres', icon: Settings }} collapsed={effectiveCollapsed} onNavigate={onNavigate} />
          ) : null}
          <button
            type="button"
            onClick={handleSignOut}
            title={effectiveCollapsed ? 'Déconnexion' : undefined}
            className={cn(navItemClass({ isActive: false, collapsed: effectiveCollapsed }), 'w-full text-left hover:text-red-700 dark:hover:text-red-300')}
          >
            <LogOut size={effectiveCollapsed ? 19 : 17} className="shrink-0" aria-hidden />
            <SidebarLabel collapsed={effectiveCollapsed}>Déconnexion</SidebarLabel>
          </button>
          <Link
            to="/profile"
            onClick={onNavigate}
            title={effectiveCollapsed ? `${identity.title} — ${identity.subtitle}` : undefined}
            className={cn(
              'mt-1 flex items-center gap-2.5 rounded-lg border border-[var(--app-border)] p-2 outline-none hover:bg-[var(--app-nav-hover)] focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
              effectiveCollapsed && 'justify-center border-transparent p-1',
            )}
          >
            <Avatar name={identity.title} src={user?.photo_url} size="sm" />
            {!effectiveCollapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold text-[var(--app-sidebar-fg)]">{identity.title}</span>
                <span className="block truncate text-[11px] text-[var(--app-sidebar-muted)]">{identity.subtitle}</span>
              </span>
            ) : null}
          </Link>
        </div>
      </aside>

      {isMobile && mobileOpen ? (
        <div className="fixed inset-0 z-[80] bg-[var(--app-overlay)]" onClick={closeMobile} role="presentation" aria-hidden />
      ) : null}

      <div
        className="relative flex min-h-screen min-w-0 flex-1 flex-col transition-[padding-left] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
        style={{ paddingLeft: isMobile ? 0 : sidebarWidth }}
      >
        {isAcademicYearSwitching ? (
          <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center gap-3 bg-[var(--app-canvas)]/88 px-6 backdrop-blur-[3px]" role="status" aria-live="polite" aria-busy="true">
            <Spinner size="lg" label="Chargement des données pour l’année sélectionnée" />
            <p className="max-w-sm text-center text-sm font-medium text-[var(--app-muted)]">Mise à jour pour l’année académique sélectionnée…</p>
          </div>
        ) : null}

        <header
          className={cn(
            'sticky top-0 z-40 flex h-14 items-center border-b border-[var(--app-border)] bg-[var(--app-elevated)]/90 px-4 backdrop-blur-md sm:px-6',
            isAcademicYearSwitching && 'pointer-events-none opacity-50',
          )}
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-[var(--app-hover)] md:hidden"
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
                aria-controls="dashboard-sidebar-nav"
                aria-label={mobileOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
              >
                {mobileOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
              </button>
              {isStudent ? (
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--app-muted)]">Année académique courante · espace étudiant</p>
              ) : (
                <>
                  <div className="shrink-0">
                    <AcademicYearNavPicker />
                  </div>
                  <div className="flex min-w-0 flex-1 justify-center px-1">
                    <SearchTrigger />
                  </div>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ThemeLampToggle />
              <UserProfileMenu />
            </div>
          </div>
        </header>

        <main className={cn('min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8', isAcademicYearSwitching && 'pointer-events-none', isStudent && 'pb-24 md:pb-6')}>
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet key={isStudent ? 'student' : academicYearId ?? 'ay-none'} />
          </div>
        </main>

        {isStudent ? <StudentBottomNav items={studentItems} /> : null}
      </div>
    </div>
  )
}
