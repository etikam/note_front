import { parseCsv } from '@/features/teacher/students/csvPreview'

import { TEACHER_IMPORT_REQUIRED_COLUMNS } from '@/features/teacher/faculty/teacherImport.constants'

/** Aligné sur notes-api apps.teachers.services.teacher_import (MAX_ERRORS_RETURNED). */
export const TEACHER_IMPORT_MAX_ROW_MESSAGES = 100

function normalizeHeaderCell(h) {
  return String(h).trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * Contrôle obligatoires et cohérences fichier (doublons) avant envoi API.
 * N’analyse pas les lignes si les en-têtes requis manquent (déjà géré par buildCsvPreview).
 *
 * @param {string} text — contenu CSV brut
 * @param {string[]} [requiredColumns] — clés après normalisation des en-têtes
 * @returns {{ issues: { row: number; message: string }[]; totalIssueCount: number; truncated: boolean }}
 */
export function validateTeacherImportCsv(text, requiredColumns = TEACHER_IMPORT_REQUIRED_COLUMNS) {
  const rows = parseCsv(text)
  if (rows.length < 2) {
    return { issues: [], totalIssueCount: 0, truncated: false }
  }

  const headerCells = rows[0].map((h) => String(h).trim())
  const normHeaders = headerCells.map(normalizeHeaderCell)
  /** @type {Record<string, number>} première occurrence uniquement */
  const colIdx = {}
  normHeaders.forEach((n, i) => {
    if (n !== '' && !(n in colIdx)) colIdx[n] = i
  })

  for (const col of requiredColumns) {
    if (!(col in colIdx)) {
      return { issues: [], totalIssueCount: 0, truncated: false }
    }
  }

  /** @type { { row: number; message: string }[] } */
  const collected = []
  let totalIssueCount = 0
  const seenMat = new Set()
  const seenEmail = new Set()

  const sheetRowNum = (dataIndex) => dataIndex + 2

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

    const mat = get('matricule')
    const firstName = get('first_name')
    const lastName = get('last_name')
    const email = get('email')
    const line = sheetRowNum(r)

    const pushIssue = (message) => {
      totalIssueCount += 1
      if (collected.length < TEACHER_IMPORT_MAX_ROW_MESSAGES) {
        collected.push({ row: line, message })
      }
    }

    if (!mat) {
      pushIssue('Matricule vide.')
    } else if (seenMat.has(mat)) {
      pushIssue(`Matricule dupliqué dans le fichier : ${mat}.`)
    } else {
      seenMat.add(mat)
    }

    if (!firstName || !lastName) {
      pushIssue('Prénom et nom obligatoires.')
    }

    if (!email) {
      pushIssue("E-mail manquant (obligatoire : l'activation du compte ne permet pas de le saisir plus tard).")
    } else if (!email.includes('@')) {
      pushIssue('E-mail invalide.')
    } else {
      const el = email.toLowerCase()
      if (seenEmail.has(el)) {
        pushIssue('E-mail dupliqué dans le fichier.')
      } else {
        seenEmail.add(el)
      }
    }
  }

  return {
    issues: collected,
    totalIssueCount,
    truncated: totalIssueCount > collected.length,
  }
}
