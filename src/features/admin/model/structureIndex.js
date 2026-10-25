/**
 * Index à plat de l'arbre ``/academics/structure/`` : entités par niveau, titulaires,
 * postes vacants. Partagé par les nominations et l'explorateur de structure.
 */

export function entityKey(level, id) {
  return level === 'institution' ? 'institution' : `${level}:${id}`
}

/** @returns {{ byKey: Map<string, any>, faculties: any[], departments: any[], programs: any[] }} */
export function indexStructure(tree) {
  const byKey = new Map()
  const faculties = []
  const departments = []
  const programs = []
  if (!tree) return { byKey, faculties, departments, programs }

  byKey.set('institution', { level: 'institution', id: null, code: '', name: 'Institution', holders: tree.institution.holders, can: tree.institution.can })
  for (const f of tree.faculties) {
    const fac = { ...f, level: 'faculty' }
    faculties.push(fac)
    byKey.set(entityKey('faculty', f.id), fac)
    for (const d of f.departments) {
      const dep = { ...d, level: 'department', faculty: f }
      departments.push(dep)
      byKey.set(entityKey('department', d.id), dep)
      for (const p of d.programs) {
        const prog = { ...p, level: 'program', department: d, faculty: f }
        programs.push(prog)
        byKey.set(entityKey('program', p.id), prog)
      }
    }
  }
  return { byKey, faculties, departments, programs }
}

export function entityLabel(entity) {
  if (!entity) return ''
  if (entity.level === 'institution') return 'Institution'
  return entity.code && entity.code !== entity.name ? `${entity.code} — ${entity.name}` : entity.name
}

/** Rôles à titulaire limité de ce niveau dont des places restent libres sur l'entité. */
export function vacanciesFor(entity, roles) {
  if (!entity) return []
  return roles
    .filter((r) => r.scope_level === entity.level && r.max_holders)
    .map((r) => ({ role: r, free: r.max_holders - entity.holders.filter((h) => h.role_code === r.code).length }))
    .filter((v) => v.free > 0)
}

/** Entités sur lesquelles l'utilisateur peut nommer pour un niveau donné. */
export function assignableEntities(index, level) {
  if (level === 'institution') {
    const inst = index.byKey.get('institution')
    return inst?.can?.assign_roles ? [inst] : []
  }
  const pool = { faculty: index.faculties, department: index.departments, program: index.programs }[level] ?? []
  return pool.filter((e) => e.can?.assign_roles)
}
