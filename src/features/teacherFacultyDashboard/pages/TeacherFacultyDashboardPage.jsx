import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Download,
  Upload,
  Users,
  UsersRound,
  Waypoints,
} from 'lucide-react'

import { useAcademicYear } from '@/features/academicYear/model/AcademicYearContext'
import { useAuth } from '@/features/auth/model/AuthContext'
import { useTeacherDashboardOverview } from '@/features/teacherFacultyDashboard/model/useTeacherDashboardOverview'
import { OverviewRadarChart } from '@/features/teacherFacultyDashboard/ui/OverviewRadarChart'
import { LineChart } from '@/features/teacherFacultyDashboard/ui/LineChart'
import { cn } from '@/shared/lib/cn'
import { Badge, Button } from '@/shared/ui'

const DASHBOARD_TAB_KEY = 'gestion_ci.dashboard.facultyTab'

const DASHBOARD_TABS = [
  { id: 'overview',    label: "Vue d'ensemble",       description: "Indicateurs réels (API) pour l'année sélectionnée : effectifs, synthèse radar et alertes." },
  { id: 'enrollment',  label: 'Effectifs & inscriptions', description: "Flux d'inscriptions, validations et files d'attente." },
  { id: 'operations',  label: 'Opérations & qualité', description: 'Imports, complétude des données et résolution d\'alertes.' },
]

const KPI_ICONS = { students: Users, teachers: UsersRound, departments: Waypoints, levels: Activity }

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)) }

function formatNumber(value) {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '--'
  return new Intl.NumberFormat('fr-FR').format(n)
}

function seededRnd(seed, i) { return ((seed + i * 7919) % 9973) / 9973 }

function wobbleSeries(values, tick) {
  return values.map((v, i) => {
    const w = Math.sin(tick * 0.35 + i * 0.52) * 3.2 + Math.cos(tick * 0.22 + i * 0.31) * 2.1
    return Math.max(0, Math.round(v + w))
  })
}

function KpiCard({ label, value, yearValue, yearHint = "Sur l'année", deltaLabel, deltaTone = 'neutral', icon: Icon, hint }) {
  const showYear = yearValue !== null && yearValue !== undefined && Number.isFinite(Number(yearValue))
  const deltaToneClass = {
    positive: 'text-brand-700 bg-brand-100 dark:text-brand-200 dark:bg-[color-mix(in_srgb,var(--app-elevated)_76%,white)]',
    warning:  'text-secondary-800 bg-secondary-100 dark:text-secondary-200 dark:bg-secondary-950/35',
    neutral:  'text-[var(--app-muted)] bg-[color-mix(in_srgb,var(--app-elevated)_88%,var(--app-canvas))] dark:bg-white/[0.06]',
  }[deltaTone] ?? 'text-[var(--app-muted)] bg-[color-mix(in_srgb,var(--app-elevated)_88%,var(--app-canvas))] dark:bg-white/[0.06]'

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary-500/35 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--app-muted)]">{label}</p>
        {Icon && (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 dark:text-secondary-300 dark:ring-secondary-500/20"
            title={hint}
          >
            <Icon size={17} strokeWidth={2} aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums tracking-tight text-[var(--app-fg)]">{value}</p>
      {showYear && (
        <p className="mt-1 text-xs text-[var(--app-muted)]">
          {yearHint}: <strong className="font-semibold text-[var(--app-fg)]">{formatNumber(yearValue)}</strong>
        </p>
      )}
      {deltaLabel && (
        <span className={cn('mt-2 inline-flex self-start rounded-full px-2.5 py-0.5 text-xs font-semibold', deltaToneClass)}>
          {deltaLabel}
        </span>
      )}
    </div>
  )
}

function KpiSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm">
      <div className="h-3 w-1/2 rounded bg-[color-mix(in_srgb,var(--app-elevated)_82%,var(--app-canvas))] dark:bg-white/[0.08]" />
      <div className="h-9 w-1/3 rounded bg-[color-mix(in_srgb,var(--app-elevated)_82%,var(--app-canvas))] dark:bg-white/[0.08]" />
      <div className="h-3 w-2/3 rounded bg-[color-mix(in_srgb,var(--app-elevated)_82%,var(--app-canvas))] dark:bg-white/[0.08]" />
    </div>
  )
}

