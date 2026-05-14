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
            Encodage <strong className="text-zinc-800 dark:text-zinc-200">UTF-8</strong> obligatoire (caractères accentués). Sous Excel&nbsp;: Fichier → Enregistrer sous → CSV UTF-8 (délimité par des virgules).
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
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">status</code>,{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">phone</code>,{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">birth_date</code> (YYYY-MM-DD),{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">cohorte_promotion</code>{' '}
            (numéro métier de la cohorte ex.&nbsp;18, 15) et{' '}
            <code className="rounded bg-white px-1 py-0.5 font-mono text-xs dark:bg-[color-mix(in_srgb,var(--app-elevated)_78%,white)]">cohorte_annee_entree</code>{' '}
            (année académique exacte «&nbsp;2024-2025&nbsp;»)&nbsp;: à fournir si plusieurs cohortes partagent le même numéro.
          </li>
        </ul>
      </div>
    </details>
  )
}
