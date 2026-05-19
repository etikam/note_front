function firstNonEmptyLine(text) {
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    if (line.trim()) return line
  }
  return ''
}

/**
 * Détecte le séparateur (`,` ou `;`) à partir de la première ligne non vide, aligné sur le backend.
 * @param {string} text
 * @returns {',' | ';'}
 */
export function inferCsvDelimiter(text) {
  const line = firstNonEmptyLine(text)
  if (!line) return ','
  const commas = line.split(',').length - 1
  const semis = line.split(';').length - 1
  return semis > commas ? ';' : ','
}

/**
 * Parse CSV text into rows (UTF-8). Gère guillemets et séparateur `,` ou `;`.
 * @param {string} text
 * @param {',' | ';' | null} [delimiter] — si omis, déduit depuis la première ligne
 */
export function parseCsv(text, delimiter = null) {
  const delim = delimiter === null ? inferCsvDelimiter(text) : delimiter
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
    } else if (c === delim) {
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
 * @param {string[]} [requiredHeaders] — clés normalisées attendues (défaut : import étudiants)
 */
export function buildCsvPreview(text, maxRows = 12, requiredHeaders = IMPORT_REQUIRED_HEADERS) {
  const rows = parseCsv(text)
  if (rows.length === 0) {
    return { headers: [], dataRows: [], totalDataRows: 0, headerIssues: ['Fichier vide.'] }
  }
  const headers = rows[0].map((h) => String(h).trim())
  const normalized = headers.map(NORM)
  const issues = []
  for (const req of requiredHeaders) {
    if (!normalized.includes(req)) {
      issues.push(`Colonne manquante ou mal nommée : « ${req} »`)
    }
  }
  const dataRows = rows.slice(1, 1 + maxRows)
  const totalDataRows = Math.max(0, rows.length - 1)
  return { headers, dataRows, totalDataRows, headerIssues: issues }
}