function AlertsPanel({ alerts }) {
  const toneClass = {
    danger: 'bg-red-600 text-white dark:bg-red-600 dark:text-white',
    warning: 'bg-secondary-500/15 text-secondary-900 ring-1 ring-secondary-500/25 dark:text-secondary-200 dark:ring-secondary-500/30',
    neutral: 'bg-[color-mix(in_srgb,var(--app-elevated)_90%,var(--app-canvas))] text-[var(--app-muted)] dark:bg-white/[0.06]',
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700 dark:text-secondary-300">
            <AlertTriangle size={17} strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--app-fg)]">Alertes</h2>
            <p className="text-xs text-[var(--app-muted)]">Ce qui mérite attention maintenant.</p>
          </div>
        </div>
        <Badge tone="secondary">{formatNumber(alerts?.length ?? 0)} priorité(s)</Badge>
      </div>
      <div className="divide-y divide-[var(--app-border)]">
        {(alerts ?? []).length ? alerts.slice(0, 6).map((a) => (
          <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--app-nav-hover)]/40">
            <span className={cn('inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', toneClass[a.tone ?? 'neutral'] ?? toneClass.neutral)}>
              {a.tone === 'danger' ? 'Critique' : a.tone === 'warning' ? 'Attention' : 'Info'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--app-fg)]">{a.title}</p>
              <p className="truncate text-xs text-[var(--app-muted)]">{a.detail}</p>
            </div>
            <Button variant="ghost" size="sm" disabled>
              Voir <ArrowUpRight size={13} />
            </Button>
          </div>
        )) : (
          <p className="px-5 py-8 text-center text-sm text-[var(--app-muted)]">Aucune alerte.</p>
        )}
      </div>
    </div>
  )
}

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

