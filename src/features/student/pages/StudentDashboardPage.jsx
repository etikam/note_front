import { BookOpen, GraduationCap, LineChart, ListChecks } from 'lucide-react'

function StudentKpi({ label, value, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary-500/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--app-muted)]">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary-500/10 text-secondary-700 ring-1 ring-secondary-500/15 dark:text-secondary-300 dark:ring-secondary-500/20">
          <Icon size={17} strokeWidth={2} aria-hidden />
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums tracking-tight text-[var(--app-fg)]">{value}</p>
    </div>
  )
}

export function StudentDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/[0.06] via-transparent to-secondary-500/[0.07]"
          aria-hidden
        />
        <div className="relative p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--app-muted)]">Espace étudiant</p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[var(--app-fg)] sm:text-3xl">Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)]">
            Vue personnelle : progression, inscriptions et notes publiées. Les indicateurs seront branchés sur l’API
            lorsque les données seront disponibles.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StudentKpi label="Inscriptions approuvées" value="—" icon={ListChecks} />
        <StudentKpi label="Inscriptions en attente" value="—" icon={GraduationCap} />
        <StudentKpi label="Notes publiées" value="—" icon={BookOpen} />
        <StudentKpi label="Moyenne globale" value="—" icon={LineChart} />
      </div>
    </div>
  )
}
