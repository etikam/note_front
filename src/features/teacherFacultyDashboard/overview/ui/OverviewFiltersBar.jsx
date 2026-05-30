import { cn } from '@/shared/lib/cn'
import { OVERVIEW_SEMESTER_OPTIONS } from '@/features/teacherFacultyDashboard/overview/model/overviewFilterDefaults'

const SELECT_BASE =
  'w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-3 py-2.5 text-sm text-[var(--app-fg)] ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-shadow ' +
  'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'

const LABEL_CLASS = 'text-xs font-semibold text-[var(--app-muted)]'

export function OverviewFiltersBar({
  filters,
  onFilterChange,
  departments,
  levels,
  metaLoading,
  deptScoped,
  title = "Vue d'ensemble",
  description = "Filtrez par semestre, département et niveau. L'année académique suit le sélecteur global du tableau de bord.",
}) {
  return (
    <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-[var(--app-fg)]">{title}</h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">{description}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ov-semester" className={LABEL_CLASS}>
            Semestre
          </label>
          <select
            id="ov-semester"
            className={SELECT_BASE}
            value={filters.semester}
            onChange={(e) => onFilterChange('semester', e.target.value)}
          >
            {OVERVIEW_SEMESTER_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ov-dept" className={LABEL_CLASS}>
            Département
          </label>
          <select
            id="ov-dept"
            className={SELECT_BASE}
            value={filters.departmentId}
            onChange={(e) => onFilterChange('departmentId', e.target.value)}
            disabled={deptScoped || metaLoading}
          >
            <option value="">Tous les départements</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ov-level" className={LABEL_CLASS}>
            Niveau
          </label>
          <select
            id="ov-level"
            className={SELECT_BASE}
            value={filters.levelId}
            onChange={(e) => onFilterChange('levelId', e.target.value)}
            disabled={!filters.departmentId}
          >
            <option value="">
              {filters.departmentId ? 'Tous les niveaux' : "Sélectionnez d'abord un département"}
            </option>
            {levels.map((lv) => (
              <option key={lv.id} value={String(lv.id)}>
                {lv.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className={cn('mt-4 flex cursor-pointer items-center gap-2 text-sm text-[var(--app-fg)]')}>
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--app-border)] text-brand-600 focus:ring-brand-500"
          checked={filters.includeInactive}
          onChange={(e) => onFilterChange('includeInactive', e.target.checked)}
        />
        Inclure les étudiants inactifs
      </label>
    </div>
  )
}
