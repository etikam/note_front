/** Libellés statut pédagogique (champ `status` API). */
export const GRADE_STATUS_LABELS = {
  DRAFT: 'Brouillon',
  INCOMPLETE: 'Incomplet',
  NEEDS_MAKEUP: 'Rattrapage',
  PASSED: 'Validé',
  DEBT: 'Dette',
}

/** Libellés circuit de validation (`validation_status`) — niveau hiérarchique actuel. */
export const VALIDATION_STATUS_LABELS = {
  teacher: 'Enseignant',
  department_head: 'Chef de département',
  study_director: 'Directeur des études',
  general_director: 'Directeur général',
}

/** Classes badge statut pédagogique (charte zinc / brand / sémantique). */
export function gradeStatusBadgeClass(status) {
  switch (status) {
    case 'PASSED':
      return 'bg-emerald-100 text-emerald-900 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200'
    case 'NEEDS_MAKEUP':
      return 'bg-amber-100 text-amber-900 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200'
    case 'DEBT':
      return 'bg-red-100 text-red-900 border-red-200/80 dark:bg-red-950/45 dark:text-red-200'
    case 'INCOMPLETE':
      return 'bg-zinc-100 text-zinc-700 border-zinc-200/80 dark:bg-white/5 dark:text-zinc-300'
    default:
      return 'bg-zinc-100 text-zinc-600 border-zinc-200/70 dark:bg-white/5 dark:text-zinc-400'
  }
}

export function validationStatusBadgeClass() {
  return 'bg-secondary-100 text-secondary-900 border-secondary-200/70 dark:bg-secondary-950/40 dark:text-secondary-200'
}
