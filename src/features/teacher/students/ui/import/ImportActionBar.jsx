import { CheckCircle2, CircleAlert, Play } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

/**
 * Bandeau de lancement : nombre de lignes prêtes ou raison du blocage, et bouton d'import.
 *
 * @param {{ ready: boolean, count?: number, entityLabel?: string, hint?: string | null, busy?: boolean, onRun: () => void, label?: string }} props
 */
export function ImportActionBar({ ready, count = 0, entityLabel = 'ligne', hint, busy = false, onRun, label = 'Lancer l’import' }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3',
        ready ? 'border-green-600/25 bg-green-50/70 dark:border-green-400/25 dark:bg-green-500/[0.07]' : 'border-[var(--app-border)] bg-[var(--app-subtle)]',
      )}
    >
      {ready ? (
        <CheckCircle2 size={20} className="shrink-0 text-green-600 dark:text-green-400" aria-hidden />
      ) : (
        <CircleAlert size={20} className="shrink-0 text-[var(--app-muted)]" aria-hidden />
      )}
      <p className="min-w-0 flex-1 text-[13px]">
        {ready ? (
          <>
            <span className="font-semibold text-[var(--app-fg)]">
              {count} {entityLabel}
              {count > 1 ? 's' : ''} prête{count > 1 ? 's' : ''} à importer.
            </span>{' '}
            <span className="text-[var(--app-muted)]">Le fichier a passé tous les contrôles.</span>
          </>
        ) : (
          <span className="text-[var(--app-fg-soft)]">{hint || 'Import indisponible pour le moment.'}</span>
        )}
      </p>
      <Button type="button" onClick={onRun} disabled={!ready || busy}>
        <Play size={15} aria-hidden /> {label}
      </Button>
    </div>
  )
}
