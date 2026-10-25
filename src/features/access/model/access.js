/**
 * Droits effectifs de l'utilisateur (``user.access`` renvoyé par ``/auth/me``).
 *
 * Toute décision d'affichage passe par des permissions, jamais par des codes de rôle :
 * un rôle personnalisé créé par le DG fonctionne donc sans changer le code.
 *
 * Périmètre d'une permission : ``{ institution, faculty_ids, department_ids, program_ids, own_courses }``.
 */

const EMPTY = Object.freeze({ roles: [], permissions: {} })

function hasEntityScope(scope) {
  return Boolean(
    scope &&
      (scope.institution ||
        scope.faculty_ids?.length ||
        scope.department_ids?.length ||
        scope.program_ids?.length),
  )
}

/** @param {any} user */
export function buildAccess(user) {
  const { roles, permissions } = user?.access ?? EMPTY
  const scopeOf = (perm) => permissions[perm] ?? null

  const access = {
    roles,
    permissions,
    /** Rôles issus d'un mandat (hors rôle implicite d'enseignant). */
    mandates: roles.filter((r) => r.assignment_id != null),
    scopeOf,
    /** La permission s'applique quelque part (y compris sur ses seuls cours). */
    can: (perm) => Boolean(scopeOf(perm)),
    /** La permission s'applique sur au moins une entité (programme, département, faculté, institution). */
    canManage: (perm) => hasEntityScope(scopeOf(perm)),
    /** La permission s'applique au niveau faculté ou institution (ressources mutualisées). */
    canGlobal: (perm) => {
      const s = scopeOf(perm)
      return Boolean(s && (s.institution || s.faculty_ids?.length))
    },
    canAny: (...perms) => perms.some((p) => Boolean(scopeOf(p))),
    canManageAny: (...perms) => perms.some((p) => hasEntityScope(scopeOf(p))),
    /** La permission couvre-t-elle cette entité (programme, ou département) ? */
    covers(perm, { programId = null, departmentId = null, program = null } = {}) {
      const s = scopeOf(perm)
      if (!s) return false
      if (s.institution || s.faculty_ids?.length) return true
      const deptId = departmentId ?? program?.department ?? null
      if (deptId != null && s.department_ids?.includes(Number(deptId))) return true
      const progId = programId ?? program?.id ?? null
      return progId != null && s.program_ids?.includes(Number(progId))
    },
  }
  access.isManager = access.mandates.length > 0 || Object.values(permissions).some(hasEntityScope)
  return access
}

/** Page d'accueil selon les droits : pilotage si on a un périmètre de gestion, sinon « Mes cours ». */
export function homePathFor(user) {
  if (!user) return '/auth/login'
  if (user.role === 'student') return user.onboarding_completed ? '/student/dashboard' : '/student/onboarding'
  if (user.role === 'teacher') {
    const access = buildAccess(user)
    if (access.canManage('stats.view')) return '/teacher/dashboard'
    if (access.isManager) return '/structure'
    return '/teacher/my-courses'
  }
  return '/auth/login'
}

/** Intitulé de rôle à afficher (mandat le plus large d'abord). */
const LEVEL_ORDER = ['institution', 'faculty', 'department', 'program', 'own']

export function primaryRole(user) {
  const roles = buildAccess(user).roles
  if (!roles.length) return null
  return [...roles].sort((a, b) => LEVEL_ORDER.indexOf(a.scope_level) - LEVEL_ORDER.indexOf(b.scope_level))[0]
}
