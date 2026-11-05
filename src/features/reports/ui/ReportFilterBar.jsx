import { RotateCcw } from 'lucide-react'

import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { SEMESTERS } from '@/features/notes/model/notesModel'
import { cn } from '@/shared/lib/cn'

export const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

/**
 * Barre de filtres des rapports (``useReportFilters``) : périmètre en arbre (département ou
 * programme), niveau du programme, semestre. ``programOnly`` : un programme est requis (PV).
 */
export function ReportFilterBar({ filters: f, programOnly = false, showLevel = true, showSemester = true, children, className }) {
  const active = Boolean((!f.scopeOptions.lockedProgramId && !f.scopeOptions.lockedDepartmentId && (f.departmentId || f.programId)) || f.levelId || f.semester)
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-2', className)}>
      <ScopeSelect
        className={cn(SELECT, 'max-w-[20rem]')}
        options={f.scopeOptions}
        departmentId={programOnly ? '' : f.departmentId}
        programId={f.programId}
        onChange={f.setScope}
        programOnly={programOnly}
        allLabel={programOnly ? 'Choisir un programme' : 'Tous les départements'}
      />
      {showLevel ? (
        <select
          className={SELECT}
          value={f.levelId}
          onChange={(e) => f.setLevel(e.target.value)}
          disabled={!f.levels.length}
          aria-label="Niveau"
          title={f.programId ? undefined : 'Choisissez d’abord un programme'}
        >
          <option value="">{f.programId ? 'Tous les niveaux' : 'Niveau'}</option>
          {f.levels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      ) : null}
      {showSemester ? (
        <select className={SELECT} value={f.semester} onChange={(e) => f.setSemester(e.target.value)} aria-label="Semestre">
          <option value="">Année entière</option>
          {SEMESTERS.map((n) => (
            <option key={n} value={n}>
              Semestre {n}
            </option>
          ))}
        </select>
      ) : null}
      {active ? (
        <button type="button" onClick={f.reset} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-medium text-[var(--app-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-fg)]">
          <RotateCcw size={13} aria-hidden /> Réinitialiser
        </button>
      ) : null}
      {children ? <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}
