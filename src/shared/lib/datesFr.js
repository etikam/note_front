/**
 * Dates affichées en français dans l’UI (jj/mm/aaaa via le datepicker) ;
 * dans le state et vers l’API : **`YYYY-MM-DD`** (fuseau local, sans heure).
 */

/**
 * Extrait `YYYY-MM-DD` depuis une réponse API (date ou datetime ISO).
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function apiDateToIsoField(value) {
  if (value == null || value === '') return ''
  const t = String(value).trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ''
}

/**
 * @param {string} iso — `YYYY-MM-DD`
 * @returns {Date | null} date à minuit local
 */
export function isoFieldToLocalDate(iso) {
  if (!iso || typeof iso !== 'string') return null
  const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return dt
}

/**
 * @param {Date} dt
 * @returns {string} `YYYY-MM-DD`
 */
export function localDateToIsoField(dt) {
  if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return ''
  const y = dt.getFullYear()
  const mo = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

/** Affichage jj/mm/aaaa depuis une chaîne API ISO (champ texte ou libellé). */
export function isoDateToFr(iso) {
  if (iso == null || iso === '') return ''
  const s = String(iso).trim()
  const dayPart = s.length >= 10 ? s.slice(0, 10) : s
  const m = dayPart.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return ''
  return `${m[3]}/${m[2]}/${m[1]}`
}

/** Parse saisie jj/mm/aaaa (séparateurs / ou .) → ISO ou null. */
export function frDateToIso(fr) {
  const s = (fr ?? '').trim()
  if (!s) return null
  const m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/)
  if (!m) return null
  const d = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10)
  const y = parseInt(m[3], 10)
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
