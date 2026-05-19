function roleCodesOf(user) {
  if (!user || user.role !== 'teacher') return []
  return Array.isArray(user.teacher_role_codes) ? user.teacher_role_codes : []
}

/** Chemin d’accueil après connexion ou redirection « dashboard ». */
export function getRoleHomePath(user) {
  if (!user) return '/auth/login'
  if (user.role === 'student') return '/student/dashboard'
  if (user.role === 'teacher') {
    if (isSimpleTeacherProfile(user)) return '/teacher/my-courses'
    return '/teacher/dashboard'
  }
  return '/auth/login'
}

export function hasTeacherRole(user, roleCode) {
  return roleCodesOf(user).includes(roleCode)
}

export function hasAnyCapability(user, keys = []) {
  const caps = user?.capabilities ?? {}
  return keys.some((key) => Boolean(caps[key]))
}

export function hasAllCapabilities(user, keys = []) {
  const caps = user?.capabilities ?? {}
  return keys.every((key) => Boolean(caps[key]))
}

/** Édition du dossier étudiant (PATCH fiche) : aligné backend DE / DG + `can_edit_student_dossier`. */
export function canEditStudentDossier(user) {
  if (!user) return false
  if (Boolean(user.capabilities?.can_edit_student_dossier)) return true
  if (user.role !== 'teacher') return false
  return hasTeacherRole(user, 'study_director') || hasTeacherRole(user, 'general_director')
}

export function isSimpleTeacherProfile(user) {
  if (!user || user.role !== 'teacher') return false
  const codes = roleCodesOf(user)
  const elevated = ['department_head', 'study_director', 'program_director', 'general_director']
  return !codes.some((c) => elevated.includes(c))
}

/**
 * Règle centralisée d'accès "espace Académie".
 * Exigence métier : chef de département n'y a pas accès.
 */
export function canAccessAcademie(user) {
  if (!user || user.role !== 'teacher') return false
  if (hasTeacherRole(user, 'department_head')) return false
  if (isSimpleTeacherProfile(user)) return false
  return hasAnyCapability(user, [
    'can_manage_academic_calendar',
    'can_manage_academic_structure',
    'can_view_students',
  ])
}

/**
 * Evaluateur générique pour masquer onglet/composant selon règle.
 * Exemple rule: { anyCapabilities: ['can_manage_courses'], denyTeacherRoles: ['department_head'] }
 */
export function canAccessRule(user, rule = {}) {
  if (!rule || typeof rule !== 'object') return true
  if (rule.teacherOnly && user?.role !== 'teacher') return false
  if (rule.denyTeacherRoles?.some((code) => hasTeacherRole(user, code))) return false
  if (rule.requireTeacherRoles?.length && !rule.requireTeacherRoles.some((code) => hasTeacherRole(user, code))) {
    return false
  }
  if (rule.allCapabilities?.length && !hasAllCapabilities(user, rule.allCapabilities)) return false
  if (rule.anyCapabilities?.length && !hasAnyCapability(user, rule.anyCapabilities)) return false
  return true
}
