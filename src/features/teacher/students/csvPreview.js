/**
 * Parse CSV text into rows (UTF-8). Gère guillemets et virgules dans les champs.
 */
export function parseCsv(text) {
  const rows = []
  let row = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(cur)
      cur = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cur)
      cur = ''
      if (row.some((cell) => String(cell).trim() !== '')) {
        rows.push(row)
      }
      row = []
    } else {
      cur += c
    }
  }
  row.push(cur)
  if (row.some((cell) => String(cell).trim() !== '')) {
    rows.push(row)
  }
  return rows
}

const NORM = (h) => h.trim().toLowerCase().replace(/\s+/g, '_')

/** Colonnes requises côté serveur (normalisées en minuscules). */
export const IMPORT_REQUIRED_HEADERS = [
  'matricule',
  'first_name',
  'last_name',
  'ine',
  'department_code',
  'level_cycle',
  'level_number',
]

/**
 * @param {string} text — contenu CSV
 * @param {number} maxRows — lignes de données à afficher (hors en-tête)
 */
export function buildCsvPreview(text, maxRows = 12) {
  const rows = parseCsv(text)
  if (rows.length === 0) {
    return { headers: [], dataRows: [], totalDataRows: 0, headerIssues: ['Fichier vide.'] }
  }
  const headers = rows[0].map((h) => String(h).trim())
  const normalized = headers.map(NORM)
  const issues = []
  for (const req of IMPORT_REQUIRED_HEADERS) {
    if (!normalized.includes(req)) {
      issues.push(`Colonne manquante ou mal nommée : « ${req} »`)
    }
  }
  const dataRows = rows.slice(1, 1 + maxRows)
  const totalDataRows = Math.max(0, rows.length - 1)
  return { headers, dataRows, totalDataRows, headerIssues: issues }
}
