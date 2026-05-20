import { useEffect, useId } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

import { getImportResultSummary } from '@/features/teacher/students/ui/import/importResultSummary'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

const TONE_STYLES = {
  success: {
    Icon: CheckCircle2,
    iconWrap:
      'bg-green-50 text-green-600 ring-green-200 dark:bg-green-950/50 dark:text-green-300 dark:ring-green-800/60',
    accent: 'text-green-800 dark:text-green-200',
  },
  warning: {
    Icon: AlertTriangle,
    iconWrap:
      'bg-orange-50 text-orange-600 ring-orange-200 dark:bg-orange-950/45 dark:text-orange-300 dark:ring-orange-800/60',
    accent: 'text-orange-950 dark:text-orange-100',
  },
  error: {
    Icon: XCircle,
    iconWrap: 'bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-800/60',
    accent: 'text-red-950 dark:text-red-100',
  },
}

/**
 * Modale de feedback après import CSV (succès, partiel ou échec).
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   result: {
 *     created_count?: number
 *     skipped_count?: number
 *     error_count?: number
 *   } | null
 *   entityLabel?: string
 *   confirmLabel?: string
 * }} props
 */
export function ImportResultAlertModal({
  open,
  onClose,
  result,
  entityLabel = 'étudiant',
  confirmLabel = 'Compris',
}) {
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !result) return null

  const summary = getImportResultSummary(result, { entityLabel })
  const tone = TONE_STYLES[summary.tone] ?? TONE_STYLES.warning
  const { Icon } = tone
  const created = result.created_count ?? 0
  const skipped = result.skipped_count ?? 0
  const errors = result.error_count ?? 0

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/55 dark:bg-black/75 backdrop-blur-[3px]"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl ring-1 ring-black/5 dark:ring-white/10',
          'bg-[var(--app-elevated)] border-[var(--app-border)] text-[var(--app-fg)]',
          'animate-in fade-in zoom-in-95 duration-200',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4 px-5 py-5">
          <span
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1',
              tone.iconWrap,
            )}
          >
            <Icon size={24} strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 id={titleId} className={cn('text-base font-semibold', tone.accent)}>
              {summary.title}
            </h2>
            <p id={descId} className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {summary.message}
            </p>
            <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">{summary.hint}</p>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border border-brand-200/70 bg-brand-50/60 px-2 py-2 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]">
                <dt className="text-zinc-500 dark:text-zinc-400">Créés</dt>
                <dd className="mt-0.5 font-heading text-lg font-bold tabular-nums">{created}</dd>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-2 py-2 dark:border-[var(--app-border)] dark:bg-[var(--app-elevated)]">
                <dt className="text-zinc-500 dark:text-zinc-400">Ignorés</dt>
                <dd className="mt-0.5 font-heading text-lg font-bold tabular-nums">{skipped}</dd>
              </div>
              <div className="rounded-lg border border-orange-200/70 bg-orange-50/60 px-2 py-2 dark:border-orange-900/40 dark:bg-orange-950/25">
                <dt className="text-zinc-500 dark:text-zinc-400">Erreurs</dt>
                <dd className="mt-0.5 font-heading text-lg font-bold tabular-nums">{errors}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="flex justify-end border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-elevated)_88%,white)] px-5 py-3 dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
          <Button type="button" variant="primary" onClick={onClose} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
