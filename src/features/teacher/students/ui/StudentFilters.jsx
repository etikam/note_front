import { Filter, RotateCcw, Search } from 'lucide-react'

import { STATUS_UI } from '@/features/teacher/students/studentList.constants'
import { cn } from '@/shared/lib/cn'

const INPUT_BASE =
  'w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] text-sm text-zinc-900 dark:text-zinc-100 ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-shadow'

const SELECT_BASE =
  'rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] text-sm text-zinc-900 dark:text-zinc-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-shadow ' +
  'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-zinc-50 dark:disabled:bg-brand-950/40'

export function StudentFilters({
  q,
  onQChange,
  departmentId,
  onDepartmentIdChange,
  filterAcademicYearId,
  onFilterAcademicYearIdChange,
  cohorteId,
  onCohorteIdChange,
  cohorts,
  filtersOpen,
  onFiltersOpenChange,
  levelId,
  onLevelIdChange,
  status,
  onStatusChange,
  departments,
  levels,
  metaLoading,
  isLoadingYears,
  academicYears,
  deptScoped,
  activeFilterCount,
  onResetFilters,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            aria-hidden
          />
          <input
            id="sd-search"
            className={cn(INPUT_BASE, 'pl-9 pr-4 py-2.5 h-10')}
            type="search"
            placeholder="Matricule, nom, prénom, INE…"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="flex flex-col gap-1">
          <select
            id="sd-dept"
            className={cn(SELECT_BASE, 'h-10 px-3')}
            value={departmentId}
            onChange={(e) => onDepartmentIdChange(e.target.value)}
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

        <div className="flex flex-col gap-1">
          <select
            id="sd-year"
            className={cn(SELECT_BASE, 'h-10 px-3')}
            value={filterAcademicYearId}
            onChange={(e) => onFilterAcademicYearIdChange(e.target.value)}
            disabled={isLoadingYears}
          >
            <option value="">Toutes les années</option>
            {academicYears.map((y) => (
              <option key={y.id} value={String(y.id)}>
                {y.year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <select
            id="sd-cohorte"
            className={cn(SELECT_BASE, 'h-10 px-3 min-w-[11rem]')}
            value={cohorteId}
            onChange={(e) => onCohorteIdChange(e.target.value)}
            disabled={metaLoading}
          >
            <option value="">Toutes les cohortes</option>
            {cohorts.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.label || `Promotion ${c.promotion_number} (${c.entry_academic_year_year ?? ''})`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-colors',
              filtersOpen
                ? 'border-secondary-500 bg-secondary-50 text-secondary-800 dark:bg-secondary-950/40 dark:text-secondary-200 dark:border-secondary-500'
                : 'border-[var(--app-border)] bg-[var(--app-elevated)] text-zinc-600 dark:text-zinc-300 hover:bg-[var(--app-nav-hover)]',
            )}
            onClick={() => onFiltersOpenChange((o) => !o)}
            aria-expanded={filtersOpen}
          >
            <Filter size={15} aria-hidden />
            Filtres
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary-600 text-white dark:bg-secondary-500 dark:text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-[var(--app-border)] text-sm text-zinc-500 dark:text-zinc-400 hover:bg-[var(--app-nav-hover)] transition-colors"
              onClick={onResetFilters}
            >
              <RotateCcw size={13} aria-hidden /> Réinit.
            </button>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="flex flex-wrap gap-3 px-4 py-3 bg-[color-mix(in_srgb,var(--app-elevated)_92%,white)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)] rounded-xl border border-[var(--app-border)]">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Niveau</label>
            <select
              id="sd-level"
              className={cn(SELECT_BASE, 'h-9 px-3 text-sm')}
              value={levelId}
              onChange={(e) => onLevelIdChange(e.target.value)}
              disabled={!departmentId}
            >
              <option value="">{departmentId ? 'Tous les niveaux' : 'Choisir un département'}</option>
              {levels.map((lv) => (
                <option key={lv.id} value={String(lv.id)}>
                  {lv.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Statut dossier</label>
            <select
              id="sd-status"
              className={cn(SELECT_BASE, 'h-9 px-3 text-sm')}
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
            >
              <option value="">Tous</option>
              {Object.entries(STATUS_UI).map(([value, u]) => (
                <option key={value} value={value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          {deptScoped && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 self-end pb-1">
              Périmètre restreint : chef de département.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
