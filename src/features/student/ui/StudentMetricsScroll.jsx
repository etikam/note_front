import { GraduationCap } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

/**
 * Bandeau métriques académiques — scroll horizontal sur mobile, grille sur desktop.
 */
export function StudentMetricsScroll({ summary, academicContext, className }) {
  const gpa = summary?.average_gpa
  const credits = summary?.credits_earned ?? 0
  const passedCourses = summary?.passed_courses_count ?? 0
  const passedUe = summary?.passed_ue_count ?? 0
  const debt = summary?.debt_courses_count ?? 0
  const makeup = summary?.needs_makeup_courses_count ?? 0

  const items = [
    {
      id: 'gpa',
      label: 'Moyenne',
      hint: 'publiées & validées',
      value: gpa != null ? Number(gpa).toFixed(2) : '—',
      emphasize: true,
    },
    {
      id: 'credits',
      label: 'Crédits validés',
      hint: `${passedCourses} cours réussis`,
      value: String(credits),
      emphasize: true,
    },
    {
      id: 'passed-ue',
      label: 'UE validé',
      value: String(passedUe),
    },
    {
      id: 'level',
      label: 'Parcours',
      hint: academicContext?.level_cycle_label || undefined,
      value: academicContext?.position_label || '—',
      compact: true,
    },
  ]

  if (debt > 0 || makeup > 0) {
    items.push({
      id: 'alerts',
      label: 'À suivre',
      hint: [debt > 0 ? `${debt} dette(s)` : null, makeup > 0 ? `${makeup} rattrapage(s)` : null]
        .filter(Boolean)
        .join(' · '),
      value: String(debt + makeup),
    })
  }

  return (
    <section className={cn('space-y-2', className)} aria-label="Synthèse académique">
      <div className="flex items-center gap-2 px-0.5">
        <GraduationCap size={18} className="text-brand-600 dark:text-brand-300" aria-hidden />
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--app-muted)]">Synthèse académique</h2>
      </div>

      <div
        className={cn(
          'flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'md:grid md:overflow-visible md:gap-3',
          items.length <= 4 ? 'md:grid-cols-4' : 'md:grid-cols-5',
        )}
      >
        {items.map((item) => (
          <article
            key={item.id}
            className={cn(
              'shrink-0 w-[9.5rem] rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-600 to-brand-800 p-3 text-white shadow-sm',
              'md:w-auto md:min-w-0',
              item.compact && 'w-[11.5rem] md:w-auto',
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/75">
              {item.label}
              {item.hint ? (
                <span className="mt-0.5 block normal-case tracking-normal text-[11px] font-medium opacity-85">
                  {item.hint}
                </span>
              ) : null}
            </p>
            <p
              className={cn(
                'mt-1.5 font-heading font-bold tabular-nums leading-tight',
                item.emphasize ? 'text-2xl' : 'text-xl',
                item.compact && 'text-sm font-semibold leading-snug',
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
