import { Link } from 'react-router-dom'
import { BookMarked, Upload, UserPlus, Users } from 'lucide-react'

/**
 * Dashboard stats enseignants — même philosophie que StudentStats : héro brand + blocs toujours visibles.
 *
 * @param {{ stats: unknown, canManageCourses?: boolean, onAddTeacher?: () => void }} props
 */
export function FacultyStats({ stats, canManageCourses = false, onAddTeacher }) {
  if (!stats?.cohort || !stats?.accounts || !stats?.assignments) return null

  const c = stats.cohort
  const a = stats.accounts
  const asg = stats.assignments
  const total = c.total ?? 0

  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('fr-FR') : '—')

  const pct = (part, whole) => {
    if (!whole) return '0 %'
    return `${Math.min(100, Math.round((Number(part ?? 0) / Number(whole)) * 100))} %`
  }

  const deptRows = Array.isArray(c.by_department) ? c.by_department : []
  const roleRows = Array.isArray(c.by_role) ? c.by_role : []
  const gradeRows = Array.isArray(c.by_grade) ? c.by_grade : []

  const panelClass =
    'rounded-2xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] overflow-hidden'

  const tableWrap = 'overflow-x-auto rounded-lg border border-[var(--app-border)]'
  const thClass =
    'px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400'
  const tdClass = 'px-2.5 py-2 text-sm'
  const tdNum = `${tdClass} text-right tabular-nums`

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-elevated)] text-[var(--app-fg)] shadow-[0_2px_16px_-8px_rgba(15,23,42,0.1)] dark:shadow-[0_8px_28px_-14px_rgba(0,0,0,0.4)]"
      aria-labelledby="faculty-stats-heading"
    >
      <div id="faculty-stats-heading" className="sr-only">
        Synthèse et répartition enseignants
      </div>

      <div className="relative overflow-hidden border-b border-[var(--app-border)] bg-brand-600 px-5 py-8 sm:px-8 sm:py-9">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.14),transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-brand-100/90">Effectif global</p>
            <p className="mt-2 font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {fmt(total)} <span className="font-semibold">{total !== 1 ? 'enseignants' : 'enseignant'}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <KpiMini label="Actifs (compte)" value={fmt(a.active ?? 0)} />
            <KpiMini label="Inactifs" value={fmt(a.inactive ?? 0)} />
            <KpiMini label="Suspendus" value={fmt(a.suspended ?? 0)} />
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--app-border)] px-3 py-4 sm:px-5 sm:py-4">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
          <div className={`${panelClass} min-w-0 flex-1`}>
          <header className="border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_88%,transparent)] px-4 py-3 sm:px-5">
            <h2 className="font-heading text-base font-semibold text-[var(--app-fg)]">Répartition et structure</h2>
            <p className="mt-0.5 text-xs text-[var(--app-muted)]">
              Selon la recherche, le statut et le rôle choisis dans les filtres ci-dessous.
            </p>
          </header>

          <div className="space-y-4 p-3 sm:p-4">
            {/* Synthèse compacte : genre + alertes sur une bande */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-between">
              <div className="grid max-w-full grid-cols-3 gap-2 sm:max-w-xs sm:shrink-0">
                <StatMini label="Femmes" value={fmt(c.female_count ?? 0)} helper={pct(c.female_count ?? 0, total)} />
                <StatMini label="Hommes" value={fmt(c.male_count ?? 0)} helper={pct(c.male_count ?? 0, total)} />
                <StatMini
                  label="Genre N/R"
                  value={fmt(c.gender_unknown_count ?? 0)}
                  helper={pct(c.gender_unknown_count ?? 0, total)}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap content-start items-center gap-2 sm:justify-end">
                {(c.suspended_count ?? 0) > 0 ? (
                  <div className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-orange-200/80 bg-orange-50/50 px-2.5 py-1.5 text-xs dark:border-orange-900/40 dark:bg-orange-950/20">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">Profils suspendus</span>
                    <span className="tabular-nums font-bold text-secondary-700 dark:text-secondary-400">
                      {fmt(c.suspended_count ?? 0)}
                    </span>
                  </div>
                ) : null}
                <div className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-brand-200/60 bg-brand-50/40 px-2.5 py-1.5 text-xs dark:border-brand-900/30 dark:bg-brand-950/20">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">Doctorat</span>
                  <span className="tabular-nums font-bold text-brand-700 dark:text-brand-300">
                    {fmt(c.with_phd_count ?? 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tableaux côte à côte dès lg : largeur utile sans étirement excessif */}
            <div className="grid gap-3 min-[900px]:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0">
                <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                  Département géré
                </h3>
                <div className={tableWrap}>
                  <table className="w-full min-w-0 text-left text-sm">
                    <caption className="sr-only">Répartition par département géré</caption>
                    <thead className="border-b border-[var(--app-border)] bg-[var(--app-canvas)]">
                      <tr>
                        <th className={thClass}>Département</th>
                        <th className={`${thClass} text-right`}>Total</th>
                        <th className={`${thClass} text-right`}>
                          <span className="sm:hidden" title="Femmes">
                            F.
                          </span>
                          <span className="hidden sm:inline">Femmes</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--app-border)]">
                      {deptRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className={`${tdClass} text-center text-xs text-[var(--app-muted)]`}>
                            Aucune ligne.
                          </td>
                        </tr>
                      ) : (
                        deptRows.map((row, i) => (
                          <tr key={row.department_id ?? `d-${i}`} className="hover:bg-[var(--app-canvas)]/80">
                            <td className={tdClass}>
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">{row.name}</span>
                              {row.code ? <span className="ml-1 text-xs text-zinc-400">({row.code})</span> : null}
                            </td>
                            <td className={`${tdNum} font-semibold`}>{fmt(row.count)}</td>
                            <td className={`${tdNum} text-zinc-600 dark:text-zinc-300`}>{fmt(row.female_count)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                  Fonction institutionnelle
                </h3>
                <div className={tableWrap}>
                  <table className="w-full min-w-0 text-left text-sm">
                    <caption className="sr-only">Répartition par rôle</caption>
                    <thead className="border-b border-[var(--app-border)] bg-[var(--app-canvas)]">
                      <tr>
                        <th className={thClass}>Rôle</th>
                        <th className={`${thClass} text-right`}>Total</th>
                        <th className={`${thClass} text-right`}>
                          <span className="sm:hidden" title="Femmes">
                            F.
                          </span>
                          <span className="hidden sm:inline">Femmes</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--app-border)]">
                      {roleRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className={`${tdClass} text-center text-xs text-[var(--app-muted)]`}>
                            Aucune ligne.
                          </td>
                        </tr>
                      ) : (
                        roleRows.map((row, i) => (
                          <tr key={row.role || `r-${i}`} className="hover:bg-[var(--app-canvas)]/80">
                            <td className={`${tdClass} font-medium text-zinc-900 dark:text-zinc-100`}>{row.label}</td>
                            <td className={`${tdNum} font-semibold`}>{fmt(row.count)}</td>
                            <td className={`${tdNum} text-zinc-600 dark:text-zinc-300`}>{fmt(row.female_count)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="min-w-0 min-[900px]:col-span-2 xl:col-span-1">
                <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                  Grade / titre
                </h3>
                <div className={tableWrap}>
                  <table className="w-full min-w-0 text-left text-sm">
                    <caption className="sr-only">Répartition par grade</caption>
                    <thead className="border-b border-[var(--app-border)] bg-[var(--app-canvas)]">
                      <tr>
                        <th className={thClass}>Grade</th>
                        <th className={`${thClass} text-right`}>Total</th>
                        <th className={`${thClass} text-right`}>
                          <span className="sm:hidden" title="Femmes">
                            F.
                          </span>
                          <span className="hidden sm:inline">Femmes</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--app-border)]">
                      {gradeRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className={`${tdClass} text-center text-xs text-[var(--app-muted)]`}>
                            Aucune ligne.
                          </td>
                        </tr>
                      ) : (
                        gradeRows.map((row, i) => (
                          <tr key={row.grade || `g-${i}`} className="hover:bg-[var(--app-canvas)]/80">
                            <td className={`${tdClass} font-medium text-zinc-900 dark:text-zinc-100`}>{row.label}</td>
                            <td className={`${tdNum} font-semibold`}>{fmt(row.count)}</td>
                            <td className={`${tdNum} text-zinc-600 dark:text-zinc-300`}>{fmt(row.female_count)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Affectations : bloc étroit, pas pleine largeur */}
            <div className="w-full max-w-md">
              <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                Affectations cours
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-teal-200/70 bg-teal-50/60 px-3 py-2 dark:border-teal-900/40 dark:bg-teal-950/25">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-teal-800 dark:text-teal-200">
                    Cours assignés
                  </p>
                  <p className="text-lg font-bold tabular-nums text-teal-900 dark:text-teal-100">
                    {fmt(asg.assigned_courses ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-green-200/70 bg-green-50/60 px-3 py-2 dark:border-green-900/40 dark:bg-green-950/25">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-green-800 dark:text-green-200">
                    Avec ≥1 cours
                  </p>
                  <p className="text-lg font-bold tabular-nums text-green-900 dark:text-green-100">
                    {fmt(asg.teachers_with_course ?? 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

          <aside
            className="w-full shrink-0 lg:w-56 xl:w-64"
            aria-label="Actions rapides enseignants"
          >
            <div className={`${panelClass} flex h-full min-h-0 flex-col shadow-sm`}>
              <div className="flex items-start gap-2.5 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-canvas)_88%,transparent)] px-3 py-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25">
                  <Users size={16} strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading text-sm font-semibold leading-tight text-[var(--app-fg)]">
                    Actions rapides
                  </h3>
                  <p className="mt-0.5 text-[10px] leading-snug text-[var(--app-muted)]">
                    Flux courants
                  </p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <FacultyQuickActionLink
                  to="/teacher/faculty/list#faculty-directory"
                  icon={Users}
                  title="Annuaire"
                  subtitle="Tableau"
                />
                <FacultyQuickActionLink
                  to="/teacher/faculty/import-export"
                  icon={Upload}
                  title="Import / Export"
                  subtitle="CSV"
                />
                {canManageCourses ? (
                  <FacultyQuickActionLink
                    to="/teacher/faculty/course-assignments"
                    icon={BookMarked}
                    title="Affectations"
                    subtitle="Cours"
                  />
                ) : null}
                {typeof onAddTeacher === 'function' ? (
                  <FacultyQuickActionButton
                    type="button"
                    onClick={onAddTeacher}
                    icon={UserPlus}
                    title="Ajouter"
                    subtitle="Fiche"
                  />
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function KpiMini({ label, value }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/[0.12] px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-brand-100/85">{label}</p>
      <p className="text-base font-bold tabular-nums text-white">{value}</p>
    </div>
  )
}

function StatMini({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] px-2 py-1.5 text-center sm:px-3 sm:py-2">
      <p className="text-[10px] uppercase tracking-wide text-[var(--app-muted)]">{label}</p>
      <p className="text-sm font-bold tabular-nums text-[var(--app-fg)] sm:text-base">{value}</p>
      <p className="text-[10px] text-[var(--app-muted)]">{helper}</p>
    </div>
  )
}

const quickActionClass =
  'group flex w-full min-w-0 cursor-pointer flex-row items-center gap-2.5 rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_98%,var(--app-canvas))] px-2.5 py-2 text-left transition-all duration-200 hover:border-secondary-400/60 hover:shadow-sm dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)] dark:hover:border-secondary-500/35'

function FacultyQuickActionLink({ to, icon: Icon, title, subtitle }) {
  return (
    <Link to={to} className={quickActionClass}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 transition-all duration-200 group-hover:bg-secondary-500 group-hover:text-white group-hover:ring-secondary-600 dark:text-secondary-200 dark:ring-secondary-500/25 dark:group-hover:bg-secondary-500">
        <Icon size={16} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-[var(--app-fg)]">{title}</p>
        <p className="truncate text-[11px] text-[var(--app-muted)]">{subtitle}</p>
      </span>
    </Link>
  )
}

function FacultyQuickActionButton({ onClick, icon: Icon, title, subtitle, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} className={quickActionClass}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 transition-all duration-200 group-hover:bg-secondary-500 group-hover:text-white group-hover:ring-secondary-600 dark:text-secondary-200 dark:ring-secondary-500/25 dark:group-hover:bg-secondary-500">
        <Icon size={16} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-[var(--app-fg)]">{title}</p>
        <p className="truncate text-[11px] text-[var(--app-muted)]">{subtitle}</p>
      </span>
    </button>
  )
}
