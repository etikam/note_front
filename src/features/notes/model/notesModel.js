/**
 * Espace « Notes » : libellés, échelle de couleurs autour du seuil, aides de calcul et d'affichage.
 */
import { fmtNote } from '@/features/reports/model/reportExport'

export { fmtNote }

export const UNIT_STATE = {
  validated: { label: 'Acquise', tone: 'success' },
  compensated: { label: 'Compensée', tone: 'info' },
  failed: { label: 'Non acquise', tone: 'danger' },
  pending: { label: 'En attente', tone: 'neutral' },
}

export const GRADE_STATUS = {
  PASSED: { label: 'Validé', tone: 'success', mark: null },
  NEEDS_MAKEUP: { label: 'Rattrapage', tone: 'warning', mark: 'R' },
  DEBT: { label: 'Dette', tone: 'danger', mark: 'D' },
  INCOMPLETE: { label: 'Incomplet', tone: 'neutral', mark: null },
  DRAFT: { label: 'Non noté', tone: 'neutral', mark: null },
}

export const DECISION_ORDER = ['admitted', 'admitted_debt', 'makeup', 'repeat', 'pending']
export const DECISION_LABEL = {
  admitted: 'Admis',
  admitted_debt: 'Admis avec dette',
  makeup: 'Rattrapage',
  repeat: 'Ajourné',
  pending: 'En attente',
  none: 'Aucun cours',
}

export const NOTE_LABELS = ['N1', 'N2', 'N3', 'R']

export const SEMESTERS = [1, 2, 3, 4, 5, 6]

/** Résultat affiché d'une cellule : compensé l'emporte sur le statut du cours. */
export function cellResult(cell) {
  if (!cell || cell.state !== 'graded') return null
  if (cell.compensated) return { label: 'Compensé', tone: 'info', mark: 'C' }
  return GRADE_STATUS[cell.status] ?? null
}

/**
 * Échelle divergente autour du seuil : rouge sous le seuil, bleu au-dessus, gris neutre au seuil.
 * Renvoie l'intensité signée dans [-1, 1] (``null`` sans valeur), quantifiée en 4 pas par bras.
 */
export function heatLevel(value, { scale_max: scale = 10, pass_mark: pass = 5 } = {}) {
  if (value == null) return null
  const v = Number(value)
  const t = v >= pass ? (v - pass) / Math.max(0.001, scale - pass) : -(pass - v) / Math.max(0.001, pass)
  const step = Math.min(4, Math.ceil(Math.abs(t) * 4))
  return Math.sign(t) * (step / 4)
}

/** Style CSS d'une cellule de la grille (variables ``--heat-*`` définies dans globals.css). */
export function heatStyle(value, grading) {
  const level = heatLevel(value, grading)
  if (level == null) return undefined
  if (level === 0) return { background: 'var(--heat-mid)', color: 'var(--app-fg)' }
  const pole = level > 0 ? 'var(--heat-pos)' : 'var(--heat-neg)'
  const pct = Math.round(Math.abs(level) * 78)
  return {
    background: `color-mix(in oklab, ${pole} ${pct}%, var(--heat-mid))`,
    color: Math.abs(level) >= 0.75 ? '#fff' : 'var(--app-fg)',
  }
}

/** Fraction [0, 1] d'une note sur le barème (jauges). */
export const ratio = (value, scale = 10) => (value == null ? 0 : Math.max(0, Math.min(1, Number(value) / Number(scale || 10))))

export const fmtPct = (v) => (v == null ? '—' : `${String(Math.round(v * 10) / 10).replace('.', ',')} %`)

export const fullName = (s) => `${s.last_name ?? ''} ${s.first_name ?? ''}`.trim()

/** Rang lisible : « 1er », « 2e ». */
export const ordinal = (n) => (n == null ? '—' : n === 1 ? '1er' : `${n}e`)

/** Tous les cours d'une structure ``[{semester, units: [{courses}]}]`` à plat, avec leur UE. */
export function flatCourses(structure = []) {
  return structure.flatMap((sem) => sem.units.flatMap((u) => u.courses.map((c) => ({ ...c, unit: u, semester: sem.semester }))))
}

export function flatUnits(structure = []) {
  return structure.flatMap((sem) => sem.units.map((u) => ({ ...u, semester: sem.semester })))
}

/** Périodes d'un relevé : année en cours, un semestre, tout le parcours. */
export const PERIODS = [
  { value: '', label: 'Année en cours' },
  ...SEMESTERS.map((n) => ({ value: `S${n}`, label: `Semestre ${n}` })),
  { value: 'all', label: 'Parcours complet' },
]

export const periodParams = (period) => (period === 'all' ? { allYears: true } : period?.startsWith('S') ? { semester: Number(period.slice(1)) } : {})

/** Lien public de vérification d'un relevé délivré (QR code). */
export const verifyUrl = (code) => `${window.location.origin}/verify/${code}`
