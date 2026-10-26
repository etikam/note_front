/** Ton des décisions de jury (PV, relevés). */
export const DECISION_TONE = { admitted: 'success', admitted_debt: 'warning', makeup: 'danger', repeat: 'danger', pending: 'neutral', none: 'neutral' }

/** Libellé de résultat d'un cours (``Grade.Status``). */
export const COURSE_RESULT = {
  PASSED: { label: 'Validé', tone: 'success' },
  NEEDS_MAKEUP: { label: 'Rattrapage', tone: 'warning' },
  DEBT: { label: 'Dette', tone: 'danger' },
}
