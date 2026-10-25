import { MAX_FILE_SIZE_LABEL } from '@/features/teacher/students/ui/import/import.constants'

/** @typedef {import('react').ReactNode} ReactNode */

const DEFAULT_TITLE = 'Import étudiants'

/**
 * Introduction d'un onglet d'import : la page (Étudiants, Enseignants) porte déjà le titre
 * principal et les onglets ; ici, un intitulé de section et son explication.
 *
 * @param {{ title?: string, description?: ReactNode, actions?: ReactNode }} props
 */
export function ImportPageHeader({ title = DEFAULT_TITLE, description, actions }) {
  const resolvedDescription =
    description ?? (
      <>
        Importez des dossiers étudiants à partir d’un fichier CSV institutionnel. Taille max. {MAX_FILE_SIZE_LABEL} —
        l’aperçu et le contrôle des en-têtes se font sur votre appareil avant l’envoi.
      </>
    )

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-heading text-[16px] font-semibold tracking-tight text-[var(--app-fg)]">{title}</h2>
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[var(--app-muted)]">{resolvedDescription}</p>
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  )
}
