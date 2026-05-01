/**
 * Libellé cohorte API (liste / détail étudiant, activation).
 * Préfère `cohorte_label` renvoyé par le backend ; gère l’objet `cohorte` ou l’ancienne chaîne.
 */
export function formatCohortDisplay(payload) {
  if (!payload) return ''
  const label = typeof payload.cohorte_label === 'string' ? payload.cohorte_label.trim() : ''
  if (label) return label
  const ch = payload.cohorte
  if (ch && typeof ch === 'object') {
    const y = ch.entry_academic_year_year || ''
    if (ch.promotion_number != null) return `Promotion ${ch.promotion_number} (${y})`
  }
  if (typeof ch === 'string' && ch.trim()) return ch.trim()
  return ''
}
