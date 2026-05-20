/**
 * @param {{
 *   created_count?: number
 *   skipped_count?: number
 *   error_count?: number
 * }} result
 * @param {{ entityLabel?: string }} [options]
 */
export function getImportResultSummary(result, options = {}) {
  const entity = options.entityLabel ?? 'enregistrement'
  const entityPlural = entity.endsWith('s') ? entity : `${entity}s`
  const created = result?.created_count ?? 0
  const skipped = result?.skipped_count ?? 0
  const errors = result?.error_count ?? 0

  if (errors > 0 && created === 0) {
    return {
      tone: 'error',
      title: 'Import non effectué',
      message: `Aucun ${entity} créé. ${errors} ligne${errors > 1 ? 's' : ''} en erreur.`,
      hint: 'Corrigez le fichier puis relancez l’import. Ne renvoyez pas le même fichier sans correction.',
    }
  }

  if (errors > 0 && created > 0) {
    return {
      tone: 'warning',
      title: 'Import partiellement réussi',
      message: `${created} ${created > 1 ? entityPlural : entity} créé${created > 1 ? 's' : ''}, ${errors} erreur${errors > 1 ? 's' : ''}.`,
      hint: 'Les lignes valides sont en base. Corrigez les erreurs signalées ci-dessous avant un nouvel envoi.',
    }
  }

  if (created > 0 && skipped > 0) {
    return {
      tone: 'warning',
      title: 'Import terminé',
      message: `${created} ${created > 1 ? entityPlural : entity} créé${created > 1 ? 's' : ''}, ${skipped} ligne${skipped > 1 ? 's' : ''} ignorée${skipped > 1 ? 's' : ''} (doublons).`,
      hint: 'L’import est terminé — ne relancez pas le même fichier.',
    }
  }

  if (created > 0) {
    return {
      tone: 'success',
      title: 'Import réussi',
      message: `${created} ${created > 1 ? entityPlural : entity} ${created > 1 ? 'ont' : 'a'} été créé${created > 1 ? 's' : ''} avec succès.`,
      hint: 'L’import est terminé. Inutile de relancer le même fichier.',
    }
  }

  return {
    tone: 'warning',
    title: 'Import terminé',
    message: 'Aucune ligne n’a été créée.',
    hint: skipped > 0 ? `${skipped} ligne${skipped > 1 ? 's' : ''} ignorée${skipped > 1 ? 's' : ''}.` : 'Vérifiez le détail ci-dessous.',
  }
}
