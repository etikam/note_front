import { Loader2 } from 'lucide-react'

/**
 * Envoi en cours : barre de progression (pourcentage réel si connu, sinon défilement).
 * @param {{ uploadProgress: number | null }} props
 */
export function ImportProgressBlock({ uploadProgress }) {
  const sending = uploadProgress != null && uploadProgress < 100
  return (
    <div className="rounded-2xl border border-brand-500/30 bg-brand-50/50 px-4 py-4 dark:bg-brand-500/[0.07]" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white dark:bg-brand-500">
          <Loader2 size={18} className="animate-spin" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-[var(--app-fg)]">{sending ? 'Envoi du fichier…' : 'Traitement sur le serveur…'}</p>
          <p className="text-[12px] text-[var(--app-muted)]">Ne fermez pas la page : chaque ligne est contrôlée puis enregistrée.</p>
        </div>
        {uploadProgress != null ? <span className="font-heading text-[18px] font-semibold tabular-nums text-brand-700 dark:text-brand-200">{uploadProgress} %</span> : null}
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress ?? undefined}>
        <div
          className="h-full rounded-full bg-[length:1.25rem_1.25rem] bg-brand-600 bg-[linear-gradient(45deg,rgb(255_255_255/0.22)_25%,transparent_25%,transparent_50%,rgb(255_255_255/0.22)_50%,rgb(255_255_255/0.22)_75%,transparent_75%)] transition-[width] duration-300 motion-safe:animate-[import-stripes_0.8s_linear_infinite] dark:bg-brand-400"
          style={{ width: `${uploadProgress ?? 40}%` }}
        />
      </div>
    </div>
  )
}
