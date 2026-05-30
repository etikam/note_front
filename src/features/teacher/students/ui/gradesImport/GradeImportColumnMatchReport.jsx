import { cn } from '@/shared/lib/cn'

/**
 * Rapport de correspondance colonnes attendues vs fichier Excel.
 * @param {{ headerReport: Record<string, unknown> | null | undefined }} props
 */
export function GradeImportColumnMatchReport({ headerReport }) {
  if (!headerReport) return null

  const matched = Array.isArray(headerReport.expected_matched) ? headerReport.expected_matched : []
  const missing = Array.isArray(headerReport.expected_missing) ? headerReport.expected_missing : []
  const unexpected = Array.isArray(headerReport.unexpected) ? headerReport.unexpected : []
  const headersValid = Boolean(headerReport.headers_valid)

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-lg border px-4 py-3 text-sm',
          headersValid
            ? 'border-green-200/80 bg-green-50/90 text-green-950 dark:border-green-900/50 dark:bg-green-950/35 dark:text-green-100'
            : 'border-red-200/80 bg-red-50/90 text-red-950 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-100',
        )}
        role="status"
      >
        <p className="font-semibold">
          {headersValid ? 'Structure du fichier valide' : 'Structure du fichier invalide'}
        </p>
        <p className="mt-1 text-xs opacity-90">
          {matched.length} colonne(s) attendue(s) reconnue(s) · {missing.length} manquante(s) ·{' '}
          {unexpected.length} non attendue(s)
        </p>
      </div>

      <ColumnGroup
        title="Attendu — reconnu"
        emptyLabel="Aucune colonne attendue reconnue."
        tone="matched"
        items={matched.map((item) => ({
          key: String(item.key),
          label: formatItemLabel(item),
        }))}
      />

      <ColumnGroup
        title="Attendu — non reconnu"
        emptyLabel="Toutes les colonnes attendues sont présentes."
        tone="missing"
        items={missing.map((item) => ({
          key: String(item.key),
          label: formatItemLabel(item),
          required: Boolean(item.required),
        }))}
      />

      <ColumnGroup
        title="Non attendu (ignoré à l’import)"
        emptyLabel="Aucune colonne superflue."
        tone="unexpected"
        items={unexpected.map((item, i) => ({
          key: `unexpected-${i}`,
          label: item.raw ? String(item.raw) : '—',
        }))}
      />
    </div>
  )
}

function formatItemLabel(item) {
  const label = item.label ?? item.key ?? '—'
  const col = item.column_index ? ` (col. ${item.column_index})` : ''
  return `${label}${col}`
}

/**
 * @param {{
 *   title: string
 *   emptyLabel: string
 *   tone: 'matched' | 'missing' | 'unexpected'
 *   items: { key: string; label: string; required?: boolean }[]
 * }} props
 */
function ColumnGroup({ title, emptyLabel, tone, items }) {
  const pillClass = {
    matched:
      'bg-green-100 text-green-900 ring-1 ring-green-200/80 dark:bg-green-950/45 dark:text-green-100 dark:ring-green-800/60',
    missing:
      'bg-red-100 text-red-900 ring-1 ring-red-200/80 dark:bg-red-950/45 dark:text-red-100 dark:ring-red-800/60',
    unexpected:
      'bg-amber-100 text-amber-950 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800/50',
  }[tone]

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.key}>
              <span className={cn('inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px] font-medium', pillClass)}>
                {item.label}
                {item.required ? ' *' : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