function buildMockBundle({ tab, academicYearId, canImport, liveTick }) {
  const seed = (academicYearId ? Number(academicYearId) : 1) * 9973 + tab.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const rnd = (i) => seededRnd(seed, i)
  const students = Math.round(900 + rnd(1) * 1200)
  const teachers = Math.round(40 + rnd(2) * 90)
  const departments = clamp(6 + Math.round(rnd(3) * 8), 2, 18)
  const levels = departments * (2 + Math.round(rnd(4) * 2))
  const enrollBase = Array.from({ length: 12 }, (_, i) => Math.round(50 + rnd(10 + i) * 140))
  const activityBase = Array.from({ length: 12 }, (_, i) => Math.round(20 + rnd(30 + i) * 70))
  const enrollments = wobbleSeries(enrollBase, liveTick)
  const activity = wobbleSeries(activityBase, liveTick)
  const validation = Array.from({ length: 12 }, (_, i) => Math.round(12 + rnd(50 + i) * 55 + Math.sin(liveTick * 0.2 + i) * 6))
  const backlog = Array.from({ length: 12 }, (_, i) => Math.round(5 + rnd(60 + i) * 28 + Math.cos(liveTick * 0.25 + i) * 4))
  const quality = Array.from({ length: 12 }, (_, i) => clamp(Math.round(72 + rnd(90 + i) * 22 + Math.sin(liveTick * 0.18 + i) * 3), 0, 100))
  const resolved = Array.from({ length: 12 }, (_, i) => Math.round(4 + rnd(100 + i) * 18 + (liveTick % 7)))
  const alerts = [
    { id: 'a1', tone: 'warning', title: 'Inscriptions en attente', detail: 'Certaines demandes dépassent 7 jours sans traitement.' },
    { id: 'a2', tone: 'neutral', title: 'Données incomplètes', detail: "Des étudiants n'ont pas de niveau renseigné." },
    ...(canImport ? [{ id: 'a3', tone: 'danger', title: 'Import à vérifier', detail: 'Un import récent contient des lignes rejetées.' }] : []),
  ]
  const kpisByTab = {
    overview:   [
      { label: 'Étudiants', value: formatNumber(students), delta: '+2.1% vs N-1', tone: 'positive', icon: Users },
      { label: 'Enseignants', value: formatNumber(teachers), delta: 'Stable', tone: 'neutral', icon: UsersRound },
      { label: 'Départements', value: formatNumber(departments), delta: 'Cartographie OK', tone: 'neutral', icon: Waypoints },
      { label: 'Niveaux', value: formatNumber(levels), delta: 'Catalogues', tone: 'neutral', icon: Activity },
    ],
    enrollment: [
      { label: 'Demandes (mois)', value: formatNumber(enrollments[11]), delta: 'Glissant 12 mois', tone: 'neutral', icon: Users },
      { label: 'Validations', value: formatNumber(validation[11]), delta: 'Traitées', tone: 'positive', icon: Activity },
      { label: "File d'attente", value: formatNumber(backlog[11]), delta: 'À traiter', tone: 'warning', icon: AlertTriangle },
      { label: 'Taux conversion', value: '68%', delta: 'Estim.', tone: 'neutral', icon: Waypoints },
    ],
    operations: [
      { label: 'Complétude données', value: `${quality[11]}%`, delta: 'Score qualité', tone: 'positive', icon: Activity },
      { label: 'Alertes résolues', value: formatNumber(resolved[11]), delta: '30 jours', tone: 'neutral', icon: AlertTriangle },
      { label: 'Imports OK', value: formatNumber(12 + rnd(7) * 6), delta: 'Lots', tone: 'neutral', icon: Upload },
      { label: 'Écarts détectés', value: formatNumber(3 + rnd(8) * 4), delta: 'À corriger', tone: 'warning', icon: AlertTriangle },
    ],
  }
  const chartsByTab = {
    overview:   [{ title: 'Inscriptions', subtitle: 'demandes / mois', values: enrollments, variant: 'accent' }, { title: 'Activité', subtitle: 'actions / mois', values: activity, variant: 'secondary' }],
    enrollment: [{ title: 'Demandes reçues', subtitle: 'flux mensuel', values: enrollments, variant: 'accent' }, { title: 'Validations', subtitle: 'traitées / mois', values: validation, variant: 'tertiary' }],
    operations: [{ title: 'Qualité des données', subtitle: 'score %', values: quality, variant: 'tertiary' }, { title: 'Alertes résolues', subtitle: 'cumul / mois', values: resolved, variant: 'accent' }],
  }
  return { kpis: kpisByTab[tab] ?? kpisByTab.overview, charts: chartsByTab[tab] ?? chartsByTab.overview, alerts }
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

  /** Onglet « Opérations » : masqué seulement pour un périmètre strictement cantonné à un département. */
  const dashboardTabs = useMemo(() => {
    if (managedDeptId != null && !institutionWide) return DASHBOARD_TABS.filter((t) => t.id !== 'operations')
    return DASHBOARD_TABS
  }, [managedDeptId, institutionWide])

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'overview'
    const saved = window.localStorage.getItem(DASHBOARD_TAB_KEY)
    return DASHBOARD_TABS.some((t) => t.id === saved) ? saved : 'overview'
  })

  const [liveTick, setLiveTick] = useState(0)
  const overviewQw = useTeacherDashboardOverview(academicYearId, activeTab === 'overview' && canViewAggregatedStats)

  useEffect(() => {
    if (!dashboardTabs.some((t) => t.id === activeTab)) setActiveTab('overview')
  }, [dashboardTabs, activeTab])

  useEffect(() => { window.localStorage.setItem(DASHBOARD_TAB_KEY, activeTab) }, [activeTab])

  useEffect(() => {
    const id = window.setInterval(() => setLiveTick((t) => t + 1), 4500)
    return () => window.clearInterval(id)
  }, [])

  const mock = useMemo(
    () => buildMockBundle({ tab: activeTab, academicYearId, canImport, liveTick }),
    [activeTab, academicYearId, canImport, liveTick]
  )

  const tabMeta = dashboardTabs.find((t) => t.id === activeTab) ?? dashboardTabs[0]
  const yearLabel = activeTab === 'overview' && overviewQw.data?.academic_year_label
    ? overviewQw.data.academic_year_label
    : academicYearId ?? 'courante'

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
            {activeTab === 'overview' && overviewQw.error && (
              <p
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
                role="alert"
              >
                {overviewQw.error}{' '}
                <button className="ml-1 font-semibold underline underline-offset-2" type="button" onClick={() => overviewQw.reload()}>
                  Réessayer
                </button>
              </p>
            )}
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
          <div className="-mb-px flex flex-wrap divide-x divide-secondary-400/50 px-1 sm:px-2">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tfd-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`tfd-panel-${tab.id}`}
                className={cn(
                  'border-b-2 px-4 py-3 text-sm font-semibold tracking-tight transition-colors duration-200 outline-none',
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
        {/* KPIs */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {activeTab === 'overview' ? (
            overviewQw.loading ? (
              <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
            ) : overviewQw.data?.kpis?.length ? (
              overviewQw.data.kpis.map((k) => {
                const Icon = KPI_ICONS[k.key] ?? Activity
                return (
                  <KpiCard
                    key={k.key}
                    label={k.label}
                    value={formatNumber(k.value)}
                    yearValue={k.value_year}
                    deltaLabel={k.delta_label}
                    deltaTone={k.delta_tone ?? 'neutral'}
                    icon={Icon}
                    hint={k.hint}
                  />
                )
              })
            ) : overviewQw.error ? null : (
              <><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /><KpiSkeleton /></>
            )
          ) : (
            mock.kpis.map((k) => (
              <KpiCard
                key={`${activeTab}-${k.label}`}
                label={k.label}
                value={k.value}
                deltaLabel={k.delta}
                deltaTone={k.tone}
                icon={k.icon}
              />
            ))
          )}
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {activeTab === 'overview' ? (
            <>
              {/* Histogramme */}
              <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm xl:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20">
                      <Activity size={17} strokeWidth={2} aria-hidden />
                    </span>
                    <h2 className="text-sm font-semibold text-[var(--app-fg)]">Synthèse année (radar)</h2>
                  </div>
                  {overviewQw.data?.academic_year_label && (
                    <Badge tone="secondary">{overviewQw.data.academic_year_label}</Badge>
                  )}
                </div>
                <div className="p-5">
                  <OverviewRadarChart
                    bars={overviewQw.data?.histogram}
                    title=""
                    subtitle="Valeurs normalisées sur le maximum des quatre indicateurs ; détail chiffré sous le graphique."
                    loading={overviewQw.loading}
                    emptyMessage="Aucune donnée pour cette année ou ce périmètre."
                  />
                </div>
              </div>
              {/* Actions rapides */}
              <div>
                <QuickActions canImport={canImport} canReports={canReports} canViewStudents={canViewStudents} canViewGrades={canViewGrades} />
              </div>
              {/* Alertes */}
              {overviewQw.data && !overviewQw.error && (
                <div className="xl:col-span-3">
                  <AlertsPanel alerts={overviewQw.data.alerts} />
                </div>
              )}
            </>
          ) : (
            <>
              {/* Courbes */}
              <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm xl:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--app-border)] px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20">
                      <Activity size={17} strokeWidth={2} aria-hidden />
                    </span>
                    <h2 className="text-sm font-semibold text-[var(--app-fg)]">Courbes</h2>
                  </div>
                  <Badge tone="secondary">12 mois · tick {liveTick}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
                  {mock.charts.map((c) => (
                    <LineChart key={`${activeTab}-${c.title}`} values={c.values} variant={c.variant} title={c.title} subtitle={c.subtitle} animate />
                  ))}
                </div>
              </div>
              {/* Actions */}
              <div>
                <QuickActions canImport={canImport} canReports={canReports} canViewStudents={canViewStudents} canViewGrades={canViewGrades} />
              </div>
              <div className="xl:col-span-3">
                <AlertsPanel alerts={mock.alerts} />
              </div>
            </>
          )}
        </div>
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
