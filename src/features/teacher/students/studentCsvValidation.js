import { parseCsv, IMPORT_REQUIRED_HEADERS } from '@/features/teacher/students/csvPreview'

/** Aligné sur notes-api apps.students.services.student_import (MAX_ERRORS_RETURNED). */
export const STUDENT_IMPORT_MAX_ROW_MESSAGES = 100

const VALID_CYCLES = new Set(['LICENCE', 'MASTER', 'DOCTORAT'])

const HEADER_ALIASES = {
  nom_pere: 'dad_name',
  nom_du_pere: 'dad_name',
  pere: 'dad_name',
  nom_mere: 'mum_name',
  nom_de_la_mere: 'mum_name',
  mere: 'mum_name',
}

function normalizeHeaderCell(h) {
  const key = String(h).trim().toLowerCase().replace(/\s+/g, '_')
  return HEADER_ALIASES[key] ?? key
}

/**
 * Contrôle obligatoires et cohérences fichier avant envoi API (sans référentiel département/niveau).
 *
 * @param {string} text — contenu CSV brut
 * @param {string[]} [requiredColumns] — clés après normalisation des en-têtes
 * @returns {{ issues: { row: number; message: string }[]; totalIssueCount: number; truncated: boolean }}
 */
export function validateStudentImportCsv(text, requiredColumns = IMPORT_REQUIRED_HEADERS) {
  const rows = parseCsv(text)
  if (rows.length < 2) {
    return { issues: [], totalIssueCount: 0, truncated: false }
  }

  const headerCells = rows[0].map((h) => String(h).trim())
  const normHeaders = headerCells.map(normalizeHeaderCell)
  /** @type {Record<string, number>} */
  const colIdx = {}
  normHeaders.forEach((n, i) => {
    if (n !== '' && !(n in colIdx)) colIdx[n] = i
  })

  for (const col of requiredColumns) {
    if (!(col in colIdx)) {
      return { issues: [], totalIssueCount: 0, truncated: false }
    }
  }

  /** @type {{ row: number; message: string }[]} */
  const collected = []
  let totalIssueCount = 0
  const seenMat = new Set()
  const seenIne = new Set()

  const sheetRowNum = (dataIndex) => dataIndex + 2

  const pushIssue = (row, message) => {
    totalIssueCount += 1
    if (collected.length < STUDENT_IMPORT_MAX_ROW_MESSAGES) {
      collected.push({ row, message })
    }
  }

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    if (!cells.length || cells.every((c) => String(c ?? '').trim() === '')) {
      continue
    }

    const get = (key) => {
      const idx = colIdx[key]
      if (idx === undefined || idx >= cells.length) return ''
      return String(cells[idx] ?? '').trim()
    }

    const line = sheetRowNum(r)
    const matricule = get('matricule')
    const firstName = get('first_name')
    const lastName = get('last_name')
    const ine = get('ine')
    const deptCode = get('department_code')
    const cycle = get('level_cycle').toUpperCase()
    const levelNumRaw = get('level_number')

    if (!matricule || !firstName || !lastName || !ine) {
      pushIssue(line, 'matricule, first_name, last_name et INE sont obligatoires.')
    } else {
      if (seenMat.has(matricule)) {
        pushIssue(line, `Matricule en doublon dans le fichier : ${matricule}.`)
      } else {
        seenMat.add(matricule)
      }
      if (seenIne.has(ine)) {
        pushIssue(line, `INE en doublon dans le fichier : ${ine}.`)
      } else {
        seenIne.add(ine)
      }
    }

    if (!deptCode || !cycle || !levelNumRaw) {
      pushIssue(line, 'department_code, level_cycle et level_number sont obligatoires.')
    }

    if (levelNumRaw && !/^-?\d+$/.test(levelNumRaw)) {
      pushIssue(line, 'level_number doit être un entier.')
    }

    if (cycle && !VALID_CYCLES.has(cycle)) {
      pushIssue(line, 'level_cycle doit être LICENCE, MASTER ou DOCTORAT.')
    }

    const gender = get('gender').toUpperCase()
    if (gender && gender !== 'M' && gender !== 'F') {
      pushIssue(line, 'gender doit être M ou F.')
    }

    const birthDate = get('birth_date')
    if (
      birthDate &&
      !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
      !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(birthDate)
    ) {
      pushIssue(line, 'birth_date attendu au format YYYY-MM-DD ou JJ/MM/AAAA.')
    }
  }

  return {
    issues: collected,
    totalIssueCount,
    truncated: totalIssueCount > collected.length,
  }
}
