import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, BookOpen, Download, Upload, Users, Waypoints } from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAuth } from '@/features/auth/model/AuthContext'
import { canAdminGradeImport } from '@/core/accessControl'
import { TeacherGradesImportPage } from '@/features/teacher/students/TeacherGradesImportPage'
import { OverviewTab } from '@/features/teacherFacultyDashboard/overview/OverviewTab'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui'

const DASHBOARD_TAB_KEY = 'gestion_ci.dashboard.facultyTab'

const DASHBOARD_TABS = [
  { id: 'overview', label: "Vue d'ensemble", description: "Statistiques filtrées : effectifs, graphique par niveau et répartitions." },
]

function QuickActionGridItem({ ok, to, icon: Icon, label, desc }) {
  return ok ? (
    <Link
      className="group flex flex-col gap-2.5 rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_98%,var(--app-canvas))] p-4 transition-all duration-200 hover:border-secondary-400/60 hover:shadow-md dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)] dark:hover:border-secondary-500/35"
      to={to}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 transition-all duration-200 group-hover:bg-secondary-500 group-hover:text-white group-hover:ring-secondary-600 dark:text-secondary-200 dark:ring-secondary-500/25 dark:group-hover:bg-secondary-500">
        <Icon size={18} strokeWidth={2} aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--app-fg)]">{label}</p>
        <p className="text-xs text-[var(--app-muted)]">{desc}</p>
      </div>
    </Link>
  ) : (
    <span
      className="flex cursor-not-allowed flex-col gap-2.5 rounded-xl border border-[var(--app-border)]/60 bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] p-4 opacity-55 dark:bg-white/[0.03]"
      aria-disabled="true"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--app-elevated)_88%,var(--app-canvas))] text-[var(--app-muted)] dark:bg-white/[0.06]">
        <Icon size={18} strokeWidth={2} aria-hidden />
      </span>
      <div>
        <p className="text-sm font-semibold text-[var(--app-muted)]">{label}</p>
        <p className="text-xs text-[var(--app-muted)]">{desc}</p>
      </div>
    </span>
  )
}

function QuickActions({ canImport, canReports, canViewStudents, canViewGrades }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-[var(--app-border)] px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25">
          <Waypoints size={17} strokeWidth={2} aria-hidden />
        </span>
        <h2 className="text-sm font-semibold text-[var(--app-fg)]">Actions rapides</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        <QuickActionGridItem ok={canViewStudents} to="/teacher/students" icon={Users} label="Étudiants" desc="Liste et suivi" />
        <QuickActionGridItem ok={canViewGrades} to="/teacher/my-courses" icon={BookOpen} label="Mes cours" desc="Notation et suivi par cours" />
        <QuickActionGridItem ok={canImport} to="/teacher/import-export" icon={Upload} label="Importer" desc="Données structurées" />
        <QuickActionGridItem ok={canImport} to="/teacher/import-export" icon={Download} label="Exporter" desc="Listes et extractions" />
        <QuickActionGridItem ok={canReports} to="/teacher/reports" icon={Activity} label="Rapports" desc="Indicateurs et synthèses" />
      </div>
    </div>
  )
}

