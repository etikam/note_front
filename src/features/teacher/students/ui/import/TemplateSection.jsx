import { Download, FileSpreadsheet } from 'lucide-react'

import { CsvRequirementsDetails } from '@/features/teacher/students/ui/import/CsvRequirementsDetails'
import { OPTIONAL_COLUMNS, REQUIRED_COLUMNS } from '@/features/teacher/students/ui/import/import.constants'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

/**
 * Modèle de fichier : aperçu « tableur » de la ligne d'en-têtes (obligatoires en couleur,
 * facultatives en gris), téléchargement, règles détaillées.
 *
 * @param {{
 *   onDownload: () => void
 *   requiredColumns?: string[]
 *   optionalColumns?: string[]
 *   fileKind?: 'csv' | 'xlsx'
 *   disabled?: boolean
 *   detailsSlot?: import('react').ReactNode
 * }} props
 */
export function TemplateSection({ onDownload, requiredColumns = REQUIRED_COLUMNS, optionalColumns, fileKind = 'csv', disabled = false, detailsSlot }) {
  const optional = optionalColumns ?? (requiredColumns === REQUIRED_COLUMNS ? OPTIONAL_COLUMNS : [])
  const details = detailsSlot !== undefined ? detailsSlot : <CsvRequirementsDetails />
  const columns = [...requiredColumns.map((name) => ({ name, required: true })), ...optional.map((name) => ({ name, required: false }))]

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
        <div className="flex items-center gap-2 border-b border-[var(--app-border)] bg-[var(--app-subtle)] px-3 py-2">
          <FileSpreadsheet size={14} className="text-green-600 dark:text-green-400" aria-hidden />
          <span className="font-mono text-[11.5px] text-[var(--app-fg-soft)]">modele_import.{fileKind}</span>
          <span className="ml-auto flex gap-1" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-white/20" />
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-max min-w-full border-collapse text-[11.5px]">
            <thead>
              <tr>
                <th className="w-8 border-b border-r border-[var(--app-border)] bg-[var(--app-subtle)] px-2 py-1 text-[10px] font-normal text-[var(--app-muted)]" />
                {columns.map((c, i) => (
                  <th key={c.name} className="border-b border-r border-[var(--app-border)] bg-[var(--app-subtle)] px-2 py-1 text-center text-[10px] font-normal text-[var(--app-muted)]">
                    {String.fromCharCode(65 + (i % 26))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-r border-[var(--app-border)] bg-[var(--app-subtle)] px-2 py-1.5 text-center text-[10px] text-[var(--app-muted)]">1</td>
                {columns.map((c) => (
                  <td
                    key={c.name}
                    className={cn(
                      'whitespace-nowrap border-b border-r border-[var(--app-border)] px-2.5 py-1.5 font-mono font-semibold',
                      c.required ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-100' : 'text-[var(--app-muted)]',
                    )}
                    title={c.required ? 'Colonne obligatoire' : 'Colonne facultative'}
                  >
                    {c.name}
                    {c.required ? <span className="ml-0.5 text-red-600 dark:text-red-400">*</span> : null}
                  </td>
                ))}
              </tr>
              {[2, 3].map((n) => (
                <tr key={n} className="opacity-50">
                  <td className="border-r border-[var(--app-border)] bg-[var(--app-subtle)] px-2 py-1.5 text-center text-[10px] text-[var(--app-muted)]">{n}</td>
                  {columns.map((c) => (
                    <td key={c.name} className="border-r border-[var(--app-border)] px-2.5 py-1.5">
                      <span className="block h-1.5 w-12 rounded bg-[var(--app-border)]" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="button" onClick={onDownload} disabled={disabled}>
          <Download size={15} aria-hidden /> Télécharger le modèle (.{fileKind})
        </Button>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--app-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-brand-100 ring-1 ring-brand-500/30 dark:bg-brand-500/20" aria-hidden />
            {requiredColumns.length} obligatoire{requiredColumns.length > 1 ? 's' : ''} (<span className="text-red-600 dark:text-red-400">*</span>)
          </span>
          {optional.length ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[var(--app-subtle)] ring-1 ring-[var(--app-border)]" aria-hidden />
              {optional.length} facultative{optional.length > 1 ? 's' : ''}
            </span>
          ) : null}
        </span>
      </div>
      {details}
    </div>
  )
}
