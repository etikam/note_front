import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Users, Upload, Download, UserPlus } from 'lucide-react'

/**
 * Dashboard stats étudiants — version UX/UI pro
 * Hiérarchie:
 * 1) Hero synthétique
 * 2) Répartition par département/licence
 * 3) Comptes & actions
 */
export function StudentStats({ stats }) {
  const cohort = stats?.cohort
  const deptRows = Array.isArray(cohort?.by_department) ? cohort.by_department : []
  const levelRows = Array.isArray(cohort?.by_level) ? cohort.by_level : []

  const departmentBreakdown = useMemo(() => {
    if (!stats?.cohort || !stats?.accounts || !stats?.enrollments) return []

    const normalize = (v) => (v == null ? '' : String(v).trim())
    const map = new Map()
    const byId = new Map()
    const byCode = new Map()
    const byName = new Map()

    for (const d of deptRows) {
      const code = normalize(d.code)
      const name = normalize(d.name)
      const id = normalize(d.department_id)
      const key = id || code || name
      if (!key) continue
      map.set(key, {
        key,
        code,
        name: name || code || `Département ${key}`,
        total: Number(d.count ?? 0),
        licenses: [],
      })
      if (id) byId.set(id, key)
      if (code) byCode.set(code.toLowerCase(), key)
      if (name) byName.set(name.toLowerCase(), key)
    }

    for (const row of levelRows) {
      const code = normalize(row.department_code)
      const name = normalize(row.department_name)
      const id = normalize(row.department_id)
      const key =
        (id && byId.get(id)) ||
        (code && byCode.get(code.toLowerCase())) ||
        (name && byName.get(name.toLowerCase())) ||
        null
      if (!key) continue
      const current = map.get(key)
      if (!current) continue

      const levelBase = row.name || (row.level_id == null ? 'Sans niveau' : `Niveau #${row.level_id}`)
      const levelLabel = row.number != null ? `Licence ${row.number}` : levelBase
      const count = Number(row.count ?? 0)

      current.licenses.push({ label: levelLabel, count })
      map.set(key, current)
    }

    return Array.from(map.values())
      .map((d) => ({ ...d, licenses: d.licenses.sort((a1, b1) => b1.count - a1.count) }))
      .sort((a1, b1) => b1.total - a1.total)
  }, [stats, deptRows, levelRows])

  if (!stats?.cohort || !stats?.accounts || !stats?.enrollments) return null

  const c = stats.cohort
  const a = stats.accounts
  const total = c.total ?? 0

  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('fr-FR') : '—')
  const pct = (part, whole) => {
    if (!whole) return '0 %'
    return `${Math.min(100, Math.round((Number(part ?? 0) / Number(whole)) * 100))} %`
  }

  return (
    <section
      className="overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-elevated)] text-[var(--app-fg)] shadow-[0_2px_16px_-8px_rgba(15,23,42,0.1)] dark:shadow-[0_8px_28px_-14px_rgba(0,0,0,0.4)]"
      aria-labelledby="student-stats-heading"
    >
      <div id="student-stats-heading" className="sr-only">
        Synthèse et répartition étudiants
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
              {fmt(total)} <span className="font-semibold">{total !== 1 ? 'étudiants' : 'étudiant'}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <KpiMini label="Actifs" value={fmt(a.active ?? 0)} />
            <KpiMini label="Inactifs" value={fmt(a.inactive ?? 0)} />
            <KpiMini label="Suspendus" value={fmt(a.suspended ?? 0)} />
          </div>
        </div>
      </div>

      <div className="border-b border-[var(--app-border)] px-4 py-5 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-heading text-base font-semibold text-[var(--app-fg)]">Répartition par département et licences</h2>
          <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-canvas)] px-2.5 py-1 text-xs font-semibold text-[var(--app-muted)]">
            {departmentBreakdown.length} départements
          </span>
        </div>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <StatMini label="Filles" value={fmt(c.female_count ?? 0)} helper={pct(c.female_count ?? 0, total)} />
          <StatMini label="Garçons" value={fmt(c.male_count ?? 0)} helper={pct(c.male_count ?? 0, total)} />
          <StatMini label="N/R" value={fmt(c.gender_unknown_count ?? 0)} helper={pct(c.gender_unknown_count ?? 0, total)} />
        </div>

        <div className="grid max-h-72 grid-cols-1 gap-3 overflow-auto pr-1 lg:grid-cols-2">
          {departmentBreakdown.map((dept) => (
            <section
              key={dept.key}
              className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold text-[var(--app-fg)]">
                  {dept.code ? `${dept.code} · ${dept.name}` : dept.name}
                </h3>
                <span className="text-xs font-semibold tabular-nums text-[var(--app-muted)]">{fmt(dept.total)}</span>
              </div>
              <div className="space-y-1.5">
                {dept.licenses.slice(0, 4).map((lic) => (
                  <div
                    key={`${dept.key}-${lic.label}-${lic.count}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 py-1.5"
                  >
                    <p className="truncate text-xs font-medium text-[var(--app-fg)]">{lic.label}</p>
                    <p className="shrink-0 text-xs font-semibold tabular-nums text-[var(--app-fg)]">{fmt(lic.count)}</p>
                  </div>
                ))}
                {dept.licenses.length === 0 ? (
                  <p className="text-xs text-[var(--app-muted)]">Aucune licence dans ce département.</p>
                ) : null}
              </div>
            </section>
          ))}
          {departmentBreakdown.length === 0 ? (
            <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-canvas)] px-3 py-2 text-xs text-[var(--app-muted)]">
              Aucune répartition disponible.
            </p>
          ) : null}
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-base font-semibold text-[var(--app-fg)]">Comptes & actions</h2>
            <p className="mt-0.5 max-w-xl text-[13px] text-[var(--app-muted)]">
              Suivi des statuts comptes et accès rapides pour les opérations étudiantes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300 dark:ring-brand-500/20">
                <ShieldCheck size={20} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-base font-semibold text-[var(--app-fg)]">Comptes & accès</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3">
              <AccountCell label="Actifs" value={fmt(a.active ?? 0)} hint={`${pct(a.active ?? 0, total)} de l'effectif`} />
              <AccountCell label="Inactifs" value={fmt(a.inactive ?? 0)} hint={`${pct(a.inactive ?? 0, total)} de l'effectif`} />
              <AccountCell label="Suspendus · gelés" value={fmt(a.suspended ?? 0)} hint="Compte utilisateur suspendu" />
              <AccountCell label="Exclus" value={fmt(a.excluded ?? 0)} hint={`${pct(a.excluded ?? 0, total)} de l'effectif`} />
              <AccountCell label="Parcours terminés" value={fmt(a.completed ?? 0)} hint={`${pct(a.completed ?? 0, total)} de l'effectif`} />
            </div>

            {(c.suspended_count ?? 0) > 0 ? (
              <div className="mt-3 rounded-xl border border-secondary-200/90 bg-secondary-50 px-3 py-2.5 text-[13px] text-secondary-900 dark:border-secondary-800/55 dark:bg-secondary-950/35 dark:text-secondary-100">
                <span className="font-semibold">Profils étudiants suspendus : </span>
                <span className="font-bold tabular-nums">{fmt(c.suspended_count ?? 0)}</span>
              </div>
            ) : null}
          </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
              <div className="flex items-center gap-2.5 border-b border-[var(--app-border)] px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25">
                  <Users size={17} strokeWidth={2} aria-hidden />
                </span>
                <h3 className="font-heading text-sm font-semibold text-[var(--app-fg)]">Actions rapides étudiants</h3>
            </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <QuickAction to="/teacher/students" icon={Users} title="Étudiants" subtitle="Liste et suivi" />
                <QuickAction to="/teacher/students/import-export" icon={Upload} title="Importer" subtitle="Données structurées" />
                <QuickAction to="/teacher/students/import-export" icon={Download} title="Exporter" subtitle="Listes et extractions" />
                <QuickAction to="/teacher/students/import-export" icon={UserPlus} title="Ajouter" subtitle="Création de fiche" />
            </div>
          </div>
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
    <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-[var(--app-muted)]">{label}</p>
      <p className="text-base font-bold tabular-nums text-[var(--app-fg)]">{value}</p>
      <p className="text-[10px] text-[var(--app-muted)]">{helper}</p>
    </div>
  )
}

function AccountCell({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,var(--app-canvas))] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 font-heading text-2xl font-bold tabular-nums text-[var(--app-fg)]">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--app-muted)]">{hint}</p>
    </div>
  )
}

function QuickAction({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group flex flex-col gap-2.5 rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_98%,var(--app-canvas))] p-4 transition-all duration-200 hover:border-secondary-400/60 hover:shadow-md dark:bg-[color-mix(in_srgb,var(--app-elevated)_96%,black)] dark:hover:border-secondary-500/35"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 transition-all duration-200 group-hover:bg-secondary-500 group-hover:text-white group-hover:ring-secondary-600 dark:text-secondary-200 dark:ring-secondary-500/25 dark:group-hover:bg-secondary-500">
        <Icon size={18} strokeWidth={2} aria-hidden />
      </span>
      <span>
        <p className="text-sm font-semibold text-[var(--app-fg)]">{title}</p>
        <p className="text-xs text-[var(--app-muted)]">{subtitle}</p>
      </span>
    </Link>
  )
}
