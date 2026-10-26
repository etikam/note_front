import { ScopeSelect } from '@/features/access/ui/ScopeSelect'
import { SEMESTERS } from '@/features/notes/model/notesModel'
import { cn } from '@/shared/lib/cn'

export const SELECT =
  'h-9 rounded-lg border border-[var(--app-border)] bg-[var(--app-elevated)] px-2.5 text-[13px] text-[var(--app-fg)] focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)] disabled:opacity-50'

/** Interrupteur compact (rôle ``switch``). */
export function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[12.5px] text-[var(--app-fg-soft)]" title={hint}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
          checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-zinc-300 dark:bg-white/15',
        )}
      >
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
      {label}
    </label>
  )
}

/**
 * Filtres de l'espace « Notes » (``useNotesFilters``) : programme, niveau, semestre, publiées.
 * ``requireLevel=false`` ajoute « Tous les niveaux ». ``children`` : actions alignées à droite.
 */
export function NotesFilterBar({ filters: f, requireLevel = true, showPublished = true, children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)] p-2', className)}>
      <ScopeSelect
        className={cn(SELECT, 'max-w-[17rem]')}
        options={f.scopeOptions}
        departmentId=""
        programId={f.programId}
        onChange={({ programId }) => f.setProgram(programId || '')}
        allLabel="Choisir un programme"
      />
      <select className={SELECT} value={f.levelId} onChange={(e) => f.setLevel(e.target.value)} disabled={!f.levels.length} aria-label="Niveau">
        {!requireLevel || !f.levels.length ? <option value="">{f.programId ? 'Tous les niveaux' : 'Niveau'}</option> : null}
        {f.levels.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>
      <select className={SELECT} value={f.semester} onChange={(e) => f.setSemester(e.target.value)} aria-label="Semestre">
        <option value="">Année entière</option>
        {SEMESTERS.map((n) => (
          <option key={n} value={n}>
            Semestre {n}
          </option>
        ))}
      </select>
      {showPublished ? (
        <span className="px-1.5">
          <Toggle checked={f.publishedOnly} onChange={f.setPublishedOnly} label="Publiées uniquement" hint="Sinon, les notes en saisie ou en validation sont incluses (marquées provisoires)." />
        </span>
      ) : null}
      {children ? <div className="ml-auto flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}

/** Sélecteur de vue segmenté : ``options`` = ``[{ id, label, icon }]``. */
export function ViewSwitch({ options, value, onChange }) {
  return (
    <div role="tablist" aria-label="Vue" className="inline-flex rounded-lg border border-[var(--app-border)] bg-[var(--app-subtle)] p-0.5">
      {options.map((o) => {
        const Icon = o.icon
        const active = o.id === value
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
              active ? 'bg-[var(--app-elevated)] text-[var(--app-fg)] shadow-sm' : 'text-[var(--app-muted)] hover:text-[var(--app-fg)]',
            )}
          >
            {Icon ? <Icon size={14} aria-hidden /> : null}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
