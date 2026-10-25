/**
 * Filtre de périmètre ``{ departmentId, programId }`` (chaînes, ``''`` = non renseigné),
 * piloté par ``useScopeOptions`` et affiché par ``ScopeSelect``.
 */

/** ``{departmentId, programId}`` → valeur d'option (``d:3`` / ``p:7`` / ``''``). */
export function scopeValue({ departmentId, programId }) {
  if (programId) return `p:${programId}`
  if (departmentId) return `d:${departmentId}`
  return ''
}

export function parseScopeValue(value) {
  const [kind, id] = String(value).split(':')
  if (kind === 'p') return { departmentId: '', programId: id }
  if (kind === 'd') return { departmentId: id, programId: '' }
  return { departmentId: '', programId: '' }
}

/** Filtre imposé par un périmètre réduit à une entité (sinon vide). */
export function defaultScope(options) {
  if (options.lockedProgramId) return { departmentId: '', programId: String(options.lockedProgramId) }
  if (options.lockedDepartmentId) {
    const dept = options.departments.find((d) => d.id === options.lockedDepartmentId)
    if (dept?.programs.length === 1) return { departmentId: '', programId: String(dept.programs[0].id) }
    return { departmentId: String(options.lockedDepartmentId), programId: '' }
  }
  return { departmentId: '', programId: '' }
}

/** Programmes couverts par un filtre (tous ceux du périmètre si vide). */
export function programIdsFor(options, { departmentId, programId }) {
  if (programId) return new Set([Number(programId)])
  if (departmentId) return new Set(options.departments.find((d) => String(d.id) === String(departmentId))?.programs.map((p) => p.id) ?? [])
  return new Set(options.programs.map((p) => p.id))
}
