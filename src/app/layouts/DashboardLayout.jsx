import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  PieChart,
  Settings,
  Upload,
  User,
  UserCog,
  Users,
  X,
} from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { PEDAGOGY_SECTION_TABS } from '@/features/teacherFacultyDashboard/pedagogy/pedagogyNav.constants'
import { AcademicYearNavPicker } from '@/features/academicYear/ui/AcademicYearNavPicker'
import { UserProfileMenu } from '@/features/auth/ui/UserProfileMenu'
import { useAuth } from '@/features/auth/model/AuthContext'
import { ThemeLampToggle } from '@/features/theme/ui/ThemeControls'
import { canAccessAcademie, canAccessRule, isSimpleTeacherProfile } from '@/core/accessControl'
import { cn } from '@/shared/lib/cn'
import { Spinner } from '@/shared/ui/Spinner'

const SIDEBAR_STORAGE_KEY = 'gestion_ci.sidebar.collapsed'

/** Aligné sur le breakpoint `md` de Tailwind (contenu pleine largeur & drawer par-dessus en dessous). */
const MOBILE_MAX_BREAKPOINT = 768

/** Largeur repliée / dépliée — garder aligné avec `pl-*` du contenu principal. */
const SIDEBAR_W = {
  expanded: 280,
  collapsed: 76,
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(`(min-width: ${MOBILE_MAX_BREAKPOINT}px)`).matches : true,
  )
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MOBILE_MAX_BREAKPOINT}px)`)
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}

const TEACHER_ROLE_LABELS = {
  teacher: 'Enseignant',
  department_head: 'Chef de département',
  study_director: 'Directeur des études',
  program_director: 'Directeur de programme',
  general_director: 'Directeur général',
}

/** Sous-lien actif (URL + règles optionnelles par entrée). */
function resolveContextualChildActive(ch, loc) {
  const { pathname, search } = loc
  if (ch.tabId) {
    return (
      pathname === '/teacher/academie' &&
      (new URLSearchParams(search).get('tab') || 'calendar') === ch.tabId
    )
  }
  if (typeof ch.isActive === 'function') {
    return ch.isActive({ pathname, search })
  }
  return pathname === ch.to || pathname.startsWith(`${ch.to}/`)
}

/**
 * Entrées sidebar enseignant : visibles selon les capacités (fusion des rôles côté API).
 * `type: 'group'` — menu contextuel (flyout) pour les entrées à sous-routes.
 */
function buildTeacherNavItems(capabilities = {}, user = null) {
  const isSimpleTeacher = isSimpleTeacherProfile(user)
  if (isSimpleTeacher) return [{ type: 'link', to: '/teacher/my-courses', label: 'Mes cours', icon: BookOpen }]
  const items = [
    { type: 'link', to: '/teacher/my-courses', label: 'Mes cours', icon: BookOpen },
    { type: 'link', to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(canAccessAcademie(user)
      ? [
          {
            type: 'group',
            id: 'academie',
            label: 'Académie',
            icon: BookOpen,
            children: PEDAGOGY_SECTION_TABS.map((t) => {
              const item = {
                tabId: t.id,
                to: `/teacher/academie?tab=${t.id}`,
                label: t.label,
                icon: t.icon,
                accessRule: t.accessRule,
              }
              return item
            }),
          },
        ]
      : []),
    {
      type: 'group',
      id: 'students',
      label: 'Étudiants',
      icon: Users,
      children: [
        {
          to: '/teacher/students/list',
          label: 'Dashboard',
          icon: Users,
          required: 'can_view_students',
          isActive: ({ pathname }) =>
            pathname.startsWith('/teacher/students') &&
            !pathname.includes('/import-export') &&
            !pathname.includes('/grades-import'),
        },
        {
          to: '/teacher/students/import-export',
          label: 'Import / export',
          icon: Upload,
          required: 'can_import_data',
          isActive: ({ pathname }) => pathname.startsWith('/teacher/students/import-export'),
        },
        {
          to: '/teacher/students/grades-import',
          label: 'Import des notes',
          icon: Upload,
          requiredAny: ['can_edit_grades'],
          accessRule: {
            requireTeacherRoles: ['study_director', 'general_director'],
            anyCapabilities: ['can_edit_grades'],
          },
          isActive: ({ pathname }) => pathname.startsWith('/teacher/students/grades-import'),
        },
      ],
    },
    {
      type: 'group',
      id: 'faculty',
      label: 'Enseignants',
      icon: UserCog,
      children: [
        {
          to: '/teacher/faculty/list',
          label: 'Dashboard',
          icon: UserCog,
          required: 'can_provision_teacher',
          isActive: ({ pathname }) =>
            pathname.startsWith('/teacher/faculty') &&
            !pathname.startsWith('/teacher/faculty/course-assignments') &&
            !pathname.includes('/teacher/faculty/import-export'),
        },
        {
          to: '/teacher/faculty/import-export',
          label: 'Import enseignants',
          icon: Upload,
          required: 'can_provision_teacher',
          isActive: ({ pathname }) => pathname.startsWith('/teacher/faculty/import-export'),
        },
        {
          to: '/teacher/faculty/course-assignments',
          label: 'Affectations cours',
          icon: Link2,
          required: 'can_manage_courses',
          isActive: ({ pathname }) => pathname.startsWith('/teacher/faculty/course-assignments'),
        },
      ],
    },
    { type: 'link', to: '/teacher/reports', label: 'Rapports', icon: PieChart, required: 'can_view_reports' },
  ]

  return items
    .map((it) => {
      if (it.type === 'group') {
        const children = it.children.filter((ch) => {
          if (ch.accessRule) return canAccessRule(user, ch.accessRule)
          if (ch.requiredAny?.length) return ch.requiredAny.some((k) => Boolean(capabilities[k]))
          if (ch.required) return Boolean(capabilities[ch.required])
          return true
        })
        return children.length ? { ...it, children } : null
      }
      if (it.requiredAny?.length) return it.requiredAny.some((k) => Boolean(capabilities[k])) ? it : null
      if (it.required) return capabilities[it.required] ? it : null
      return it
    })
    .filter(Boolean)
}

function TeacherNavContextualGroup({ group, collapsed, onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 })

  const flyoutId = `sidebar-flyout-${group.id}`

  const childActive = useMemo(
    () => group.children.some((ch) => resolveContextualChildActive(ch, location)),
    [group.children, location.pathname, location.search],
  )

  useLayoutEffect(() => {
    if (!open) return undefined
    function updatePos() {
      const el = triggerRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const gap = 8
      const panelW = 256
      let left = r.right + gap
      if (left + panelW > window.innerWidth - 10) left = Math.max(10, window.innerWidth - panelW - 10)
      setPanelPos({ top: r.top, left })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open, collapsed, location.pathname, location.search])

  useEffect(() => {
    if (!open) return undefined
    function onDocMouseDown(e) {
      const t = e.target
      if (triggerRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const Icon = group.icon
  const primaryChild = group.children[0]

  const flyout = open
    ? createPortal(
        <div
          ref={panelRef}
          id={flyoutId}
          role="menu"
          aria-label={`Sous-menu ${group.label}`}
          style={{
            position: 'fixed',
            top: panelPos.top,
            left: panelPos.left,
            zIndex: 100,
            maxWidth: 'min(16rem, calc(100vw - 1rem))',
          }}
          className={cn(
            'rounded-xl border border-[var(--app-border)] bg-[var(--app-sidebar)] py-2 shadow-2xl',
            'ring-1 ring-black/[0.06] dark:ring-white/[0.08]',
          )}
        >
          <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--app-sidebar-muted)]">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5 px-1.5 pb-0.5">
            {group.children.map((ch) => {
              const CIcon = ch.icon
              return (
                <NavLink
                  key={ch.tabId ?? ch.to}
                  to={ch.to}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    onNavigate?.()
                  }}
                  className={() => {
                    const active = resolveContextualChildActive(ch, location)
                    return cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold tracking-tight outline-none',
                      'transition-[color,background-color] duration-150',
                      'focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-sidebar)]',
                      active
                        ? 'bg-gradient-to-r from-brand-500/[0.16] to-brand-600/[0.08] text-brand-800 dark:from-white/[0.12] dark:to-white/[0.05] dark:text-white'
                        : 'text-[var(--app-nav-fg)] hover:bg-[var(--app-nav-hover)] hover:text-[var(--app-nav-fg-strong)]',
                    )
                  }}
                >
                  <CIcon size={17} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
                  <span className="truncate">{ch.label}</span>
                </NavLink>
              )
            })}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="relative w-full">
      {collapsed ? (
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={flyoutId}
          title={group.label}
          onClick={() => setOpen((v) => !v)}
          className={cn(sidebarNavLinkClass({ isActive: childActive || open, collapsed }), 'w-full')}
        >
          <Icon size={20} strokeWidth={2} className="shrink-0 opacity-100" aria-hidden />
          <span className="sr-only">{group.label}</span>
        </button>
      ) : (
        <div className={cn(sidebarNavLinkClass({ isActive: childActive || open, collapsed: false }), 'w-full pr-2')}>
          <button
            type="button"
            onClick={() => {
              if (!primaryChild) return
              setOpen(false)
              navigate(primaryChild.to)
              onNavigate?.()
            }}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
            title={group.label}
          >
            <Icon size={19} strokeWidth={2} className="shrink-0 opacity-90" aria-hidden />
            <span className="flex-1 truncate">{group.label}</span>
          </button>
          <button
            ref={triggerRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={flyoutId}
            aria-label={open ? `Refermer le sous-menu ${group.label}` : `Ouvrir le sous-menu ${group.label}`}
            onClick={(e) => {
              e.stopPropagation()
              setOpen((v) => !v)
            }}
            className={cn(
              'ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--app-sidebar-muted)]',
              'hover:bg-[var(--app-nav-hover)] hover:text-[var(--app-sidebar-fg)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
            )}
          >
            <ChevronRight size={15} strokeWidth={2} className={cn('transition-transform', open && 'rotate-90')} aria-hidden />
          </button>
        </div>
      )}
      {flyout}
    </div>
  )
}

function buildStudentNavItems(capabilities = {}) {
  const items = [
    { to: '/student/dashboard', label: 'Accueil', icon: LayoutDashboard },
    { to: '/student/courses', label: 'Cours', icon: BookOpen },
    { to: '/student/grades', label: 'Notes', icon: FileText },
    { to: '/student/enrollments', label: 'Inscriptions', icon: GraduationCap },
  ]
  if (capabilities?.can_manage_promotion) {
    items.push({ to: '/student/promotion', label: 'Ma promotion', icon: Users })
  }
  return items
}

function StudentBottomNav({ items, onNavigate }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[95] border-t border-[var(--app-border)] bg-[var(--app-elevated)]/95 backdrop-blur-md safe-area-pb"
      aria-label="Navigation mobile étudiant"
    >
      <ul className="flex items-stretch justify-around gap-0 px-1 py-1">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <li key={it.to} className="flex-1 min-w-0">
              <NavLink
                to={it.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-semibold leading-tight',
                    isActive ? 'text-brand-700 dark:text-brand-200' : 'text-[var(--app-muted)]',
                  )
                }
              >
                <Icon size={20} strokeWidth={2} aria-hidden />
                <span className="truncate max-w-full">{it.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function userRolePresentation(user) {
  if (!user) return { title: 'Invité', subtitle: '' }
  if (user.role === 'student') return { title: 'Étudiant', subtitle: user.matricule ?? '' }
  if (user.role === 'teacher') {
    const codes = user.teacher_role_codes ?? []
    const priority = ['general_director', 'study_director', 'department_head', 'program_director', 'teacher']
    const code = priority.find((c) => codes.includes(c)) ?? codes[0] ?? 'teacher'
    const label = TEACHER_ROLE_LABELS[code] ?? (code === 'teacher' ? 'Enseignant' : String(code).replace(/_/g, ' '))
    return { title: label, subtitle: user.matricule ?? '' }
  }
  return { title: user.role ?? 'Utilisateur', subtitle: user.matricule ?? '' }
}

function sidebarNavLinkClass({ isActive, collapsed }) {
  return cn(
    'group relative flex items-center rounded-xl text-[13px] font-semibold tracking-tight outline-none',
    'transition-[color,background-color,box-shadow,transform,border-color] duration-200 ease-out',
    'focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-sidebar)]',
    'border border-transparent',
    collapsed ? 'justify-center w-11 h-11 mx-auto shrink-0' : 'gap-3 px-3 py-2.5 min-h-[2.75rem]',
    isActive
      ? cn(
          'text-brand-700 dark:text-white',
          'bg-gradient-to-r from-brand-500/[0.14] to-brand-600/[0.06] dark:from-white/[0.1] dark:to-white/[0.04]',
          'border-brand-200/60 dark:border-white/[0.08]',
          'shadow-sm',
          'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] before:rounded-full before:bg-secondary-500 before:content-[""]',
          collapsed && 'before:h-[55%]',
        )
      : cn(
          'text-[var(--app-nav-fg)]',
          'hover:text-[var(--app-nav-fg-strong)] hover:bg-[var(--app-nav-hover)]',
          'active:scale-[0.98]',
        ),
  )
}

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { academicYearLabel, academicYearId, isAcademicYearSwitching } = useAcademicYear()

  const isDesktop = useIsDesktop()
  const [mobileOpen, setMobileOpen] = useState(false)

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  })

  const isMobileMode = !isDesktop

  useEffect(() => {
    if (isDesktop) setMobileOpen(false)
  }, [isDesktop])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const onSidebarPref = () => {
      if (typeof window === 'undefined') return
      setCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1')
    }
    window.addEventListener('gestion_ci:sidebar-pref-changed', onSidebarPref)
    return () => window.removeEventListener('gestion_ci:sidebar-pref-changed', onSidebarPref)
  }, [])

  useEffect(() => {
    if (isMobileMode && mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return undefined
  }, [isMobileMode, mobileOpen])

  useEffect(() => {
    if (!isMobileMode || !mobileOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isMobileMode, mobileOpen])

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const toggleSidebar = useCallback(() => setCollapsed((c) => !c), [])
  const closeMobileNav = useCallback(() => setMobileOpen(false), [])
  const toggleMobileNav = useCallback(() => setMobileOpen((o) => !o), [])

  const sidebarWidth = isMobileMode
    ? SIDEBAR_W.expanded
    : collapsed
      ? SIDEBAR_W.collapsed
      : SIDEBAR_W.expanded
  /** En drawer mobile, la barre est toujours en mode déplié (lecture confortable). */
  const effectiveCollapsed = isMobileMode ? false : collapsed
  const rolePresentation = useMemo(() => userRolePresentation(user), [user])
  const simpleTeacher = useMemo(() => isSimpleTeacherProfile(user), [user])

  const navItems = useMemo(() => {
    if (user?.role === 'teacher') return buildTeacherNavItems(user?.capabilities ?? {}, user)
    if (user?.role === 'student') return buildStudentNavItems(user?.capabilities ?? {})
    return []
  }, [user])

  async function handleSignOut() {
    await signOut()
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-[var(--app-canvas)] text-[var(--app-fg)]">
      {/* ── Sidebar ── */}
      <aside
        style={{ width: sidebarWidth }}
        className={cn(
          'fixed top-0 left-0 h-screen flex flex-col',
          isMobileMode ? 'z-[90] transition-[transform] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]' : 'z-50 transition-[width] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]',
          isMobileMode && (mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'),
          !isMobileMode && 'translate-x-0',
          'bg-[var(--app-sidebar)] border-r border-[var(--app-sidebar-border)]',
          'shadow-[4px_0_24px_-8px_rgba(15,23,42,0.08)] dark:shadow-[6px_0_32px_-6px_rgba(0,0,0,0.45)]',
          'overflow-hidden',
        )}
        aria-label="Navigation principale"
        aria-hidden={isMobileMode && !mobileOpen}
      >
        {/* Tête : marque + repli */}
        <div
          className={cn(
            'flex items-center shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-sidebar)_96%,white)] dark:bg-[color-mix(in_srgb,var(--app-sidebar)_88%,black)]',
            effectiveCollapsed ? 'flex-col gap-2 px-2 pt-4 pb-3' : 'justify-between gap-2 pl-3 pr-2 pt-4 pb-3.5',
          )}
        >
          <Link
            to={user?.role === 'student' ? '/student/dashboard' : isSimpleTeacherProfile(user) ? '/teacher/my-courses' : '/teacher/dashboard'}
            onClick={isMobileMode ? closeMobileNav : undefined}
            className={cn(
              'flex items-center min-w-0 rounded-xl outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-sidebar)]',
              effectiveCollapsed ? 'flex-col gap-1.5' : 'gap-3 flex-1',
            )}
            title="Gestion CI — accueil"
          >
            <span
              className={cn(
                'flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white font-heading font-bold tracking-tight shadow-md ring-1 ring-black/5 dark:ring-white/10',
                effectiveCollapsed ? 'w-10 h-10 text-sm' : 'w-10 h-10 text-sm',
              )}
              aria-hidden
            >
              CI
            </span>
            <span
              className={cn(
                'font-heading font-semibold text-[var(--app-sidebar-fg)] text-[15px] leading-tight tracking-tight transition-[opacity,max-width] duration-300 ease-out overflow-hidden whitespace-nowrap',
                effectiveCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]',
              )}
            >
              Gestion CI
            </span>
          </Link>
          <button
            type="button"
            className={cn(
              'flex items-center justify-center rounded-lg text-[var(--app-sidebar-muted)]',
              'hover:text-[var(--app-sidebar-fg)] hover:bg-[var(--app-nav-hover)] active:scale-[0.96]',
              'transition-[color,background-color,transform] duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-sidebar)]',
              effectiveCollapsed ? 'h-8 w-8' : 'h-8 w-8 shrink-0',
            )}
            onClick={isMobileMode ? closeMobileNav : toggleSidebar}
            aria-expanded={isMobileMode ? mobileOpen : !collapsed}
            aria-controls="dashboard-sidebar-nav"
            title={isMobileMode ? 'Fermer le menu' : effectiveCollapsed ? 'Déplier le menu' : 'Replier le menu'}
          >
            {isMobileMode ? (
              <X size={17} strokeWidth={2} />
            ) : effectiveCollapsed ? (
              <ChevronsRight size={17} strokeWidth={2} />
            ) : (
              <ChevronsLeft size={17} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Profil compact */}
        <div
          className={cn(
            'shrink-0 border-b border-[var(--app-border)] px-3 py-3',
            effectiveCollapsed ? 'flex justify-center' : '',
          )}
        >
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl border border-[var(--app-border)]/80 bg-[color-mix(in_srgb,var(--app-sidebar)_92%,white)] px-2.5 py-2 dark:bg-[color-mix(in_srgb,var(--app-sidebar)_94%,black)]',
              effectiveCollapsed && 'justify-center border-transparent bg-transparent p-0',
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 ring-2 ring-white/80 dark:from-brand-500/25 dark:to-brand-700/35 dark:text-brand-100 dark:ring-white/5',
                effectiveCollapsed ? 'w-10 h-10' : 'w-9 h-9',
              )}
              aria-hidden
            >
              <User size={effectiveCollapsed ? 18 : 16} strokeWidth={2} />
            </span>
            <div
              className={cn(
                'min-w-0 flex-1 transition-[opacity,max-width] duration-300 ease-out overflow-hidden',
                effectiveCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[220px]',
              )}
            >
              <p className="text-xs font-semibold text-[var(--app-sidebar-fg)] truncate leading-snug">
                {rolePresentation.title}
              </p>
              {rolePresentation.subtitle ? (
                <p className="text-[11px] text-[var(--app-sidebar-muted)] truncate font-mono tabular-nums mt-0.5">
                  {rolePresentation.subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Navigation principale */}
        <nav
          id="dashboard-sidebar-nav"
          className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 flex flex-col gap-1 min-h-0"
          aria-label="Menu principal"
        >
          {!effectiveCollapsed ? (
            <p className="px-2.5 pt-0.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--app-sidebar-muted)]">
              Menu principal
            </p>
          ) : (
            <span className="sr-only">Menu principal</span>
          )}
          {navItems.map((it) => {
            if (it.type === 'group') {
              return (
                <TeacherNavContextualGroup
                  key={it.id}
                  group={it}
                  collapsed={effectiveCollapsed}
                  onNavigate={isMobileMode ? closeMobileNav : undefined}
                />
              )
            }
            const Icon = it.icon
            return (
              <NavLink
                key={it.to}
                to={it.to}
                onClick={isMobileMode ? closeMobileNav : undefined}
                title={effectiveCollapsed ? it.label : undefined}
                className={({ isActive }) => {
                  const active = it.isActive ? it.isActive({ pathname: location.pathname }) : isActive
                  return sidebarNavLinkClass({ isActive: active, collapsed: effectiveCollapsed })
                }}
              >
                <Icon
                  size={effectiveCollapsed ? 20 : 19}
                  strokeWidth={2}
                  className={cn('shrink-0 opacity-90', effectiveCollapsed && 'opacity-100')}
                  aria-hidden
                />
                <span
                  className={cn(
                    'transition-[opacity,max-width] duration-300 ease-out overflow-hidden whitespace-nowrap',
                    effectiveCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]',
                  )}
                >
                  {it.label}
                </span>
              </NavLink>
            )
          })}
        </nav>

        {/* Pied : contexte + actions */}
        <div className="border-t border-[var(--app-border)] px-2.5 pt-3 pb-4 flex flex-col gap-2 shrink-0 bg-[color-mix(in_srgb,var(--app-sidebar)_94%,white)] dark:bg-[color-mix(in_srgb,var(--app-sidebar)_92%,black)]">
          <div
            className={cn(
              'flex items-center gap-2.5 rounded-xl border border-dashed border-[var(--app-border)]/90 bg-[color-mix(in_srgb,var(--app-sidebar)_88%,white)] px-2.5 py-2 text-[11px] text-[var(--app-sidebar-muted)] dark:bg-[color-mix(in_srgb,var(--app-sidebar)_88%,black)]',
              effectiveCollapsed && 'justify-center border-none bg-transparent px-0',
            )}
            title={effectiveCollapsed ? `Année : ${academicYearLabel ?? '—'}` : undefined}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary-500/15 text-secondary-600 dark:text-secondary-400">
              <Calendar size={15} strokeWidth={2} aria-hidden />
            </span>
            <span
              className={cn(
                'min-w-0 leading-snug transition-[opacity,max-width] duration-300 ease-out overflow-hidden',
                effectiveCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]',
              )}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--app-sidebar-muted)]">
                Année académique
              </span>
              <span className="block font-semibold text-[var(--app-sidebar-fg)] truncate">{academicYearLabel ?? '—'}</span>
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {simpleTeacher ? null : (
              <NavLink
                to="/settings"
                onClick={isMobileMode ? closeMobileNav : undefined}
                title={effectiveCollapsed ? 'Paramètres' : undefined}
                className={({ isActive }) => sidebarNavLinkClass({ isActive, collapsed: effectiveCollapsed })}
              >
                <Settings size={effectiveCollapsed ? 20 : 19} strokeWidth={2} className="shrink-0" aria-hidden />
                <span
                  className={cn(
                    'transition-[opacity,max-width] duration-300 ease-out overflow-hidden whitespace-nowrap',
                    effectiveCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]',
                  )}
                >
                  Paramètres
                </span>
              </NavLink>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              title={effectiveCollapsed ? 'Déconnexion' : undefined}
              className={cn(
                sidebarNavLinkClass({ isActive: false, collapsed: effectiveCollapsed }),
                'w-full text-left text-red-700 hover:bg-red-500/[0.08] hover:text-red-800 dark:text-red-300 dark:hover:bg-red-500/10 dark:hover:text-red-200',
              )}
            >
              <LogOut size={effectiveCollapsed ? 20 : 19} strokeWidth={2} className="shrink-0" aria-hidden />
              <span
                className={cn(
                  'transition-[opacity,max-width] duration-300 ease-out overflow-hidden whitespace-nowrap',
                  effectiveCollapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[200px]',
                )}
              >
                Déconnexion
              </span>
            </button>
          </div>
        </div>
      </aside>

      {isMobileMode && mobileOpen ? (
        <div
          className="fixed z-[80] top-14 left-0 right-0 bottom-0 bg-slate-900/40 backdrop-blur-[2px] dark:bg-black/55"
          onClick={closeMobileNav}
          role="presentation"
          aria-hidden
        />
      ) : null}

      {/* ── Contenu principal ── */}
      <div
        className="flex min-w-0 flex-1 flex-col min-h-screen transition-[padding-left] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] relative"
        style={{ paddingLeft: isMobileMode ? 0 : collapsed ? SIDEBAR_W.collapsed : SIDEBAR_W.expanded }}
      >
        {isAcademicYearSwitching ? (
          <div
            className="absolute inset-0 z-[110] flex flex-col items-center justify-center gap-3 bg-[var(--app-canvas)]/88 backdrop-blur-[3px] px-6"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Spinner size="lg" label="Chargement des données pour l’année sélectionnée" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 text-center max-w-sm">
              Mise à jour de l’interface pour l’année académique sélectionnée…
            </p>
          </div>
        ) : null}

        {/* Topbar : bouton menu au-dessus du voile (mobile) pour ouvrir / fermer le tiroir */}
        <header
          className={cn(
            'sticky top-0 z-[100] md:z-40 h-14 bg-[var(--app-elevated)] border-b border-[var(--app-border)] flex items-center px-4 sm:px-6',
            isAcademicYearSwitching && 'pointer-events-none opacity-50',
          )}
        >
          <div className="flex items-center justify-between w-full gap-2 md:gap-4 min-w-0">
            <div className="flex items-center min-w-0 flex-1 gap-2">
              <button
                type="button"
                className="md:hidden shrink-0 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--app-fg)] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={toggleMobileNav}
                aria-expanded={mobileOpen}
                aria-controls="dashboard-sidebar-nav"
                aria-label={mobileOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
              >
                {mobileOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
              </button>
              <div className="min-w-0 flex-1">
                {user?.role === 'student' ? (
                  <p className="truncate text-sm font-medium text-[var(--app-muted)]">
                    Année académique courante · espace étudiant
                  </p>
                ) : (
                  <AcademicYearNavPicker />
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ThemeLampToggle />
              <UserProfileMenu />
            </div>
          </div>
        </header>

        {/* Page content — clé = année pour remonter les écrans et relancer les effets / requêtes */}
        <main
          className={cn(
            'min-w-0 flex-1 p-6',
            isAcademicYearSwitching && 'pointer-events-none',
            user?.role === 'student' && 'pb-24 md:pb-6',
          )}
        >
          <Outlet key={user?.role === 'student' ? 'student' : academicYearId ?? 'ay-none'} />
        </main>

        {user?.role === 'student' ? (
          <StudentBottomNav items={navItems} onNavigate={isMobileMode ? closeMobileNav : undefined} />
        ) : null}
      </div>
    </div>
  )
}
