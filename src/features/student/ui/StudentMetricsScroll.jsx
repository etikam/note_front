import { GraduationCap } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/**
 * Bandeau métriques académiques — scroll horizontal sur mobile, grille sur desktop.
 * Aligné sur la « Synthèse académique » de la fiche enseignant.
 */
export function StudentMetricsScroll({ summary, cohorteLabel, className }) {
  const gpa = summary?.average_gpa
  const items = [
    {
      id: 'gpa',
      label: 'Moyenne',
      hint: 'notes publiées',
      value: gpa != null ? Number(gpa).toFixed(2) : '—',
      emphasize: true,
    },
    {
      id: 'credits',
      label: 'Crédits validés',
      value: String(summary?.credits_earned ?? 0),
    },
    {
      id: 'passed',
      label: 'Cours réussis',
      value: String(summary?.passed_courses_count ?? 0),
    },
    {
      id: 'cohort',
      label: 'Cohorte',
      value: cohorteLabel || '—',
      compact: true,
    },
  ]

  return (
    <section className={cn('space-y-2', className)} aria-label="Synthèse académique">
      <div className="flex items-center gap-2 px-0.5">
        <GraduationCap size={18} className="text-brand-600 dark:text-brand-300" aria-hidden />
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--app-muted)]">Synthèse académique</h2>
      </div>

      <div
        className={cn(
          'flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'md:grid md:grid-cols-4 md:overflow-visible md:gap-3',
        )}
      >
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              'shrink-0 w-[9.5rem] rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-600 to-brand-800 p-3 text-white shadow-sm',
              'md:w-auto md:min-w-0',
              item.compact && 'w-[11rem] md:w-auto',
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/75">
              {item.label}
              {item.hint ? <span className="block normal-case tracking-normal opacity-80">({item.hint})</span> : null}
            </p>
            <p
              className={cn(
                'mt-1 font-heading font-bold tabular-nums leading-tight',
                item.emphasize ? 'text-2xl' : 'text-xl',
                item.compact && 'text-sm font-semibold line-clamp-2',
              )}
            >
              {item.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
