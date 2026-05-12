import { Link } from 'react-router-dom'
import { ArrowLeft, PieChart } from 'lucide-react'

import { MAX_FILE_SIZE_LABEL } from '@/features/teacher/students/ui/import/import.constants'
import { Button } from '@/shared/ui/Button'

/** @typedef {import('react').ReactNode} ReactNode */

const DEFAULT_TITLE = 'Import étudiants'
const DEFAULT_KICKER = 'Gestion académique'

/**
 * @param {{
 *   canViewReports?: boolean
 *   backTo?: string
 *   backLabel?: string
 *   kicker?: string
 *   title?: string
 *   description?: ReactNode
 * }} props
 */
export function ImportPageHeader({
  canViewReports = false,
  backTo = '/teacher/students/list',
  backLabel = 'Retour à l’annuaire',
  kicker = DEFAULT_KICKER,
  title = DEFAULT_TITLE,
  description,
}) {
  const resolvedDescription =
    description ?? (
      <>
        Importez des dossiers étudiants à partir d’un fichier CSV institutionnel. Taille max.{' '}
        {MAX_FILE_SIZE_LABEL} — l’aperçu et le contrôle des en-têtes se font sur votre appareil avant envoi au
        serveur.
      </>
    )

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-300"
        >
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-600 dark:text-secondary-400 mb-1.5">
          {kicker}
        </p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">{resolvedDescription}</p>
      </div>
      {canViewReports ? (
        <Button
          as={Link}
          to="/teacher/reports"
          variant="ghost"
          className="shrink-0 border border-zinc-200 dark:border-[var(--app-border)]"
        >
          <PieChart size={16} aria-hidden />
          Rapports
        </Button>
      ) : null}
    </header>
  )
}
