/**
 * Indique si l’analyse serveur autorise le lancement de l’import (commit).
 * @param {Record<string, unknown> | null | undefined} analysis
 */
export function canLaunchGradeImport(analysis) {
  if (!analysis) return false
  const hr = analysis.header_report
  if (!hr || !hr.headers_valid) return false
  const fileErrors = Array.isArray(analysis.file_errors) ? analysis.file_errors : []
  if (fileErrors.length > 0) return false
  if (!analysis.batch_public_id) return false
  if (analysis.importable === false) return false
  const raw = analysis.expires_at
  if (raw && typeof raw === 'string') {
    const exp = Date.parse(raw)
    if (!Number.isNaN(exp) && Date.now() >= exp) return false
  }
  return true
}

/**
 * @param {Record<string, unknown> | null | undefined} analysis
 */
export function gradeImportLaunchHint(analysis) {
  if (!analysis) return 'Analysez le fichier pour afficher le rapport.'
  const hr = analysis.header_report
  if (!hr?.headers_valid) {
    return 'Colonne matricule obligatoire : corrigez les en-têtes du fichier.'
  }
  const fileErrors = Array.isArray(analysis.file_errors) ? analysis.file_errors : []
  if (fileErrors.length > 0) {
    return 'Corrigez les erreurs de fichier signalées ci-dessus.'
  }
  const raw = analysis.expires_at
  if (raw && typeof raw === 'string') {
    const exp = Date.parse(raw)
    if (!Number.isNaN(exp) && Date.now() >= exp) {
      return 'Lot expiré — relancez l’analyse du fichier.'
    }
  }
  if (!analysis.batch_public_id) {
    return analysis.detail ?? 'Aucune donnée importable — vérifiez le contenu du fichier.'
  }
  return null
}
