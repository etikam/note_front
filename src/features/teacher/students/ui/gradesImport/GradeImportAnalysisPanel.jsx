import { HeaderIssuesAlert } from '@/features/teacher/students/ui/import/HeaderIssuesAlert'
import { PreviewTablePanel } from '@/features/teacher/students/ui/import/PreviewTablePanel'
import { GradeImportColumnMatchReport } from '@/features/teacher/students/ui/gradesImport/GradeImportColumnMatchReport'
import { cn } from '@/shared/lib/cn'

/**
 * @param {{ analysis: Record<string, unknown> | null }} props
 */
export function GradeImportAnalysisPanel({ analysis }) {
  if (!analysis) return null

  const fileErrors = Array.isArray(analysis.file_errors) ? analysis.file_errors : []
  const rowErrors = Array.isArray(analysis.errors) ? analysis.errors : []
  const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : []
  const headers = Array.isArray(analysis.headers) ? analysis.headers : []
  const previewRows = Array.isArray(analysis.preview_rows) ? analysis.preview_rows : []
  const totalRows = Number(analysis.preview_total_data_rows ?? 0)

  return (
    <div className="space-y-5">
      <GradeImportColumnMatchReport headerReport={analysis.header_report} />

      <HeaderIssuesAlert messages={fileErrors} />

      {analysis.detail ? (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          {String(analysis.detail)}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="À inscrire" value={analysis.to_enroll_count} />
        <StatCard label="Déjà inscrits" value={analysis.already_enrolled_count} />
        <StatCard label="Notes sans conflit" value={analysis.pending_safe_count} />
        <StatCard label="Conflits" value={analysis.conflicts_count} tone="warning" />
      </div>

      {rowErrors.length ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
            Lignes rejetées ({rowErrors.length})
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_94%,transparent)] p-3 text-xs">
            {rowErrors.map((er, i) => (
              <li key={i}>
                <span className="font-mono">L.{er.row}</span> · <span className="font-mono">{er.matricule}</span> —{' '}
                {er.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length ? (
        <ul className="space-y-1 rounded-lg border border-amber-200/60 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          {warnings.map((w, i) => (
            <li key={i}>{w.message ?? String(w)}</li>
          ))}
        </ul>
      ) : null}

      {headers.length > 0 && previewRows.length > 0 ? (
        <PreviewTablePanel headers={headers} dataRows={previewRows} totalDataRows={totalRows} />
      ) : null}
    </div>
  )
}

function StatCard({ label, value, tone = 'neutral' }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--app-border)] px-3 py-3 text-center',
        'bg-[color-mix(in_srgb,var(--app-elevated)_92%,var(--app-canvas))]',
        tone === 'warning' && 'border-amber-300/50',
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--app-muted)]">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-[var(--app-fg)]">{Number(value ?? 0)}</p>
    </div>
  )
}
