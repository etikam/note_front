import { BookOpen, FileText, GraduationCap, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '@/shared/lib/cn'

const BASE_ACTIONS = [
  { to: '/student/courses', label: 'Mes cours', icon: BookOpen, description: 'Parcours & inscriptions' },
  { to: '/student/grades', label: 'Mes notes', icon: FileText, description: 'Relevé publié' },
  { to: '/student/enrollments', label: 'Inscriptions', icon: GraduationCap, description: 'Demandes & statuts' },
]

export function StudentQuickActions({ canManagePromotion = false, className }) {
  const actions = canManagePromotion
    ? [...BASE_ACTIONS, { to: '/student/promotion', label: 'Ma promotion', icon: Users, description: 'Effectif cohorte' }]
    : BASE_ACTIONS

  return (
    <section className={cn('space-y-3', className)} aria-label="Accès rapide">
      <h2 className="px-0.5 text-sm font-bold uppercase tracking-wide text-[var(--app-muted)]">Accès rapide</h2>
      <div
        className={cn(
          'flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'sm:grid sm:grid-cols-2 sm:overflow-visible sm:gap-3 lg:grid-cols-4',
          canManagePromotion && 'lg:grid-cols-5',
        )}
      >
        {actions.map(({ to, label, icon: Icon, description }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'group flex min-h-[72px] min-w-[8.75rem] shrink-0 flex-col justify-center gap-0.5 rounded-xl',
              'border border-[var(--app-border)] bg-[var(--app-elevated)] px-3.5 py-3',
              'transition-colors hover:border-brand-500/30 hover:bg-brand-500/[0.04]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]',
              'sm:min-w-0',
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--app-fg)]">
              <Icon size={18} className="shrink-0 text-brand-600 dark:text-brand-300" aria-hidden />
              {label}
            </span>
            <span className="text-[11px] leading-snug text-[var(--app-muted)] group-hover:text-[var(--app-fg)]/80">
              {description}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
