/**
 * Persistance de l'année académique choisie (localStorage).
 * Utilisée par l'intercepteur Axios et par le contexte React — une seule source de vérité.
 */
const STORAGE_KEY_ID = 'gestion_ci.academic_year_id'
/** Session : l'utilisateur a explicitement effacé l'année (ne pas appliquer automatiquement `is_current`). */
const SESSION_EXPLICIT_CLEAR = 'gestion_ci.academic_year_explicit_clear'

/**
 * @returns {string|null} ID numérique de l'année (string) ou null si non défini
 */
export function getStoredAcademicYearId() {
  return localStorage.getItem(STORAGE_KEY_ID)
}

/**
 * @param {string|number|null|undefined} id — PK AcademicYear ; null/undefined efface
 */
export function setStoredAcademicYearId(id) {
  if (id === null || id === undefined || id === '') {
    localStorage.removeItem(STORAGE_KEY_ID)
    return
  }
  localStorage.setItem(STORAGE_KEY_ID, String(id))
}

export function clearStoredAcademicYearId() {
  localStorage.removeItem(STORAGE_KEY_ID)
}

/**
 * @returns {number|null}
 */
export function getStoredAcademicYearIdAsNumber() {
  const raw = getStoredAcademicYearId()
  if (raw === null) return null
  const n = Number.parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

export function setAcademicYearExplicitClear() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_EXPLICIT_CLEAR, '1')
  }
}

export function clearAcademicYearExplicitClear() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_EXPLICIT_CLEAR)
  }
}

export function hasAcademicYearExplicitClear() {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(SESSION_EXPLICIT_CLEAR) === '1'
}
