import { CheckCheck, Download, FileUp, ScanSearch, Upload } from 'lucide-react'

import { MAX_FILE_SIZE_LABEL } from '@/features/teacher/students/ui/import/import.constants'

/** @typedef {import('react').ReactNode} ReactNode */

const DEFAULT_TITLE = 'Import étudiants'

const STEPS = [
  { icon: Download, label: 'Modèle', text: 'Téléchargez le modèle' },
  { icon: FileUp, label: 'Fichier', text: 'Remplissez-le, déposez-le' },
  { icon: ScanSearch, label: 'Contrôle', text: 'Vérification immédiate' },
  { icon: CheckCheck, label: 'Import', text: 'Enregistrement et rapport' },
]

/**
 * En-tête d'un parcours d'import : icône, titre, explication et les quatre temps du parcours.
 *
 * @param {{ title?: string, description?: ReactNode, actions?: ReactNode, icon?: import('react').ComponentType }} props
 */
export function ImportPageHeader({ title = DEFAULT_TITLE, description, actions, icon: Icon = Upload }) {
  const resolvedDescription =
    description ?? (
      <>
        Importez des dossiers étudiants à partir d’un fichier CSV institutionnel (taille max. {MAX_FILE_SIZE_LABEL}). L’aperçu et le contrôle se font sur votre appareil avant l’envoi.
      </>
    )

  return (
    <header className="relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-elevated)]">
      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm dark:bg-brand-500">
            <Icon size={21} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-[18px] font-semibold tracking-tight text-[var(--app-fg)]">{title}</h2>
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[var(--app-muted)]">{resolvedDescription}</p>
          </div>
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
      <ol className="relative grid grid-cols-2 border-t border-[var(--app-border)] sm:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2.5 border-[var(--app-border)] px-5 py-3 max-sm:odd:border-r sm:[&:not(:last-child)]:border-r">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--app-subtle)] text-[var(--app-fg-soft)] ring-1 ring-inset ring-[var(--app-border)]">
              <s.icon size={14} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[10.5px] font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                {i + 1}. {s.label}
              </span>
              <span className="block truncate text-[12px] text-[var(--app-fg-soft)]">{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </header>
  )
}
