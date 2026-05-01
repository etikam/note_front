import { IMPORT_REQUIRED_HEADERS } from '@/features/teacher/students/csvPreview'

/** Libellés d’affichage (clé normalisée → affichage). */
const REQUIRED_LABELS = {
  matricule: 'matricule',
  first_name: 'first_name',
  last_name: 'last_name',
  ine: 'INE',
  department_code: 'department_code',
  level_cycle: 'level_cycle',
  level_number: 'level_number',
}

function normHeader(h) {
  return String(h).trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * État de correspondance des colonnes obligatoires avec la première ligne du CSV.
 * @param {string[] | undefined} headers — en-têtes bruts du fichier
 * @returns {{ items: { key: string; label: string; matched: boolean }[]; matchedCount: number; missingCount: number; totalRequired: number }}
 */
export function getRequiredColumnMatchState(headers) {
  const list = headers ?? []
  const normalized = list.map(normHeader)
  const items = IMPORT_REQUIRED_HEADERS.map((key) => ({
    key,
    label: REQUIRED_LABELS[key] ?? key,
    matched: normalized.includes(key),
  }))
  const matchedCount = items.filter((i) => i.matched).length
  const totalRequired = items.length
  return {
    items,
    matchedCount,
    missingCount: totalRequired - matchedCount,
    totalRequired,
  }
}
