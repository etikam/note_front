import { parseScopeValue, scopeValue } from '@/features/access/model/scopeFilter'
import { cn } from '@/shared/lib/cn'

const label = (e) => (e.code && e.name && e.code !== e.name ? `${e.code} — ${e.name}` : e.name || e.code)

/**
 * Filtre de périmètre unique : tout le périmètre, un département (tous ses programmes) ou un programme.
 * ``options`` vient de ``useScopeOptions``. Un périmètre verrouillé affiche l'entité sans choix.
 */
export function ScopeSelect({ options, departmentId, programId, onChange, className, allLabel = 'Tout mon périmètre', disabled, id }) {
  const { departments, lockedDepartmentId, lockedProgramId, loading } = options
  const locked = Boolean(lockedProgramId || lockedDepartmentId)
  const single = departments.length === 1 && departments[0].programs.length === 1
  return (
    <select
      id={id}
      className={cn(className)}
      value={scopeValue({ departmentId, programId })}
      onChange={(e) => {
        const next = parseScopeValue(e.target.value)
        // Un département à programme unique : on filtre directement sur le programme.
        const dept = departments.find((d) => String(d.id) === next.departmentId)
        if (dept?.programs.length === 1) onChange({ departmentId: '', programId: String(dept.programs[0].id) })
        else onChange(next)
      }}
      disabled={disabled || loading || (locked && single)}
      aria-label="Périmètre"
    >
      {!lockedProgramId && !lockedDepartmentId ? <option value="">{allLabel}</option> : null}
      {departments.map((d) =>
        d.programs.length === 1 ? (
          <option key={d.id} value={`p:${d.programs[0].id}`}>
            {label(d)}
            {d.programs[0].code !== d.code ? ` · ${d.programs[0].code}` : ''}
          </option>
        ) : (
          <optgroup key={d.id} label={label(d)}>
            {!lockedProgramId ? <option value={`d:${d.id}`}>{`${d.code} — tous les programmes`}</option> : null}
            {d.programs.map((p) => (
              <option key={p.id} value={`p:${p.id}`}>
                {label(p)}
              </option>
            ))}
          </optgroup>
        ),
      )}
    </select>
  )
}
