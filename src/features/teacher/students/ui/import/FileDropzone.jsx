import { forwardRef } from 'react'
import { FileUp, ShieldCheck } from 'lucide-react'

import { MAX_FILE_SIZE_LABEL } from '@/features/teacher/students/ui/import/import.constants'
import { cn } from '@/shared/lib/cn'

const hintId = 'import-dropzone-hint'

/**
 * Zone de dépôt : glisser-déposer ou clic (clavier : Entrée / Espace), formats acceptés,
 * rappel que le contrôle se fait sur l'appareil avant l'envoi.
 *
 * @param {{
 *   drag: boolean
 *   disabled?: boolean
 *   onDragEnter: () => void
 *   onDragLeave: () => void
 *   onDragOver: (e: import('react').DragEvent) => void
 *   onDrop: (e: import('react').DragEvent) => void
 *   onFileChange: (e: import('react').ChangeEvent<HTMLInputElement>) => void
 *   onPickClick: () => void
 *   accept?: string
 *   fileKindLabel?: string
 *   inputAriaLabel?: string
 * }} props
 */
export const FileDropzone = forwardRef(function FileDropzone(
  {
    drag,
    disabled = false,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onFileChange,
    onPickClick,
    accept = '.csv,text/csv',
    fileKindLabel = 'CSV',
    inputAriaLabel = 'Sélectionner un fichier CSV',
  },
  ref,
) {
  const formats = accept
    .split(',')
    .map((a) => a.trim())
    .filter((a) => a.startsWith('.'))
    .map((a) => a.slice(1).toUpperCase())

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Déposer ou choisir le fichier ${fileKindLabel}`}
      aria-describedby={hintId}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onPickClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onPickClick()
        }
      }}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none transition-all',
        'focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-canvas)]',
        disabled && 'pointer-events-none opacity-50',
        drag
          ? 'scale-[1.01] border-brand-500 bg-brand-50/70 dark:border-brand-400 dark:bg-brand-500/10'
          : 'border-[var(--app-border-strong)] bg-[var(--app-subtle)] hover:border-brand-400 hover:bg-brand-50/40 dark:hover:border-brand-500/60 dark:hover:bg-white/[0.03]',
      )}
      onDragEnter={disabled ? undefined : onDragEnter}
      onDragLeave={disabled ? undefined : onDragLeave}
      onDragOver={disabled ? undefined : onDragOver}
      onDrop={disabled ? undefined : onDrop}
    >
      <input ref={ref} type="file" accept={accept} className="sr-only" disabled={disabled} onChange={onFileChange} aria-label={inputAriaLabel} tabIndex={-1} onClick={(e) => e.stopPropagation()} />
      <span
        className={cn(
          'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--app-elevated)] text-brand-600 shadow-sm ring-1 ring-[var(--app-border)] transition-transform dark:text-brand-300',
          drag ? '-translate-y-1 scale-110' : 'group-hover:-translate-y-0.5',
        )}
      >
        <FileUp size={26} strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-4 text-[14.5px] font-semibold text-[var(--app-fg)]">
        {drag ? 'Relâchez pour ajouter le fichier' : `Glissez votre fichier ${fileKindLabel} ici`}
      </p>
      <p className="mt-1 text-[13px] text-[var(--app-muted)]">
        ou <span className="font-semibold text-brand-700 underline-offset-2 group-hover:underline dark:text-brand-200">parcourez vos fichiers</span>
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        {formats.map((f) => (
          <span key={f} className="rounded-md bg-[var(--app-elevated)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--app-fg-soft)] ring-1 ring-inset ring-[var(--app-border)]">
            .{f.toLowerCase()}
          </span>
        ))}
        <span className="rounded-md bg-[var(--app-elevated)] px-2 py-0.5 text-[11px] text-[var(--app-muted)] ring-1 ring-inset ring-[var(--app-border)]">{MAX_FILE_SIZE_LABEL} max.</span>
      </div>
      <p id={hintId} className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] text-[var(--app-muted)]">
        <ShieldCheck size={13} aria-hidden /> Le fichier est contrôlé sur votre appareil avant tout envoi.
      </p>
    </div>
  )
})
