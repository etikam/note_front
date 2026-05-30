import { forwardRef } from 'react'
import { UploadCloud } from 'lucide-react'

import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/Button'

const hintId = 'import-dropzone-hint'

/**
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
  return (
    <div
      role="region"
      aria-label={`Zone de dépôt du fichier ${fileKindLabel}`}
      aria-describedby={hintId}
      className={cn(
        'rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors outline-none',
        'focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 focus-within:ring-offset-[var(--app-canvas)]',
        disabled && 'pointer-events-none opacity-50',
        drag
          ? 'border-brand-500 bg-brand-50/60 dark:border-brand-400 dark:bg-[color-mix(in_srgb,var(--app-elevated)_86%,black)]'
          : 'border-zinc-300 bg-zinc-50/40 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]',
      )}
      onDragEnter={disabled ? undefined : onDragEnter}
      onDragLeave={disabled ? undefined : onDragLeave}
      onDragOver={disabled ? undefined : onDragOver}
      onDrop={disabled ? undefined : onDrop}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={onFileChange}
        aria-label={inputAriaLabel}
      />
      <UploadCloud
        className="mx-auto text-zinc-400 dark:text-zinc-500"
        size={40}
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {drag ? 'Déposez le fichier pour l’ajouter' : `Déposez le fichier ${fileKindLabel} ici ou choisissez un fichier`}
      </p>
      <p id={hintId} className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Aperçu et contrôle des en-têtes sur votre appareil avant envoi au serveur.
      </p>
      <div className="mt-4 flex justify-center">
        <Button type="button" variant="primary" size="sm" disabled={disabled} onClick={onPickClick}>
          Choisir un fichier
        </Button>
      </div>
    </div>
  )
})
