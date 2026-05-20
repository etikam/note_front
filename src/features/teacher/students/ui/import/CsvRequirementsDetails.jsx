import { ChevronDown } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/**
 * Règles CSV détaillées — progressive disclosure.
 */
export function CsvRequirementsDetails() {
  return (
    <details className="group rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-[var(--app-border)] dark:bg-[color-mix(in_srgb,var(--app-elevated)_92%,black)]">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-zinc-800',
          'dark:text-zinc-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-canvas)] rounded-lg',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <span>Règles du fichier et colonnes</span>
        <ChevronDown
          size={18}
          className="shrink-0 text-zinc-500 transition-transform group-open:rotate-180 dark:text-zinc-400"
          aria-hidden
        />
      </summary>
      <div className="border-t border-zinc-200 px-4 py-3 text-sm leading-relaxed text-zinc-600 dark:border-[var(--app-border)] dark:text-zinc-400">
        <ul className="list-disc space-y-2 pl-4">
          <li>
            Encodage <strong className="text-zinc-800 dark:text-zinc-200">UTF-8</strong> obligatoire (caractères accentués).
            Séparateur <strong className="text-zinc-800 dark:text-zinc-200">virgule</strong> ou{' '}
            <strong className="text-zinc-800 dark:text-zinc-200">point-virgule</strong> (export Excel régional).
            Sous Excel&nbsp;: Fichier → Enregistrer sous → CSV UTF-8.
          </li>
          <li>
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">level_cycle</code>
            &nbsp;: <strong>LICENCE</strong>, <strong>MASTER</strong> ou <strong>DOCTORAT</strong>.
          </li>
          <li>
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">department_code</code>
            &nbsp;: code département institutionnel (ex.&nbsp;DL, NTIC).
          </li>
          <li>
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">level_number</code>
            &nbsp;: entier attendu selon votre référentiel.
          </li>
          <li>
            Colonnes facultatives&nbsp;:{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">gender</code>,{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">phone</code>,{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">birth_date</code>{' '}
            (YYYY-MM-DD ou JJ/MM/AAAA),{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">dad_name</code> /{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">mum_name</code>{' '}
            (filiation — nom du père et de la mère ; alias acceptés&nbsp;:{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">nom_pere</code>,{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">nom_mere</code>),{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">cohorte_promotion</code>{' '}
            (numéro métier de la cohorte ex.&nbsp;18, 15). La colonne{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">cohorte_annee_entree</code>{' '}
            est ignorée si elle est encore présente dans le fichier.
          </li>
        </ul>
      </div>
    </details>
  )
}
