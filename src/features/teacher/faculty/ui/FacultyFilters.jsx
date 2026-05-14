import { RotateCcw, Search } from 'lucide-react'

import { TEACHER_ROLE_OPTIONS } from '@/features/teacher/faculty/facultyList.constants'
import { cn } from '@/shared/lib/cn'

const INPUT_BASE =
  'w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] text-sm text-zinc-900 dark:text-zinc-100 ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-shadow'

const SELECT_BASE =
  'rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] text-sm text-zinc-900 dark:text-zinc-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 focus:border-transparent transition-shadow ' +
  'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-zinc-50 dark:disabled:bg-brand-950/40'

/**
 * Barre filtres annuaire enseignants (alignée visuellement sur StudentFilters).
 */
export function FacultyFilters({
  q,
  onQChange,
  status,
  onStatusChange,
  teacherRole,
  onTeacherRoleChange,
  activeFilterCount,
  onResetFilters,
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            aria-hidden
          />
          <input
            id="fac-search"
            className={cn(INPUT_BASE, 'h-10 pl-9 pr-4 py-2.5')}
            type="search"
            placeholder="Matricule, nom, prénom, e-mail…"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        <select
          id="fac-status"
          className={cn(SELECT_BASE, 'h-10 min-w-[10rem] px-3')}
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filtrer par statut RH"
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
          <option value="on_leave">En congé</option>
        </select>

        <select
          id="fac-role"
          className={cn(SELECT_BASE, 'h-10 min-w-[12rem] px-3')}
          value={teacherRole}
          onChange={(e) => onTeacherRoleChange(e.target.value)}
          aria-label="Filtrer par rôle institutionnel"
        >
          <option value="">Toutes les fonctions</option>
          {TEACHER_ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            className="flex h-10 items-center gap-1.5 rounded-lg border border-[var(--app-border)] px-3 text-sm text-zinc-500 transition-colors hover:bg-[var(--app-nav-hover)] dark:text-zinc-400"
            onClick={onResetFilters}
          >
            <RotateCcw size={13} aria-hidden /> Réinitialiser
            <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary-600 px-1 text-[10px] font-bold text-white dark:bg-secondary-500">
              {activeFilterCount}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