export function TeacherFacultyDashboardPage() {
  const { user } = useAuth()
  const { academicYearId } = useAcademicYear()
  const caps = user?.capabilities ?? {}
  const canImport = Boolean(caps.can_import_data)
  const canReports = Boolean(caps.can_view_reports)
  const canViewStudents = Boolean(caps.can_view_students)
  const canViewGrades = Boolean(caps.can_view_all_grades)
  const managedDeptId = user?.scope?.managed_department_id ?? null
  const institutionWide = Boolean(user?.scope?.institution_wide)
  /** KPI dashboard + stats annuaires : directeur des études ou directeur général (cumulable avec chef de département). */
  const canViewAggregatedStats = Boolean(caps.can_view_directory_aggregated_stats)
  const showGradesImportTab = canAdminGradeImport(user)

  const GRADES_IMPORT_TAB = {
    id: 'grades-import',
    label: 'Import des notes',
    description:
      'Import Excel des notes par cours : inscription automatique des étudiants du fichier, prévisualisation et résolution des conflits.',
  }

  const dashboardTabs = useMemo(() => {
    const tabs = [...DASHBOARD_TABS]
    if (showGradesImportTab) {
      tabs.push(GRADES_IMPORT_TAB)
    }
    return tabs
  }, [showGradesImportTab])

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'overview'
    const saved = window.localStorage.getItem(DASHBOARD_TAB_KEY)
    return DASHBOARD_TABS.some((t) => t.id === saved) ? saved : 'overview'
  })

  useEffect(() => {
    if (!dashboardTabs.some((t) => t.id === activeTab)) setActiveTab('overview')
  }, [dashboardTabs, activeTab])

  useEffect(() => { window.localStorage.setItem(DASHBOARD_TAB_KEY, activeTab) }, [activeTab])

  const tabMeta = dashboardTabs.find((t) => t.id === activeTab) ?? dashboardTabs[0]
  const yearLabel = academicYearId ?? 'courante'

  const onTabKeyDown = useCallback((e, id) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const idx = dashboardTabs.findIndex((t) => t.id === id)
    const next = e.key === 'ArrowRight'
      ? dashboardTabs[Math.min(dashboardTabs.length - 1, idx + 1)]
      : dashboardTabs[Math.max(0, idx - 1)]
    if (next) setActiveTab(next.id)
  }, [dashboardTabs])

  return (
    <div className="flex flex-col gap-8">
      {/* ── En-tête page ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-secondary-500/[0.07]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Pilotage</p>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
              {canViewAggregatedStats ? (
                <>
                  Indicateurs pour l’année <strong className="font-semibold text-[var(--app-fg)]">{yearLabel}</strong>
                  {' · '}
                  <span className="text-[var(--app-muted)]">
                    {managedDeptId != null && !institutionWide
                      ? `Département #${managedDeptId}`
                      : 'Périmètre global (faculté)'}
                  </span>
                </>
              ) : (
                <>
                  Les <strong className="font-semibold text-[var(--app-fg)]">indicateurs agrégés</strong> du pilotage
                  sont réservés au directeur des études ou au directeur général. Vous conservez l’accès aux{' '}
                  <strong className="font-semibold text-[var(--app-fg)]">listes</strong> (étudiants de votre périmètre,
                  annuaire enseignants).
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_92%,var(--app-canvas))] px-3 py-1.5 text-xs font-semibold text-[var(--app-fg)] dark:bg-white/[0.05]">
              {(user?.teacher_role_codes ?? ['teacher']).join(' · ')}
            </span>
            <Button variant="ghost" size="sm" disabled={!canImport}>
              Import <Upload size={13} />
            </Button>
            <Button variant="ghost" size="sm" disabled={!canImport}>
              Export <Download size={13} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Onglets + contenu (réservés aux profils avec agrégats institutionnels) ── */}
      {canViewAggregatedStats ? (
        <>
      <div className="space-y-3">
        <div
          className="overflow-hidden rounded-xl bg-brand-600 shadow-sm ring-1 ring-brand-700/30 dark:bg-brand-600 dark:ring-white/10"
          role="tablist"
          aria-label="Contextes du dashboard"
        >
          <div className="-mb-px flex min-w-0 flex-nowrap touch-pan-x divide-x divide-secondary-400/50 overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 sm:px-2 [scrollbar-width:thin]">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tfd-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`tfd-panel-${tab.id}`}
                className={cn(
                  'shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold tracking-tight transition-colors duration-200 outline-none',
                  'rounded-t-md focus-visible:ring-2 focus-visible:ring-secondary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600',
                  activeTab === tab.id
                    ? 'border-secondary-400 text-secondary-50 shadow-[inset_0_-8px_12px_-10px_rgba(249,115,22,0.35)] dark:border-secondary-300 dark:text-secondary-50'
                    : 'border-transparent text-secondary-200/95 hover:border-secondary-400/55 hover:text-secondary-50 dark:text-secondary-200/90',
                )}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => onTabKeyDown(e, tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <p className="px-0.5 text-xs leading-relaxed text-[var(--app-muted)] sm:px-1">{tabMeta.description}</p>
      </div>

      <div role="tabpanel" id={`tfd-panel-${activeTab}`} aria-labelledby={`tfd-tab-${activeTab}`}>
        {activeTab === 'grades-import' ? (
          <TeacherGradesImportPage embedded />
        ) : (
          <OverviewTab
            enabled={canViewAggregatedStats}
            managedDeptId={managedDeptId}
            institutionWide={institutionWide}
          />
        )}
      </div>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-6 shadow-sm lg:col-span-2">
            <p className="text-sm leading-relaxed text-[var(--app-muted)]">
              Utilisez les entrées du menu pour ouvrir l’annuaire étudiants (filtré sur votre département si vous en
              gérez un) et l’annuaire institutionnel des enseignants.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" as={Link} to="/teacher/students">
                Étudiants
              </Button>
              <Button variant="secondary" size="sm" as={Link} to="/teacher/faculty/list">
                Enseignants
              </Button>
            </div>
          </div>
          <div>
            <QuickActions canImport={canImport} canReports={canReports} canViewStudents={canViewStudents} canViewGrades={canViewGrades} />
          </div>
        </div>
      )}
    </div>
  )
}
