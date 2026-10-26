/**
 * Règlement des études côté interface : libellés, explications, et calcul d'une moyenne de cours
 * identique au serveur (``apps/regulations/rules.py``) pour le simulateur.
 */

export const MAKEUP_MODES = [
  { value: 'replace_lowest', label: 'Remplace la plus faible note', help: 'La note de rattrapage prend la place de la plus faible des trois notes, puis la moyenne est recalculée.' },
  { value: 'replace_average', label: 'Devient la moyenne', help: 'La note de rattrapage remplace directement la moyenne du cours.' },
  { value: 'best_of', label: 'Meilleure des deux', help: 'On garde la meilleure valeur entre la moyenne initiale et la note de rattrapage.' },
]

export const MAKEUP_SCOPES = [
  { value: 'failed_courses', label: 'Tout cours sous le seuil', help: 'Chaque cours sous le seuil passe au rattrapage, même si son UE est validée par compensation.' },
  { value: 'failed_units', label: 'Seulement les UE non validées', help: 'Un cours compensé dans une UE validée n’a pas de rattrapage.' },
]

/** Règles présentées dans le formulaire : section, clé, libellé, explication. */
export const RULE_FIELDS = {
  notation: [
    { key: 'scale_max', label: 'Barème', help: 'Note maximale d’une épreuve. Ne peut plus changer dès qu’une note est saisie pour l’année.' },
    { key: 'pass_mark', label: 'Seuil de validation', help: 'Moyenne minimale pour valider un cours (et une UE en cas de compensation).' },
    { key: 'weights', label: 'Pondération des trois notes', help: 'Poids de chaque note dans la moyenne du cours, en pourcentage (total 100 %).' },
    { key: 'makeup_mode', label: 'Effet du rattrapage', help: 'Comment la note de rattrapage modifie la moyenne d’un cours sous le seuil.' },
    { key: 'makeup_cap', label: 'Plafond après rattrapage', help: 'Moyenne maximale qu’un cours peut atteindre après rattrapage (souvent le seuil).' },
  ],
  deliberation: [
    { key: 'ue_compensation', label: 'Compensation dans l’UE', help: 'Une UE est validée si sa moyenne (pondérée par les crédits) atteint le seuil, même si un de ses cours est en dessous.' },
    { key: 'eliminatory_mark', label: 'Note éliminatoire', help: 'Un cours sous cette note empêche toute compensation de son UE et de son semestre.' },
    { key: 'semester_compensation', label: 'Compensation du semestre', help: 'Toutes les UE d’un semestre sont validées si la moyenne générale du semestre atteint le seuil.' },
    { key: 'makeup_scope', label: 'Cours envoyés au rattrapage', help: 'Avec la compensation, faut-il rattraper les cours compensés ?' },
    { key: 'max_debts', label: 'Dettes autorisées', help: 'Nombre maximal de cours en dette pour être admis ; au-delà, l’étudiant est ajourné.' },
  ],
}

const round2 = (n) => Math.round(n * 100) / 100

export function weightedAverage(n1, n2, n3, notation) {
  const [w1, w2, w3] = notation.weights.map((w) => Number(w) / 100)
  return round2(n1 * w1 + n2 * w2 + n3 * w3)
}

/** ``{ average, status }`` — même logique que le serveur. */
export function simulateCourse(notes, notation) {
  const [n1, n2, n3, n4] = notes.map((v) => (v === '' || v == null ? null : Number(v)))
  if (n1 == null && n2 == null && n3 == null) return { average: null, status: 'DRAFT' }
  if (n1 == null || n2 == null || n3 == null) return { average: null, status: 'INCOMPLETE' }
  const pass = Number(notation.pass_mark)
  const base = weightedAverage(n1, n2, n3, notation)
  if (n4 == null || base >= pass) return { average: base, status: base >= pass ? 'PASSED' : 'NEEDS_MAKEUP' }
  let final
  if (notation.makeup_mode === 'replace_average') final = round2(n4)
  else if (notation.makeup_mode === 'best_of') final = round2(Math.max(base, n4))
  else {
    const slots = [n1, n2, n3]
    slots[slots.indexOf(Math.min(...slots))] = n4
    final = weightedAverage(...slots, notation)
  }
  if (notation.makeup_cap != null) final = round2(Math.min(final, Number(notation.makeup_cap)))
  return { average: final, status: final >= pass ? 'PASSED' : 'DEBT' }
}

export const COURSE_STATUS = {
  PASSED: { label: 'Validé', tone: 'success' },
  NEEDS_MAKEUP: { label: 'Rattrapage', tone: 'warning' },
  DEBT: { label: 'Dette', tone: 'danger' },
  INCOMPLETE: { label: 'Incomplet', tone: 'neutral' },
  DRAFT: { label: 'Aucune note', tone: 'neutral' },
}

/** Valeur lisible d'une règle (historique, exceptions). */
export function describeRule(section, key, value) {
  if (value == null) return 'aucun'
  if (typeof value === 'boolean') return value ? 'oui' : 'non'
  if (key === 'weights') return value.map((w) => `${w} %`).join(' / ')
  if (key === 'makeup_mode') return MAKEUP_MODES.find((m) => m.value === value)?.label ?? value
  if (key === 'makeup_scope') return MAKEUP_SCOPES.find((m) => m.value === value)?.label ?? value
  return String(value).replace('.', ',')
}

export function countOverrides(overrides) {
  return Object.values(overrides ?? {}).reduce((n, section) => n + Object.keys(section ?? {}).length, 0)
}

export const sameRules = (a, b) => JSON.stringify(a) === JSON.stringify(b)
