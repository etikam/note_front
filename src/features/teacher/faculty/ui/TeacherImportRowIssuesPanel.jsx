import { AlertTriangle } from 'lucide-react'

import { importTableClassName } from '@/features/teacher/students/ui/import/import.constants'

/**
 * Rapport de validation locale (avant envoi serveur).
 * @param {{
 *   rowValidation: { issues: { row: number; message: string }[]; totalIssueCount: number; truncated: boolean }
 * }} props
 */
export function TeacherImportRowIssuesPanel({ rowValidation }) {
  const { issues, totalIssueCount, truncated } = rowValidation
  if (totalIssueCount === 0) return null

  return (
    <div
      className="overflow-hidden rounded-xl border border-orange-200 bg-orange-50/60 dark:border-orange-900/45 dark:bg-orange-950/25"
      role="region"
      aria-label="Rapport de validation des lignes"
    >
      <div className="flex items-center gap-2 border-b border-orange-200/80 px-4 py-3 dark:border-orange-900/40">
        <AlertTriangle className="shrink-0 text-orange-600 dark:text-orange-400" size={18} aria-hidden />
        <p className="text-sm font-semibold text-orange-950 dark:text-orange-100">
          {totalIssueCount} problème{totalIssueCount > 1 ? 's' : ''} sur les données (import bloqué)
        </p>
      </div>
      <div className="overflow-x-auto px-1 pb-1">
        <table className={importTableClassName}>
          <thead>
            <tr>
              <th>Ligne fichier</th>
              <th>Détail</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((row, i) => (
              <tr key={`${row.row}-${i}`}>
                <td className="whitespace-nowrap font-mono text-xs">{row.row}</td>
                <td>{row.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated ? (
        <p className="border-t border-orange-200/80 px-4 py-2 text-xs text-orange-900/90 dark:border-orange-900/40 dark:text-orange-200/90">
          Affichage limité aux {issues.length} premiers messages — corrigez le fichier puis rechargez-le.
        </p>
      ) : null}
    </div>
  )
}
