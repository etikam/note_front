import { Spinner } from '@/shared/ui/Spinner'
import { cn } from '@/shared/lib/cn'

/**
 * @param {{ uploadProgress: number | null }} props
 */
export function ImportProgressBlock({ uploadProgress }) {
  return (
    <div
      className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-4 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_90%,black)]"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <Spinner size="md" label="Import en cours" />
        <span className="text-sm text-zinc-600 dark:text-zinc-300">Envoi et traitement sur le serveur…</span>
      </div>
      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={uploadProgress ?? undefined}
      >
        {uploadProgress != null ? (
          <div
            className="h-full rounded-full bg-brand-500 transition-[width] duration-200 dark:bg-brand-400"
            style={{ width: `${uploadProgress}%` }}
          />
        ) : (
          <div className="h-full w-2/5 rounded-full bg-brand-500/90 motion-safe:animate-pulse dark:bg-brand-400/90" />
        )}
      </div>
    </div>
  )
}
